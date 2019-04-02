package uk.co.bbc.rd.TimelineObserver;

public class TimelineObserverException extends Exception {

	private static final long serialVersionUID = -8231062619710816912L;
	public static final byte INVALID_PROPERTY			 		= 1;
	public static final byte UNKNOWN_HOST						= 2;
	public static final byte SOCKET_EXCEPTION 					= 3;
	public static final byte INTERRUPTED_EXCEPTION 				= 4;
	public static final byte IOEXCEPTION					 		= 5;
	public static final byte INVALID_SERVICE_REGISTRY				= 6;
	public static final byte SERVICE_NOT_FOUND				= 7;

	

	private final byte kind;

	public byte getKind() {
		return kind;
	}

	public TimelineObserverException(byte kind)
	{
		this.kind = kind;
	}

	public TimelineObserverException(byte kind, String msg)
	{
		super(msg);
		this.kind = kind;
	}

}
