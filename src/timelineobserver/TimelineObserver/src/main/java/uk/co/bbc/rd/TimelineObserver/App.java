package uk.co.bbc.rd.TimelineObserver;


import java.util.ArrayList;
import java.util.Date;
import java.util.logging.ConsoleHandler;
import java.util.logging.LogRecord;
import java.util.logging.Logger;
import java.util.logging.SimpleFormatter;

import net.sourceforge.argparse4j.ArgumentParsers;
import net.sourceforge.argparse4j.inf.ArgumentParser;
import net.sourceforge.argparse4j.inf.ArgumentParserException;
import net.sourceforge.argparse4j.inf.Namespace;


public class App 
{
	private static Logger LOGGER = null;

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
	      mainLogger.addHandler(handler);
	      LOGGER = Logger.getLogger(App.class.getName());
	  }

	public static void main( String[] args )
    {
    	ArgumentParser parser = ArgumentParsers.newFor("TimelineObserverMain").build()
				.description("Reads timeline observations from MQTT broker and publishes events into Redis");

		parser.addArgument("-r", "--registry")
		.dest("registry")
		.type(String.class)
		.required(true)
		.help("Consul server endpoint address <IP address:port number>");

		parser.addArgument("-b","--broker")
		.dest("broker")
		.type(String.class)
		.required(true)
		.help("MQTT broker service name");
		
		parser.addArgument("-s","--servicesHost")
		.dest("host")
		.type(String.class)
		.required(false)
		.help("use addr for service hosts");


		parser.addArgument("-d", "--db")
		.dest("db")
		.type(String.class)
		.required(true)
		.help("db: redis service name");

		parser.addArgument("-t", "--topics")
		.dest("topics")
		.metavar("TOPIC_FILTER")
		.type(String.class)
		.nargs("+")
		.help("topic names on broker");
		
		
		Namespace ns = null;
		try {
			ns = parser.parseArgs(args);
			//System.out.println(ns.getList("topics").get(0));
			
		} catch (ArgumentParserException e) {
			parser.handleError(e);
			System.exit(1);
		}

		ArrayList<String> topics = new ArrayList<>();
		topics.add("Sessions/+/timelines/+/state");
		
		String servicesHostAddr = ns.getString("host");
		
		TimelineObserver observer;
		
		if (servicesHostAddr != null) {
			observer = new TimelineObserver(ns.getString("registry"),  ns.getString("broker"), 1883, ns.getString("db"), ns.getList("topics") , servicesHostAddr);
		}else
		{
			observer = new TimelineObserver(ns.getString("registry"),  ns.getString("broker"), 1883, ns.getString("db"), ns.getList("topics"));
		}
		
		 

		observer.start();
    }
}
