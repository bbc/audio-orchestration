/**
 * 
 */
package uk.co.bbc.rd.TimelineObserver;

import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.logging.Level;
import java.util.logging.Logger;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.MqttSecurityException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;




/**
 * @author Rajiv Ramdhany
 * A reader of timeline updates. For each  timeline update message it receives, it creates a TimelineObservation object
 * and adds it to a job queue for the ObservationFilter to process.
 */
public class ObservationReader implements MqttCallback, Runnable{

	/* MQTT topic or pattern for subscription */
	private List<String> topics;

	/* IP address: port of data producer */
	private String brokerAddr;

	private int qos;

	private MqttClient mqttClient;

	private BlockingQueue<Observation> jobList;

	private static final Logger logger =
			Logger.getLogger(ObservationReader.class.getName());
	
	
	private JSONParser jsonParser;
	
	private String mqttClientId;


	public ObservationReader(String sourceAddr, List<String> topicFilters, BlockingQueue<Observation> observationsQ) {
		super();
		this.topics = topicFilters;
		this.brokerAddr = sourceAddr;
		this.qos = 0;
		this.jobList = observationsQ;
		this.jsonParser =  new JSONParser();

	}

	public void connectionLost(Throwable cause) {
		try {
			if (this.mqttClient != null)
				mqttClient.close();
			MemoryPersistence persistence = new MemoryPersistence();

			this.mqttClient = new MqttClient("tcp://" + this.brokerAddr, this.mqttClientId, persistence);
			this.mqttClient.setCallback(this);
			this.mqttClient.connect();

			this.topics.forEach(topic -> { 
				try {
					this.mqttClient.subscribe(topic, qos);
					logger.info("subscribed to topic: " + topic);
				} catch (MqttException e) {
					logger.warning("error subscribing to topic: " + e.getCause());
				}				
			});

		}catch (MqttSecurityException e) {
			logger.log(Level.SEVERE, "Error subscribing to channel" + e);
		} catch (MqttException e) {
			logger.log(Level.SEVERE, "Error connecting to broker " + this.brokerAddr + " " + e);
		}

	}


	public void messageArrived(String topic, MqttMessage message) throws Exception {

		String msg =  new String(message.getPayload());

//		logger.info("ObservationReader received message: " + msg + " on topic:"+ topic);

		
		try {
			Object obj = jsonParser.parse(msg);
			JSONObject jsonObject = (JSONObject) obj;

			String msgType = (String) jsonObject.get("type");

			if (msgType.equalsIgnoreCase("TimelineUpdate"))
			{
				TimelineObservation timelineUpdate = TimelineObservation.getInstance(jsonObject);
				this.jobList.put(timelineUpdate);
			}

		} catch (ParseException e) {
			logger.info("error parsing message: " + msg);
		}
	}


	public void deliveryComplete(IMqttDeliveryToken token) {
		// TODO Auto-generated method stub

	}


	public void run() {
		try {
			if (this.mqttClient != null)
				mqttClient.close();
			
			MemoryPersistence persistence = new MemoryPersistence();
			this.mqttClientId = MqttClient.generateClientId();
			this.mqttClient = new MqttClient("tcp://" + this.brokerAddr,this.mqttClientId, persistence);
			this.mqttClient.setCallback(this);
			this.mqttClient.connect();

			this.topics.forEach(topic -> { 
				try {
					this.mqttClient.subscribe(topic, qos);
					logger.info("subscribed to topic: " + topic);
				} catch (MqttException e) {
					logger.warning("error subscribing to topic: " + e.getCause());
				}				
			});

		}catch (MqttSecurityException e) {
			logger.log(Level.SEVERE, "Error subscribing to channel" + e);
		} catch (MqttException e) {
			logger.log(Level.SEVERE, "Error connecting to broker " + this.brokerAddr + " " + e);
		}
	}



}
