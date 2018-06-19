var inherits, WeakMap, Display, Converter, DeviceInfoDisplay, PRIVATE, instanceCount, msToTimeString;

var $ = require("../Utility/$");
inherits = require("inherits");
WeakMap = require("weak-map");
Display = require("./Display");

PRIVATE = new WeakMap();
instanceCount = 0;

DeviceInfoDisplay = function (parent, name, info) {

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
                        '<td>Device ID</td>' +
                        '<td id=' + id.call(this, 'deviceid') + '>-</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td>Sync URL</td>' +
                        '<td id=' + id.call(this, 'syncurl') + '>-</td>' +
                    '</tr>' +
                    '<tr>' +
                        '<td>Content ID</td>' +
                        '<td id=' + id.call(this, 'contentid') + '>-</td>' +
                    '</tr>' +
                '</tbody>' +
            '</table>' +
        '</div>';
        
    $("#"+parent).innerHTML += display;

};

inherits(DeviceInfoDisplay, Display);


function id (suffix) {
    return "clientinfo-" + PRIVATE.get(this).id + "-" + suffix;
}

DeviceInfoDisplay.prototype.refresh = function () {
    var priv = PRIVATE.get(this);
    $("#"+id.call(this, 'deviceid')).innerHTML = priv.info.deviceId;
    $("#"+id.call(this, 'contentid')).innerHTML = priv.info.contentId;
    $("#"+id.call(this, 'syncurl')).innerHTML = priv.info.syncUrl;
};

module.exports = DeviceInfoDisplay;