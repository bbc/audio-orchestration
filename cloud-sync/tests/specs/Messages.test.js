var Descriptions = requireAll(require.context("./Messages.test", true, /.test.js/));

function requireAll(requireContext) {
    return requireContext.keys().map(requireContext);
}

Descriptions.forEach(function (Description) {

    describe(Description.name, function () {

        var Message = Description.Message,
            msg = null,
            validJsonMsg = Description.validJsonMsg,
            refMsg = JSON.parse(validJsonMsg);

        it("Exists", function () {
            expect(Message).toBeDefined();
        });

        it("Gets instantiated with mandatory parameters, all properties have expected values", function () {

            var args, key;

            // "[...] with mandatory parameters [...]"
            // --> Get them from description
            args = Description.mandatoryParams.map(function (key) { return refMsg[key]; });

            //console.log(args);

            // "Gets instantiated [...]"
            // --> Call constructor with parameters from description
            msg = new (Function.prototype.bind.apply(Message, [null].concat(args)));
            expect(msg instanceof Message).toBe(true);

            //console.log(JSON.stringify(msg));

            // "[...] all properties have expected values"
            // --> Check against reference message
            Description.mandatoryParams.forEach(function (param) { 
                expect(msg[param]).toEqual(refMsg[param]); 
            });
        });

        it("Gets instantiated with mandatory and optional parameters, all properties have expected values", function () {

            var msg, args, optArgs, refMsg, key;

            refMsg = JSON.parse(validJsonMsg);

            // "[...] with mandatory and optional parameters [...]"
            // --> Get them from description
            args = Description.mandatoryParams.map(function (key) { return refMsg[key]; });
            optArgs = Description.optionalParams.map(function (key) { return refMsg[key]; });

            // "Gets instantiated [...]"
            // --> Call constructor with parameters from description
            msg = new (Function.prototype.bind.apply(Message, [null].concat(args.concat(optArgs))));
            expect(msg instanceof Message).toBe(true);

            // "[...] all properties have expected values"
            // --> Check against modified reference message
            for (key in refMsg) { expect(msg[key]).toEqual(refMsg[key]); }
        });

        it("Throws error if instantiated with invalid parameters", function () {
            var fun = function () {
                return new (Function.prototype.bind.apply(Message, [null].concat(Description.invalidParamValues)));
            };
            expect(fun).toThrow();
        });

        it("Gets serialised", function () {
            var res = msg.serialise(), resObj = JSON.parse(res);

            // The serialised message should be of type string
            expect(typeof res === "string").toBe(true);

            // Check if serialised object contains same props as reference message
            for (var key in refMsg) { expect(resObj[key]).toEqual(refMsg[key]); }
        });

        it("Deserialises JSON message with valid properties", function () {
            var resObj = Message.deserialise(validJsonMsg);

            // Deserialised message should be an instance of "Message"
            expect(resObj instanceof Message).toBe(true);

            // Check if result contains same props as reference message
            for (var key in refMsg) { expect(resObj[key]).toEqual(refMsg[key]); }
        });

        it("Throws error if to deserialise JSON message with invalid properties", function () {
            var fun = function () {
                return Message.deserialise(Description.jsonWrongParams);
            };
            expect(fun).toThrow();
        });

       it("Throws error if to deserialise JSON message of message type other than '" + Description.name + "'", function () {
            var fun = function () {
                return Message.deserialise(Description.jsonWrongType);
            };
            expect(fun).toThrow();
        });

    });
});
