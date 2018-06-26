var Message;

/**
 * @constructor
 * @name Message
 * @param {string} type
 * @param {arguments} args
 * @param {ParamenterList} params
 */
Message = function (type, args, params) {
    args = prependToArgs(type, args);
    checkArgs(args, params);
    defineProperties(this, args, params);
    return this;
};

/**
 * Transforms the message to JSON string
 * @function
 * @memberof Message
 * @returns {string} JSON string representation of the message 
 */
Message.prototype.serialise = function () {
    return JSON.stringify(this);
};

/**
 * Transforms the message to JSON string
 * @function
 * @memberof Message
 * @param {string} messageString JSON representation of the message
 * @returns {Message} Message object
 */
Message.deserialise = function (Class, params, data) {
    var args = [];
    data = JSON.parse(data);
    params.forEach(function (param) {
        var val = getFrom(data, param.name);
        if (param.name !== "type") {
            args.push(val);
        } else if (val !== Class.type) {
            throw "'" + Class.type + "' cannot deserialise Message of type '" + val + "'"
        }
    });
    return new (Function.prototype.bind.apply(Class, [null].concat(args)));
};

function prependToArgs (arg, args) {
    var i = 0, ar = [];
    for (; i < args.length; i++) {
        ar.push(args[i]);
    }
    return [arg].concat(ar);
}

function defineProperties (obj, vals, defs) {
    var i = 0;
    for (; i < vals.length; i++) {
        Object.defineProperty(obj, defs[i].name, { enumerable: true, value: vals[i], writable: defs[i].writable || false });
    };
    for (; i < defs.length; i++) {
        Object.defineProperty(obj, defs[i].name, { enumerable: true, value: defs[i].default, writable: defs[i].writable || false });
    }
}

function checkArgs (args, expected) {
    var i = 0, minParams = countMandatoryParams(expected);
    if (args.length < minParams) { throw "Expected minimum of " + minParams + " arguments. Saw " + args.length + " instead."; }
    for (; i < args.length; i++) {
        if (typeof args[i] !== expected[i].type && args[i] !== null) {
            throw "Expected' " + expected[i].name + "' to be of type '" + expected[i].type + "', instead: '" + typeof args[i] + "'"
        }
    }
}

function countMandatoryParams (params) {
    var i = 0, count = 0;
    for (; i < params.length; i++) {
        if (!params[i].optional) { count++; }
    }
    return count;
}

function getFrom (data, prop) {
    if (data.hasOwnProperty(prop)) {
        return data[prop];
    } else {
        throw "Property '" + prop + "' not defined";
    }
};


module.exports = Message;
