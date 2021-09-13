var winston = require("winston"),
    fs = require("fs"),
    path = require("path"),
    logDir = __dirname + "/../../logs/",
    Logger,
    Formatter;

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

Logger = function (tag) {

    var logger = new winston.Logger({
        transports: [
            new winston.transports.Console({
                colorize: true,
                level: "info",
                // Do not print meta data
                prettyPrint: function () { return ""; }
            }),
            new winston.transports.File({
                name: "Debug log",
                filename: logDir + "debug.log",
                timestamp: tsFormat,
                level: "debug"
            }),
            new winston.transports.File({
                name: "Error log",
                filename: logDir + "error.log",
                timestamp: tsFormat,
                level: "error"
            })
        ]
    });

    this.log = function (level, message, meta) {
        var meta = meta || {};
        meta.module = path.basename(tag);
        logger.log(level || "debug",  message || "", meta);
    };

    this.debug = function (message, meta) {
        this.log("debug", message, meta || {});
    };

    this.info = function (message, meta) {
        this.log("info", message, meta || {});
    };

    this.warn = function (message, meta) {
        this.log("warn", message, meta || {});
    };

    this.error = function (message, meta) {
        this.log("error", message, meta || {});
    };
};

Formatter = (function () {

    function meta (req, arbitrary) {
        var meta = arbitrary || {};
        if (typeof req === "undefined") { return meta; }
        meta.path = req.baseUrl + req.path;
        meta.query = req.query;
        return meta;
    }

    return {
        meta: meta
    }

}());

function tsFormat () {
    return new Date().getTime();
}

module.exports = {
    Logger: Logger,
    Formatter: Formatter
};