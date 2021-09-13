var CloudSynchroniser, instance;

CloudSynchroniser = require("CloudSynchroniser");
const SyncTLElection = require("../common/state/SyncTLElection");

/**
 * @namespace CloudSyncKit
 *
 * @description Factory to create an instance or retrieve a reference to the
 * existing instance of CloudSynchroniser (singleton).
 */
module.exports = {
    /**
     * 
     * Returns an instance of CloudSynchroniser
     * @param {string} syncUrl
     * @param {string} sessionId
     * @param {string} contextId
     * @param {string} deviceId
     * @param {object} options
     * @param {number} [options.syncTimelineElection=CloudSyncKit.SyncTLElection.EARLIEST_FIRST]
     *  Specifies the algorithm to be used by the sync service to elect the synchronisation timeline
     * @returns {CloudSynchroniser}
     * 
     * @memberof CloudSyncKit
     */
    getCloudSynchroniser: function (syncUrl, sessionId, contextId, deviceId, options) {
        if (instance !== null) {
            instance = new CloudSynchroniser(syncUrl, sessionId, contextId, deviceId, options);
        }
        return instance;
    },

    SyncTLElection: SyncTLElection
};
