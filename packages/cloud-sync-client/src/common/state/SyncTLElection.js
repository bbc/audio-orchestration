/**
 * 
 * Enum for different timeline election algorithms.
 * @enum {number}
 * 
 * @memberof CloudSyncKit
 */
SyncTLElection = {
    /**
     * The sync timeline is locked to the timeline that was registered
     * first for this session.
     */
    EARLIEST_FIRST: 1,

    /**
     * The sync timeline is locked to the timeline with the lowest
     * dispersion value. 
     */
    LOWEST_DISPERSION: 2,

    /**
     * The sync service computes a sync timeline from all registered
     * timelines.
     */
    USE_ALL: 3,

    /**
     * The sync service changes the base timeline for the sync timeline 
     * dynamically to the latest timeline to report a significant change.
     */
    DYNAMIC: 4
};

module.exports = SyncTLElection;