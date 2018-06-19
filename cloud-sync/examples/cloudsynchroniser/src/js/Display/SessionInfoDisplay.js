var inherits, WeakMap, Display, Converter, SessionInfoDisplay, PRIVATE, instanceCount, msToTimeString;

inherits = require("inherits");
WeakMap = require("weak-map");
Display = require("./Display");

PRIVATE = new WeakMap();
instanceCount = 0;

SessionInfoDisplay = function (parent, name, info) {

    var priv, display;

    PRIVATE.set(this, {});
    priv = PRIVATE.get(this);
    priv.id = ++instanceCount;
    priv.info = info;

    display = '' +
        '<div class="pure-u-1">' +
            '<table class="pure-table pure-table-bordered">' +
                '<thead>' +
                    '<tr>' +
                        '<th colspan="2">' + name + '</th>' +
                    '</tr>' +
                '</thead>' +
                '<tbody>' +
                    '<tr>' +
                        '<td>Session ID</td>' +
                        '<td id=' + id.call(this, 'sessionid') + '>-</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td>Context ID</td>' +
                        '<td id=' + id.call(this, 'contextid') + '>-</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td>Available devices</td>' +
                        '<td id=' + id.call(this, 'devices') + '>-</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td>Available timelines</td>' +
                        '<td id=' + id.call(this, 'timelines') + '>-</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td>Available sync timelines</td>' +
                        '<td id=' + id.call(this, 'synctimelines') + '>-</td>' +
                    '</tr>' +
                '</tbody>' +
            '</table>' +
        '</div>';
        
    $(parent).innerHTML += display;
};

inherits(SessionInfoDisplay, Display);


function $ (identifier) {
    return document.getElementById(identifier);
}

function id (suffix) {
    return "sessioninfo-" + PRIVATE.get(this).id + "-" + suffix;
}

function toHTMLList (arr) {
    var htmlList = "<ul>";
    arr.forEach(function (item) {
        htmlList += "<li>" + item + "</li>";
    });
    htmlList += "</ul>";
    return htmlList.indexOf("<li>") > -1 ? htmlList : "[]";
}

SessionInfoDisplay.prototype.refresh = function () {
    var priv = PRIVATE.get(this);
    $(id.call(this, 'sessionid')).innerHTML = priv.info.sessionId;
    $(id.call(this, 'contextid')).innerHTML = priv.info.contextId;
    $(id.call(this, 'devices')).innerHTML = toHTMLList(priv.info.devices);
    $(id.call(this, 'timelines')).innerHTML = toHTMLList(priv.info.timelineInfo.map(function (i) { return i.timelineId; }));
    $(id.call(this, 'synctimelines')).innerHTML = toHTMLList(priv.info.syncTimelineInfo.map(function (i) { return i.timelineId; }));
};

module.exports = SessionInfoDisplay;