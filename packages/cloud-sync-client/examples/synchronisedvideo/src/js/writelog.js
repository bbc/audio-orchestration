var jsonfile = require("jsonfile"),
    path = __dirname + "/../../logs/",
    Logger = require("./logger").Logger,
    Formatter = require("./logger").Formatter,
    logger = new Logger(__filename);

function writelog (req, res, next) {

    var token = req.query.token || null,
        file = req.body.sessionInfo.sessionId + "_" + req.body.sessionInfo.contextId + "_" + req.body.sessionInfo.deviceId + ".json",
        log = req.body,
        oldLog,
        filepath;

    log.received = getDate();

    filepath = path + req.originalUrl.split("/log/").pop();
    
    try {
        oldLog = jsonfile.readFileSync(filepath + file);
        oldLog.videoClock = oldLog.videoClock.concat(log.videoClock);
    } catch (e) {
        oldLog = {};
        oldLog.sessionInfo = log.sessionInfo;
        oldLog.videoClock = log.videoClock;
    }

    jsonfile.writeFile(filepath + file, oldLog, { spaces: 4 }, function (err) {
        if (err) {
            logger.error(err);
        }
    });

    logger.info("Saved log: " + file, Formatter.meta(req, { name: token }));
    next();
}

function getDate () {
    var d = new Date();
    return  {
        unix: d.getTime(),
        year: d.getFullYear(),
        month: (d.getMonth() + 1),
        day: d.getDate(),
        hours: d.getHours(),
        minutes: d.getMinutes(),
        seconds: d.getSeconds()
    };
}

module.exports = writelog;