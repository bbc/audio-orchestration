var ChannelMap, WeakMap, PRIVATE;

WeakMap = require("weak-map");
PRIVATE = new WeakMap();

/**
 * @class ChannelMap
 */
ChannelMap = function () {
    PRIVATE.set(this, {
        map: []
    });
};

/**
 * Adds channel name if not yet in map.
 * @param {string} channelName
 * @returns {boolean} TRUE if new channel name added, else FALSE.
 */
ChannelMap.prototype.addIfNew = function (chName) {
    var map = PRIVATE.get(this).map;
    if (map.indexOf(chName) < 0) {
        map.push(chName);
        return true;
    }
};

/**
 * Removes channel name from map, if contained in map.
 * @param {string} chName
 * @returns {boolean} TRUE if new channel name removed, else FALSE.
 */
ChannelMap.prototype.removeIfContained = function (chName) {
    var map, i;
    map = PRIVATE.get(this).map;
    i = map.indexOf(chName);
    if (i > -1) {
        map.splice(i, 1)
        return true;
    };
    return false;
};

/**
 * Removes all channel names from map.
 * @returns {array<string>} List of removed channel names
 */
ChannelMap.prototype.removeAll = function () {
    var map, res;
    map = PRIVATE.get(this).map;
    res = [].concat(map); // Copy map
    map = [] // Clear map
    return res;
};

module.exports = ChannelMap;