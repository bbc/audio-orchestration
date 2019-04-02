# Purpose of this document
This documentation specifies the protocol messages exchanged between the client library and
the synchronisation service.

# Usage
All protocol message objects provide methods for serialisation and deserialisation.

```javascript
// Create a JoinREQ message
var sendReq = MessageFactory.create("JoinREQ", "ses1", "dvc1", "msg1", "v1");

// Serialise the JoinREQ message
var sendReqString = sendReq.serialise();

// ... Send serialised message to receiver

// The receiver has to deserialise the message
var receiveReq = MessageFactory.deserialise(sendReqString);

// ... The receiver processes the request and responds with a JoinRESP message ...

// Create a JoinRESP message
var sendRes = MessageFactory.create("JoinRESP", "ses1", 0, "ws://wallclock.example.com", "ws://sessionsynccontroller.example.com", "msg1", "v1");

// Serialise the JoinRESP message
var sendResString = res.serialise();

// ... Send serialised message to the sender of the JoinREQ message

// The sender of the JoinREQ message has to deserialise the message
var receiveRes = MessageFactory.deserialise(sendResString);
```

# Run tests on message implementations
Change to project root, build and run tests
```
cd cloud-sync
git checkout newmessages
grunt test
```
