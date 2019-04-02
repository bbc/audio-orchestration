package uk.co.bbc.rd.TimelineObserver;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

import redis.clients.jedis.Jedis;

public class TimelineObservation extends Observation{


	public String sessionId;
	public String contentId;
	public String timelineId;
	public String timelineType;
	public PresentationTimestamp actual;
	public PresentationTimestamp earliest;
	public PresentationTimestamp latest;


	public TimelineObservation(String sourceId) {
		super(sourceId);
	}

	public TimelineObservation() {
		super();
	}

	/**
	 * @param sourceId
	 * @param sessionId
	 * @param contentId
	 * @param timelineId
	 * @param timelineType
	 * @param actual
	 * @param earliest
	 * @param latest
	 */
	public TimelineObservation(String sourceId, String sessionId, String contentId, String timelineId,
			String timelineType, PresentationTimestamp actual, PresentationTimestamp earliest,
			PresentationTimestamp latest) {
		super(sourceId);
		this.sessionId = sessionId;
		this.contentId = contentId;
		this.timelineId = timelineId;
		this.timelineType = timelineType;
		this.actual = actual;
		this.earliest = earliest;
		this.latest = latest;
	}



	public static TimelineObservation getInstance(String obsJSON)
	{
		JSONParser parser = new JSONParser();

		TimelineObservation instance = new TimelineObservation();

		try {
			Object obj = parser.parse(obsJSON);
			JSONObject jsonObject = (JSONObject) obj;

			instance.sessionId = (String) jsonObject.get("sessionId");
			instance.contentId = (String) jsonObject.get("contentId");
			instance.timelineId = (String) jsonObject.get("timelineId");
			instance.timelineType =  (String) jsonObject.get("timelineType");
			instance.sourceId = (String) jsonObject.get("deviceId");

			JSONObject presTimestampObj = (JSONObject) jsonObject.get("presentationTimestamp");

			JSONObject actualObj = (JSONObject) presTimestampObj.get("actual");
			JSONObject earliestObj = (JSONObject) presTimestampObj.get("earliest");
			JSONObject latestObj = (JSONObject) presTimestampObj.get("latest");			
			if (actualObj != null)
			{
				instance.actual = PresentationTimestamp.getInstance(actualObj);
			}

			if (earliestObj != null)
			{
				instance.earliest = PresentationTimestamp.getInstance(earliestObj);
			}

			if (latestObj != null)
			{
				instance.latest = PresentationTimestamp.getInstance(latestObj);
			}
			return instance;
		} catch (ParseException e) {
			return null;
		}

	}


	public static TimelineObservation getInstance(JSONObject jsonObject)
	{
		TimelineObservation instance = new TimelineObservation();

		instance.sessionId = (String) jsonObject.get("sessionId");
		instance.contentId = (String) jsonObject.get("contentId");
		instance.timelineId = (String) jsonObject.get("timelineId");
		instance.timelineType =  (String) jsonObject.get("timelineType");
		instance.sourceId = (String) jsonObject.get("deviceId");

		JSONObject presTimestampObj = (JSONObject) jsonObject.get("presentationTimestamp");

		JSONObject actualObj = (JSONObject) presTimestampObj.get("actual");
		JSONObject earliestObj = (JSONObject) presTimestampObj.get("earliest");
		JSONObject latestObj = (JSONObject) presTimestampObj.get("latest");			
		if (actualObj != null)
		{
			instance.actual = PresentationTimestamp.getInstance(actualObj);
		}

		if (earliestObj != null)
		{
			instance.earliest = PresentationTimestamp.getInstance(earliestObj);
		}

		if (latestObj != null)
		{
			instance.latest = PresentationTimestamp.getInstance(latestObj);
		}
		return instance;

	}


	public String getDBKey()
	{
		return "session:" + this.sessionId + ":timeline:" + this.timelineId;
	}

	public boolean persistToDB(Jedis jedis)
	{

		// save only actual presentation timestamp for this observation	
		String timelineKey = getDBKey();
		String actualPTFieldKey = "lastTimestamp";

		@SuppressWarnings("deprecation")
		String actualPTJson = 	"{ \"wallclockTime\": " + new Double(this.actual.getWallClockTime()).toString() + ", " +
				"\"contentTime\": " + new Double(this.actual.getContentTime()).toString() + ", " +
				"\"speed\": " + new Double(this.actual.getSpeed()).toString() + "}";
		
		System.out.println("ObservationFilter: saving timestamp as timeline lastTimestamp: \n" + actualPTJson);

		// save actual timestamp as timeline's lastTimestamp
		Map<String, String> actualPTObject = new HashMap<>();
		actualPTObject.put(actualPTFieldKey,actualPTJson);

		String status = jedis.hmset(timelineKey, actualPTObject);
	
		return status.equalsIgnoreCase("OK");
	}

	public static PresentationTimestamp getActualTimestampFromDB(String sessionId, String timelineId, Jedis jedis)
	{
		String timelineKey = "session:" + sessionId + ":timeline:" + timelineId;
		String actualPTFieldKey = "lastTimestamp";
		String actualPTJson;
		try {
			List<String> fieldValues = jedis.hmget(timelineKey, actualPTFieldKey);

			if ((fieldValues!=null) && (fieldValues.size() > 0))
			{
				actualPTJson = fieldValues.get(0);

				if (actualPTJson == null) return null;
				if (actualPTJson.length() == 0) return null;

				JSONParser parser = new JSONParser();
				Object obj = parser.parse(actualPTJson);
				JSONObject jsonObject = (JSONObject) obj;
				
				return PresentationTimestamp.getInstance(jsonObject);
			}else
				return null;

		} catch (ParseException e) {
			return null;
		}
	}

}
