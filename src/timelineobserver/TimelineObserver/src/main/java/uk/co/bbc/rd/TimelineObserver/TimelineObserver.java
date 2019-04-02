package uk.co.bbc.rd.TimelineObserver;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ScheduledExecutorService;
import java.util.logging.ConsoleHandler;
import java.util.logging.LogRecord;
import java.util.logging.Logger;
import java.util.logging.SimpleFormatter;

import com.nurkiewicz.asyncretry.AsyncRetryExecutor;
import com.nurkiewicz.asyncretry.RetryExecutor;
import com.orbitz.consul.CatalogClient;
import com.orbitz.consul.Consul;
import com.orbitz.consul.model.ConsulResponse;
import com.orbitz.consul.model.catalog.CatalogService;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;




public class TimelineObserver 
{
	private String serviceRegistryAddr;
	private Consul consul;
	/* Logger */
	private static Logger logger = null;
	
	static {
	      Logger mainLogger = Logger.getLogger("uk.co.bbc.rd.TimelineObserver");
	      mainLogger.setUseParentHandlers(false);
	      ConsoleHandler handler = new ConsoleHandler();
	      handler.setFormatter(new SimpleFormatter() {
	          private static final String format = "[%1$tF %1$tT] [%2$-7s] %3$s %n";

	          @Override
	          public synchronized String format(LogRecord lr) {
	              return String.format(format,
	                      new Date(lr.getMillis()),
	                      lr.getLevel().getLocalizedName(),
	                      lr.getMessage()
	              );
	          }
	      });
//	      mainLogger.addHandler(handler);
	      logger = Logger.getLogger(TimelineObserver.class.getName());
	}
	
	private String brokerServiceName;
	private String brokerLookUpName;
	private int brokerLookUpPort;
	
	private CatalogService brokerService;
	private List<String> brokerTopics;
	
	private String dbServiceName;
	private String redisLookUpName;
	private int redisLookUpPort;
	private BlockingQueue<Observation> internalQueue;
	
	private JedisPool jedisPool;
	
	private String servicesHost;
//redis-smq-default|@1.1|cloudsync_synccontroller_waitqueue
	private final static String SYNC_CONTROLLER_WAITQUEUE = "redis-smq-default|@1.1|cloudsync_synccontroller_waitQueue";
	
	private final static int NUM_WRITER_THREADS= 5;

	// ---------------------------------------------------------------------------------------------------
	/**
	 * Constructor
	 * @param serviceRegistryAddr Consul server address
	 * @param brokerServiceName broker service name
	 * @param dbServiceName database service name
	 * @param brokerTopics list of topic names/filters to read messages from
	 */
	public TimelineObserver(String serviceRegistryAddr, String brokerName, int brokerPort, String dbServiceName, List<String> brokerTopics) {
		super();
		this.serviceRegistryAddr = serviceRegistryAddr;
		this.brokerLookUpName = brokerName;
		this.brokerLookUpPort = brokerPort;
		this.redisLookUpName = dbServiceName;
		this.brokerTopics = brokerTopics;
		this.internalQueue = new LinkedBlockingQueue<>();
	}
	
	
	public TimelineObserver(String serviceRegistryAddr, String brokerName, int brokerPort, String dbServiceName, List<String> brokerTopics, String servicesHostAddr) {
		super();
		this.serviceRegistryAddr = serviceRegistryAddr;
		this.brokerLookUpName = brokerName;
		this.brokerLookUpPort = brokerPort;
		this.redisLookUpName = dbServiceName;
		this.brokerTopics = brokerTopics;
		this.internalQueue = new LinkedBlockingQueue<>();
		this.servicesHost = servicesHostAddr;
	}
	
	
	// ---------------------------------------------------------------------------------------------------

	private String lookupServiceName(Consul consulClient, String name, int port) throws TimelineObserverException
	{
		String serviceName = null;
		
		CatalogClient catalogClient = consulClient.catalogClient();

		logger.info("Looking up service " + name);
		
		ConsulResponse<Map<String,List<String>>> response = catalogClient.getServices();
		
		Map<String,List<String>> servicesMap = response.getResponse();
		
		
		for (String key : servicesMap.keySet()) {
//			logger.info(key);
			
			if (port !=0)
			{
				if (key.contains(name) && key.contains(new Integer(port).toString())) {
					serviceName = key;
				}
			}else
			{
				if (key.contains(name)) {
					serviceName = key;
				}
			}			
		}
		
		return serviceName;
	}
	
	
	public CompletableFuture<String> lookupServiceAsync(Consul consulClient, String name, int port) 
	{
		ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
		RetryExecutor executor = new AsyncRetryExecutor(scheduler).
				retryOn(TimelineObserverException.class).
				withExponentialBackoff(500, 1).     //500ms times 2 after each retry
				withMaxDelay(10_000).               //10 seconds
				withUniformJitter().                //add between +/- 100 ms randomly
				withMaxRetries(10);

		return executor.getWithRetry(() ->lookupServiceName(consulClient, name, port));
	}
	
