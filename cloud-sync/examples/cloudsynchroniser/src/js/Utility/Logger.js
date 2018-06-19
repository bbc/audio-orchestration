var WeakMap, PRIVATE, Logger;

WeakMap = require("weak-map");
PRIVATE = new WeakMap();


Logger = function (node, opts) {
    var priv;
    PRIVATE.set(this, {});
    priv = PRIVATE.get(this);
    priv.node = node;
    priv.maxln = opts && opts.maxln || 30;
    priv.line = 0;
};


Logger.prototype.log = function () {
    printArgs.call(this, arguments);
};

Logger.prototype.debug = Logger.prototype.log;

Logger.prototype.info = function () {
    printArgs.call(this, arguments, "green");
};

Logger.prototype.warn = function () {
    printArgs.call(this, arguments, "orange");
};

Logger.prototype.error = function () {
    printArgs.call(this, arguments, "red");
};

function printArgs (args, color) {
    var i = 0, msg = "";
    for (; i < args.length; i++) {
        msg += typeof args[i] === "object" ? JSON.stringify(args[i]): args[i] + " ";
    }
    print.call(this, msg, color || null);
}

function print (msg, color) {
    var priv, c, p;
    priv = PRIVATE.get(this);
    c = color || "black";
    p = document.createElement("code");
    p.innerHTML = "<span style='color: #aaa;'>" + (++priv.line) + ". </span>" + msg;
    p.style.color = c;
    priv.node.append(p);
    trim.call(this);
}

function trim () {
    var priv = PRIVATE.get(this);
    while(priv.node.childNodes.length > priv.maxln) {
        priv.node.removeChild(priv.node.firstChild);
    }
}

module.exports = Logger;