var MessageFactory, JoinREQ;

MessageFactory = require("MessageFactory");
JoinREQ = require("JoinREQ");

describe("MessageFactory", function () {

    it("Exists", function () {
        expect(MessageFactory).toBeDefined();
    });

    it("Creates a JoinREQ message", function () {
    var msg = MessageFactory.create("JoinREQ", "ses1", "ctx1", "dvc1", "sessions/123/RESP", "sessions/123/REQ", 1, "msg1", "0.0.1");
        expect(msg instanceof JoinREQ).toBe(true);
    });

    it("Deserialises a JoinREQ message from its JSON string representation", function () {
        var msg = MessageFactory.deserialise('{"type":"JoinREQ","sessionId":"ses1","contextId":"ctx1","deviceId":"dvc1","syncTLStrategy":1,"id":"msg1","version":"v1","responseChannel":"services/123/RESP","requestChannel":"sessions/123/REQ"}');
        expect(msg instanceof JoinREQ).toBe(true);
    });

    it("Throws error if to create message with invalid parameters", function () {
        var fun = function () {
            return MessageFactory.create("JoinREQ", "ses1");
        };
        expect(fun).toThrow();
    });

    it("Throws error if to deserialise message with invalid parameters", function () {
        var fun = function () {
            return MessageFactory.deserialise('{"type":"JoinREQ","sesnId":"ses1","deviId":"dvc1","i":"msg1","veron":"v1"}');
        };
        expect(fun).toThrow();
    });

    it("Throws error if to create message of unknown type", function () {
        var fun = function () {
            return MessageFactory.create("Join", "ses1", "ctx1", "dvc1", "msg1", "0.0.1");
        };
        expect(fun).toThrow();
    });

    it("Throws error if to deserialise message of unknown type", function () {
        var fun = function () {
            return MessageFactory.deserialise('{"type":"Join","sessionId":"ses1","contextId":"ctx1","deviceId":"dvc1","id":"msg1","version":"v1"}');
        };
        expect(fun).toThrow();
    });

});