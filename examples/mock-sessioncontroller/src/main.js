var EventEmitter = require("events"),
mqtt = require("mqtt")
SynckitCloud =  require("synckit-cloud");
const commandLineArgs = require('command-line-args')

var Messages = SynckitCloud.Messages;
var Message = SynckitCloud.Messages.Message;
var JoinREQ = SynckitCloud.Messages.JoinREQ;
var JoinRESP = SynckitCloud.Messages.JoinRESP;

var mqttbroker = { port: 1883, host: '0.0.0.0', keepalive: 10000};


var client = mqtt.connect(mqttbroker);



const optionDefinitions = [
  { name: 'sessionid', alias: 's', type: String }
];


const options = commandLineArgs(optionDefinitions);


var sessionId=options.sessionid;

if (typeof(options.sessionid) === "undefined")
{
  throw("Error - no sessionid argument supplied.");
}

client.on('connect', function () {
  console.log("connected to mqtt broker " + mqttbroker.host + ":" + mqttbroker.port);

  // subscribe to hierarchical topics that have this sessionId and end with REQ topic
  var topic = "Sessions/"+sessionId+"/+"+"/REQ";
  client.subscribe(topic);
  console.log("subscribed to topic " + topic);
});

client.on('message', function (topic, message) {
  // message is Buffer
  console.log("recvd:" + message.toString());
  var msg = JSON.parse(message);
  try{
    if ((typeof msg.type !=="undefined"))
    {
      switch (msg.type) {
        case "JoinREQ":
          joinreq = JoinREQ.deserialise(message.toString());
          handleJoinREQ(joinreq);
          break;
        default:
          console.log("No handler for msg:" + message.toString());
      }

    }else {
      throw "Invalid message. No type field.";
    }
  }catch(e)
  {
    console.log(e);
  }

});

function handleJoinREQ(request)
{
  //console.log(request);

  var sendRes = new JoinRESP(request.sessionId, 0, "ws://wallclock.example.com", "ws://sessionsynccontroller.example.com", "0.0.1");

    // Serialise the JoinRESP message
  var sendResString = sendRes.serialise();
  console.log("response: " + sendResString);

  var topic = "Sessions/" + request.sessionId + "/" + request.deviceId + "/RESP";

  client.publish(topic, sendResString, null, function(err)
  {
    if (typeof(err)!=="undefined")
    {
        console.log(err);
    }

  } );


}
