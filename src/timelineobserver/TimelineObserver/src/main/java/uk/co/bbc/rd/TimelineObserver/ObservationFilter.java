/**
 * 
 */
package uk.co.bbc.rd.TimelineObserver;

import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.BlockingQueue;
import java.util.logging.ConsoleHandler;
import java.util.logging.Level;
import java.util.logging.LogRecord;
import java.util.logging.Logger;
import java.util.logging.SimpleFormatter;

import org.json.simple.JSONObject;

import com.google.protobuf.ByteString;

import redis.clients.jedis.Jedis;
import uk.co.rd.cloudsync.SyncEventsProtos.EventType;
import uk.co.rd.cloudsync.SyncEventsProtos.Header;
import uk.co.rd.cloudsync.SyncEventsProtos.SyncEvent;
import uk.co.rd.cloudsync.SyncEventsProtos.TimelineStateChange;
import uk.co.rd.cloudsync.SyncEventsProtos.TimelineStateChange.Builder;

/**
 *  Timeline Observation Consumer class
 * 
 * This class processes TimelineOnservation objects from a blocking queue.
 * If a TimelineObservation represents a significant timeline change from the previous observation,
 * it is saved to the Redis database and then added as a job on Redis in the SyncController job queue.
 * 
 * 
 */
public class ObservationFilter implements Runnable {

	/* Redis client */
	private Jedis jedis;

	/* Queue for holding timeline observations */
	private BlockingQueue<Observation> observationQ;

