/* eslint-disable import/prefer-default-export */

// Content ID for session-wide sync clock
export const CONTENT_ID = 'github.com/bbc/bbcat-orchestration-template/syncClock';

// Timeline type and tick rate should correspond
export const TIMELINE_TYPE = 'tag:rd.bbc.co.uk,2015-12-08:dvb:css:timeline:simple-elapsed-time:1000';
export const TIMELINE_TYPE_TICK_RATE = 1000;

// hostname of cloud sync service endpoint
export const CLOUDSYNC_ENDPOINT = 'mqttbroker.edge.platform.2immerse.eu';

// number of digits in the session code, used for placeholders and validity check
export const SESSION_CODE_LENGTH = 4;

// Time in milliseconds. Report an error if any individual loading step takes longer than this.
export const LOADING_TIMEOUT = 5 * 1000;

// Sequence URLs double as content-id; export convenient names for use in UI, and a list of all
// of them to preload.
export const CONTENT_ID_LOOP = 'bbcat-orchestration-template:loop';
export const CONTENT_ID_MAIN = 'bbcat-orchestration-template:main';

export const SEQUENCE_URLS = [
  { contentId: CONTENT_ID_LOOP, url: 'audio/clicks-and-tone/loop.json' },
  { contentId: CONTENT_ID_MAIN, url: 'audio/clicks-and-tone/sequence.json' },
];

export const INITIAL_CONTENT_ID = SEQUENCE_URLS[0].contentId;

export const DEFAULT_IMAGE_URL = 'images/default.png';