	// ---------------------------------------------------------------------------------------------------
	
	/**
	 * Discover a service endpoint from Consul in an async manner; supports retries
	 * @param serviceName
	 * @return service endpoint address
	 * @throws TimelineObserverException
	 */
	public CatalogService discoverService(Consul consulClient, String serviceName) throws TimelineObserverException
	{
		CatalogClient catalogClient = consulClient.catalogClient();

		logger.info("Looking up " + serviceName + " endpoint ...");
		ConsulResponse<List<CatalogService>> response = catalogClient.getService(serviceName);

		List<CatalogService> catServiceList = response.getResponse();

		if (catServiceList.size() > 0) {

			CatalogService service = catServiceList.get(0);
//			logger.info("found : " + service.getServiceAddress() + ":" + service.getServicePort() );
			return service;

		}else
			throw new TimelineObserverException(TimelineObserverException.SERVICE_NOT_FOUND);
	}

	// ---------------------------------------------------------------------------------------------------
	
	/**
	 * Asynchronous discover operation
	 * @param consulClient
	 * @param serviceName
	 * @return a {@link CompletableFuture} object
	 */
	public CompletableFuture<CatalogService> discoverServiceAsync(Consul consulClient, String serviceName) 
	{
		ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
		RetryExecutor executor = new AsyncRetryExecutor(scheduler).
				retryOn(TimelineObserverException.class).
				withExponentialBackoff(500, 1).     //500ms times 2 after each retry
				withMaxDelay(10_000).               //10 seconds
				withUniformJitter().                //add between +/- 100 ms randomly
				withMaxRetries(10);

		return executor.getWithRetry(() ->discoverService(consulClient, serviceName));
	}
	
	// ---------------------------------------------------------------------------------------------------
	

	/**
	 * 
	 * @param serviceRegistry
	 * @param dbServiceName
	 * @param brokerServiceName
	 * @param sourceChannels
	 */
	public void start()
	{
		// create a consul client
		consul = Consul.builder().withUrl("http://" + this.serviceRegistryAddr).build();
		
		// discover service endpoints
		ExecutorService exec = Executors.newCachedThreadPool();
		
		CompletableFuture<String>lookUpBrokerServiceNameFuture = CompletableFuture.supplyAsync(()->{
			try {
				return lookupServiceName(consul, brokerLookUpName, brokerLookUpPort);
			} catch (TimelineObserverException e) {
				return null;
			}
		},exec);
		
		CompletableFuture<CatalogService> msgBrokerDiscoveryFuture = lookUpBrokerServiceNameFuture.thenComposeAsync((brokerServiceName)->{
			this.brokerServiceName = brokerServiceName;
			return discoverServiceAsync(consul, brokerServiceName);
		},exec);
		
		
		CompletableFuture<String> lookUpDBServiceNameFuture = msgBrokerDiscoveryFuture.thenComposeAsync((brokerService)->{
			this.brokerService = brokerService;
			logger.info("Found " + brokerService.getServiceName() + " service: " +  brokerService.getServiceAddress() + ":"+brokerService.getServicePort());
			return lookupServiceAsync(consul,redisLookUpName, redisLookUpPort);
		},exec);
		
		CompletableFuture<CatalogService> dbDiscoveryFuture = lookUpDBServiceNameFuture.thenComposeAsync((redisServiceName)->{
			
			this.dbServiceName = redisServiceName;
			return discoverServiceAsync(consul, dbServiceName);
		}, exec);

		CompletableFuture<Void> startFuture = dbDiscoveryFuture.thenAcceptAsync((dbService)->{

			logger.info("Found " + dbService.getServiceName() + " service: " +  dbService.getServiceAddress() + ":" + dbService.getServicePort());
			
			jedisPool = new JedisPool( servicesHost !=null ? servicesHost : dbService.getServiceAddress(), dbService.getServicePort());
			
			logger.info("DB client connection setup... done.");
			Jedis redisClient = jedisPool.getResource();

			ExecutorService executorService = Executors.newFixedThreadPool(1);
			ObservationReader reader = new ObservationReader(servicesHost !=null ? servicesHost : this.brokerService.getServiceAddress()+ ":" + this.brokerService.getServicePort(), this.brokerTopics, this.internalQueue);
			executorService.execute(reader);
			logger.info("Observation reader setup... done.");
			
			ExecutorService executor = Executors.newFixedThreadPool(1);
			
			int threadCounter = 0;
			while (threadCounter < NUM_WRITER_THREADS) {
	            threadCounter++;
	            // Adding threads one by one
	            logger.info("Starting pres-timestamp-filter thread : " + threadCounter);
	            executor.execute(new ObservationFilter(redisClient,this.internalQueue, TimelineObserver.SYNC_CONTROLLER_WAITQUEUE));
	        }
			
		}, exec);
		
		startFuture.join();

	}
	
	// ---------------------------------------------------------------------------------------------------
	
	void stop() {
		
	}
	
	// ---------------------------------------------------------------------------------------------------
	
	
}