	/* Thread running check flag */
	private boolean running = true;

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
	      logger = Logger.getLogger(ObservationFilter.class.getName());
	}

	/* Timeline change threshold to trigger job posts to SyncController queue */
	private int timelineChangeThresholdMs;

	/* SyncController job queue name */
	private String syncControllerEventQ;
	
	public static int SIG_CHG_THRESH_MS = 50;


	private long counter;

	@SuppressWarnings("unused")
	private ObservationFilter()
	{
		counter = 0;
	}

	/**
	 * Constructor
	 * @param jedis
	 * @param observationQ
	 */
	public ObservationFilter(Jedis jedis, BlockingQueue<Observation> observationQ, String syncCJobQueue) {
		super();
		this.jedis = jedis;
		this.observationQ = observationQ;
		this.timelineChangeThresholdMs = SIG_CHG_THRESH_MS; // milliseconds
		this.syncControllerEventQ = syncCJobQueue;
		// cloudsync_synccontroller_waitQueue
	}

	/**
	 * Contructor 
	 * @param jedis a Jedis instance
	 * @param observationQ a BlockingQueue
	 * @param thresholdMs Timeline change threshold in milliseconds
	 */
	public ObservationFilter(Jedis jedis, BlockingQueue<Observation> observationQ, String syncCJobQueue, int thresholdMs) {
		super();
		this.jedis = jedis;
		this.observationQ = observationQ;
		this.timelineChangeThresholdMs = thresholdMs; // milliseconds
		this.syncControllerEventQ = syncCJobQueue;
	}


	/**
	 * @return the running property
	 */
	public boolean isRunning() {
		return running;
	}

	/**
	 * Setting this property to false will cause this Runnable object's run method to complete.
	 * @param running the running property to set
	 */
	public void setRunning(boolean running) {
		this.running = running;
	}


	private long incrCounter()
	{

		counter = (long) ((counter + 1) % 1e6);
		return counter;
	}


	/**
	 * Process a timeline observation and check if it represents a significant change on previously-saved timestamp.
	 * @param tObs
	 * @param tlChangeThresholdMs
	 * @return
	 */
	private boolean processTimelineObservation(TimelineObservation tObs, int tlChangeThresholdMs)
	{
		String timelineKey = "session:" + tObs.sessionId + ":timeline:" + tObs.timelineId;
		double TLRate = 0;
		double WCRate = 1e3;
		
		// get timeline frequency
		List<String> fieldValues = jedis.hmget(timelineKey, "frequency");
		if (fieldValues.size() > 0) {
			if (fieldValues.get(0) != null)
				TLRate = Double.valueOf(fieldValues.get(0));
			else
				return false;
		}
		else 
			return false;
		
		// determine if new timeline observation is a new change
		PresentationTimestamp prevObsTimestamp = TimelineObservation.getActualTimestampFromDB(tObs.sessionId, tObs.timelineId, this.jedis);
		
//		logger.info("Thread " + Thread.currentThread().getId() + " - processTimelineObservation(): timeline lastTimestamp from DB: " + prevObsTimestamp);

		if (prevObsTimestamp == null)
		{
			// save this timestamp in timeline stored object
			
			if (tObs.persistToDB(this.jedis))
				logger.info("Last timestamp for timeline  "  + tObs.timelineId + " updated.");
			
			// generate TimelineStateChange event
			if (enqueueTimelineStateChangeEvent(tObs, null)) logger.log(Level.INFO, "TimelineStateChange event enqueued.");

		}else if  (isSignificantChange(tObs.actual, prevObsTimestamp, TLRate, WCRate, tlChangeThresholdMs, tObs.timelineId))
		{
			// save this timestamp in timeline stored object
			if (tObs.persistToDB(this.jedis))
				logger.info("Thread " + Thread.currentThread().getId() + " - Last timestamp for timeline  "  + tObs.timelineId + " updated.");
			// Notify synccontrollers about this timeline state change via TimelineStateChange event
			if (enqueueTimelineStateChangeEvent(tObs, prevObsTimestamp)) logger.log(Level.INFO, "TimelineStateChange event enqueued.");
		}
		return true;
	}


	/**
	 * 
	 * @param tObs
	 * @param previous
	 * @return
	 */
	private boolean enqueueTimelineStateChangeEvent(TimelineObservation tObs, PresentationTimestamp previous) {

	
		try {
			JSONObject message = new JSONObject();
			message.put("event", buildTimelineStateChangeEvent(tObs, previous));

			JSONObject payload = new JSONObject();
			payload.put("uuid", UUID.randomUUID().toString());
			payload.put("attempts", 0);
			payload.put("scheduledRepeatCount", 0);
			payload.put("delayed", false);
			payload.put("body", message);
			payload.put("createdAt", System.currentTimeMillis());
			payload.put("ttl", 60000);

//			System.out.println(payload.toJSONString());

			// left push to a wait queue
			long numEvents = jedis.lpush(syncControllerEventQ,  payload.toJSONString());

			logger.info("Added TimelineStateChange event to queue " + syncControllerEventQ);
			logger.info(numEvents + " events in SyncController Wait Queue");

			return true;
		} catch (Exception e) {
			logger.warning("Error pushing event to queue: "+ e);

			return false;
		} 
	}


	private String buildTimelineStateChangeEvent(TimelineObservation tObs, PresentationTimestamp previous)
	{
		uk.co.rd.cloudsync.SyncEventsProtos.PresentationTimestamp prev = null, actual = null, earliest = null, latest = null; 

		// build header
		Header hdr = Header.newBuilder()
				.setEventType(EventType.TL_STATE_CHANGE)
				.setSessionId(tObs.sessionId)
				.setSenderId("TimelineObserver")
				.setVersion("1.0")
				.setEventId(new Long(incrCounter()).toString())
				.build();

		// build event body
		if (previous != null ) {
			prev = uk.co.rd.cloudsync.SyncEventsProtos.PresentationTimestamp.newBuilder()
					.setContentTime(previous.getContentTime())
					.setWallClockTime(previous.getWallClockTime())
					.setSpeed(previous.getSpeed())
					.setDispersion(0.0)
					.build();
		}
		if (tObs.actual != null ) {
			actual = uk.co.rd.cloudsync.SyncEventsProtos.PresentationTimestamp.newBuilder()
					.setContentTime(tObs.actual.getContentTime())
					.setWallClockTime(tObs.actual.getWallClockTime())
					.setSpeed(tObs.actual.getSpeed())
					.setDispersion(0.0)
					.build();
		}else
		{
			logger.log(Level.WARNING, "No actual presentation timestamp in timeline observation.");
		}

		if (tObs.earliest != null ) {
			earliest = uk.co.rd.cloudsync.SyncEventsProtos.PresentationTimestamp.newBuilder()
					.setContentTime(tObs.earliest.getContentTime())
					.setWallClockTime(tObs.earliest.getWallClockTime())
					.setSpeed(tObs.earliest.getSpeed())
					.setDispersion(0.0)
					.build();
		}

		if (tObs.latest != null ) {
			latest = uk.co.rd.cloudsync.SyncEventsProtos.PresentationTimestamp.newBuilder()
					.setContentTime(tObs.latest.getContentTime())
					.setWallClockTime(tObs.latest.getWallClockTime())
					.setSpeed(tObs.latest.getSpeed())
					.setDispersion(0.0)
					.build();
		}

		Builder tlstatechgEventBodyBuilder = TimelineStateChange.newBuilder()
				.setSourceId(tObs.sourceId)
				.setContentId(tObs.contentId)
				.setTimelineId(tObs.timelineId)
				.setTimelineType(tObs.timelineType);

		if (prev != null) tlstatechgEventBodyBuilder.setPrevious(prev);
		if (actual != null) tlstatechgEventBodyBuilder.setActual(actual);
		if (earliest != null) tlstatechgEventBodyBuilder.setEarliest(earliest);
		if (latest != null) tlstatechgEventBodyBuilder.setLatest(latest);

		ByteString tlstatechgEventBodyBytes = tlstatechgEventBodyBuilder.build().toByteString();

		SyncEvent syncevent = SyncEvent.newBuilder()
				.setHeader(hdr)
				.setBody(tlstatechgEventBodyBytes)
				.build();

		// serialise event object to a byte array before pushing into queue
		byte[] synceventbytes = syncevent.toByteArray();
		String synceventbytesEncoded =  Base64.getEncoder().encodeToString(synceventbytes);
		return synceventbytesEncoded;
	}


	/**
	 * Calculate if a new Presentation Timestamp represents a significant change on the timeline (whose state is being reported). 
	 * This method compares the new timestamp with a previously saved presentation timestamp to calculate the change in the timeline.  
	 * @param newTimestamp
	 * @param oldTimestamp
	 * @param timelineTickRate
	 * @param wcTickRate
	 * @param thresholdMs
	 * @param timelineId
	 * @return true if calculated change > threshold
	 */
	private boolean isSignificantChange(PresentationTimestamp newTimestamp, PresentationTimestamp oldTimestamp, double timelineTickRate, double wcTickRate, int thresholdMs, String timelineId)
	{

		int newSpeed = (int) newTimestamp.getSpeed();
		int oldSpeed = (int) oldTimestamp.getSpeed();


		if (newSpeed != oldSpeed)
			return true;

//		// use old timestamp to calculate predicted timestamp
//		logger.info("oldTimestamp: " + oldTimestamp.toString());
//		logger.info("newTimestamp: " + newTimestamp.toString());
//
//
//		double r = (oldTimestamp.getSpeed() * timelineTickRate)/wcTickRate;
//		double deltawct = newTimestamp.getWallClockTime() - oldTimestamp.getWallClockTime();
//		System.out.println("r = " + r);
//		System.out.println("deltawct = " + deltawct);
//		System.out.println("r * deltawct = " + (r*deltawct));


		double expectedContentTime = oldTimestamp.getSpeed() * (newTimestamp.getWallClockTime() - oldTimestamp.getWallClockTime()) * timelineTickRate / wcTickRate + oldTimestamp.getContentTime();
//		logger.info( "expected content time : " +  expectedContentTime);
//		logger.info( "actual content time : " +  newTimestamp.getContentTime());


		logger.info("Thread " + Thread.currentThread().getId() + " - Timeline: " + timelineId +" change : " + (newTimestamp.getContentTime() - expectedContentTime) + " ms");

		if (Math.abs(newTimestamp.getContentTime()- expectedContentTime) > thresholdMs)
			return true;


		return false;

	}

	/**
	 * Clean up. Close all clients.
	 */
	void cleanup()
	{
		this.jedis.close();
	}

	/* (non-Javadoc)
	 * @see java.lang.Runnable#run()
	 */
	@Override
	public void run() {

		Observation obs;
		logger.info("ObservationFilter " + Thread.currentThread().getId() + " ... started.");


		while(this.running)
		{
			if (this.observationQ !=null)
			{
				try {
					obs = observationQ.take();
					if (obs instanceof TimelineObservation) {
						TimelineObservation tObs = (TimelineObservation) obs;
						logger.info("Thread " + Thread.currentThread().getId() + " processing observation for timeline: " + 
								tObs.timelineId + " " + tObs.actual);
						processTimelineObservation(tObs, this.timelineChangeThresholdMs);
						
					}
				} catch (InterruptedException e) {
					logger.log(Level.WARNING, e.getMessage());
				}
			}
		}
		cleanup();
	}
}
