var Messages = requireAll(require.context("./impl", true, /.js/)),
    constructor = {};


function requireAll(requireContext) {
    return requireContext.keys().map(requireContext);
}

Messages.forEach(function (m) {
    if (m.hasOwnProperty("type")) {
        constructor[m["type"]] = m;
    }
});

function deserialise (jsonString) {
    var obj = JSON.parse(jsonString);
    if (obj && obj.type && constructor.hasOwnProperty(obj.type)) {
        return constructor[obj.type].deserialise(jsonString);
    } else {
        throw "Unknown message type";
    }
}

function create () {
    var args = argsToArray(arguments).slice(1);
    if (constructor.hasOwnProperty(arguments[0])) {
        return new (Function.prototype.bind.apply(constructor[arguments[0]], [null].concat(args)));
    } else {
        throw "Unknown message type";
    }
}

function argsToArray (args) {
    var i, arr;
    i = 0;
    arr = [];
    for (; i < args.length; i++) {
        arr.push(args[i]);
    }
    return arr;
}

/**
 * @module
 * @name MessageFactory
 * @description Creates Message objects.
 * 
 * @example
 * // Create JoinREQ message
 * joinreq = MessageFactory.create("JoinREQ", "ses1", "dvc1", "sessions/123/REQ", "msg1", "v1");
 *
 * // Deserialise JoinRESP message
 * joinresp = MessageFactory.deserialise('{"type":"JoinRESP","sessionId":"ses1","responseCode":0,"wallclockUrl":"ws://172.19.0.1:6676","sessionSyncControllerUrl":"ws://sessionsynccontroller.example.com","id":"msg1","version":"v1"}');
 */
module.exports = {

    /**
     * Creates a message object.
     * @function
     * @param {string} type Message type
     * @param {*} parameters Arguments passed to the constructor
     * @returns {Message}
     */
    create: create,

    /**
     * Creates a message object from its JSON string representation.
     * @function
     * @param {string} jsonString
     * @returns {Message}
     */
    deserialise: deserialise
}