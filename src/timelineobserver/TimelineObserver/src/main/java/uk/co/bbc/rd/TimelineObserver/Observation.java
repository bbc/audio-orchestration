/**
 * 
 */
package uk.co.bbc.rd.TimelineObserver;

/**
 * @author rajivr
 *
 */
public class Observation {
	
	public String sourceId;
	public Object data;
	/**
	 * @param sourceId
	 * @param data
	 */
	public Observation(String sourceId, Object data) {
		this.sourceId = sourceId;
		this.data = data;
	}
	/**
	 * @param sourceId
	 */
	public Observation(String sourceId) {
		this.sourceId = sourceId;
	}	
	

	public Observation() {


	}
}

//INFO: Topic: Sessions/rajiv_session/timelines/urn:rajiv_home_1:44aa6fe6-45b1-455f-88b5-94bd33a57756:dmlkZW8ubXA0/state, 
//message: {"type":"TimelineUpdate","sessionId":"rajiv_session","deviceId":"44aa6fe6-45b1-455f-88b5-94bd33a57756","timelineId":"urn:rajiv_home_1:44aa6fe6-45b1-455f-88b5-94bd33a57756:dmlkZW8ubXA0","timelineType":"tag:rd.bbc.co.uk,2015-12-08:dvb:css:timeline:simple-elapsed-time:1000","contentId":"video.mp4","presentationTimestamp":{"earliest":{"contentTime":117226,"wallclockTime":1518108021167,"speed":1},"actual":{"contentTime":117227,"wallclockTime":1518108021168,"speed":1},"latest":{"contentTime":117227,"wallclockTime":1518108021168,"speed":1}},"id":null,"version":"0.0.1"}
