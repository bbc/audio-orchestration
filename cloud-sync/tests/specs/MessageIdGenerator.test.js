var MessageIdGenerator = require("MessageIdGenerator");

describe("MessageIdGenerator", function () {

    it("Exists", function () {
        expect(MessageIdGenerator).toBeDefined();
    });

    it("Generates an ID of type string", function () {
        expect(MessageIdGenerator.getNewId()).toEqual(jasmine.any(String));
    });

    it("Deserialises a generated ID", function () {
        expect(MessageIdGenerator.deserialise(MessageIdGenerator.getNewId())).toEqual(jasmine.any(Object));
    });

    it("Creates IDs with increasing 'count' value and constant 'startTime' value", function () {
        var c1, c2, c3, diff1, diff2;
        c1 = MessageIdGenerator.deserialise(MessageIdGenerator.getNewId()).count;
        c2 = MessageIdGenerator.deserialise(MessageIdGenerator.getNewId()).count;
        c3 = MessageIdGenerator.deserialise(MessageIdGenerator.getNewId()).count;
        diff1 = c2 - c1;
        diff2 = c3 - c2;
        expect(diff1).toEqual(1);
        expect(diff2).toEqual(1);
    });

});