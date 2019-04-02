package uk.co.bbc.rd.TimelineObserver;

import org.json.simple.JSONObject;

class PresentationTimestamp{

	private double contentTime;
	private double wallClockTime;
	private double speed;

	/**
	 * @param contentTime2
	 * @param wallClockTime2
	 * @param speed
	 * @param observationData TODO
	 */
	public PresentationTimestamp(double contentTime2, double wallClockTime2, double speed) {
		super();
		this.contentTime = contentTime2;
		this.wallClockTime = wallClockTime2;
		this.speed = speed;
	}

	public static PresentationTimestamp getInstance(JSONObject jsonObj)
	{
		Object contentTimeObj =  jsonObj.get("contentTime");
		Object wallClockTimeObj =  jsonObj.get("wallclockTime");
		Object speedObj =  jsonObj.get("speed");

		double contentTime = 0.0;

		if (contentTimeObj.getClass().getSimpleName().equalsIgnoreCase("Double"))
		{
			contentTime = ((Double) contentTimeObj).doubleValue();
		}else if (contentTimeObj.getClass().getSimpleName().equalsIgnoreCase("Long"))
		{
			contentTime = ((Long) contentTimeObj).doubleValue();
		}

		double wallclockTime = 0.0;

		if (wallClockTimeObj.getClass().getSimpleName().equalsIgnoreCase("Double"))
		{
			wallclockTime = ((Double) wallClockTimeObj).doubleValue();
		}else if (wallClockTimeObj.getClass().getSimpleName().equalsIgnoreCase("Long"))
		{
			wallclockTime = ((Long) wallClockTimeObj).doubleValue();
		}

		double speed = 0.0f;

		if (speedObj.getClass().getSimpleName().equalsIgnoreCase("Double"))
		{
			speed = ( (Double) speedObj).doubleValue();
		}else if (speedObj.getClass().getSimpleName().equalsIgnoreCase("Long"))
		{
			speed = ((Long) speedObj).doubleValue();
		}

		PresentationTimestamp instance = new PresentationTimestamp(contentTime,wallclockTime, speed);
		return instance;	
	}

	/**
	 * @return the contentTime
	 */
	public double getContentTime() {
		return contentTime;
	}

	/**
	 * @param contentTime the contentTime to set
	 */
	public void setContentTime(double contentTime) {
		this.contentTime = contentTime;
	}

	/**
	 * @return the wallClockTime
	 */
	public double getWallClockTime() {
		return wallClockTime;
	}

	/**
	 * @param wallClockTime the wallClockTime to set
	 */
	public void setWallClockTime(double wallClockTime) {
		this.wallClockTime = wallClockTime;
	}

	/**
	 * @return the speed
	 */
	public double getSpeed() {
		return speed;
	}

	/**
	 * @param speed the speed to set
	 */
	public void setSpeed(double speed) {
		this.speed = speed;
	}
	
	@Override
	public String toString() {

		return "contentTime: " + this.contentTime + " wallclockTime: " + this.wallClockTime + " speed: " + this.speed;
	}
	
	
	public String toJSON() {

		return "{"
				+ "\"contentTime\" : " + this.contentTime 
				+ ", \"wallclockTime\": " + this.wallClockTime 
				+ " \"speed\":" + this.speed
				+ "}";
	}

}