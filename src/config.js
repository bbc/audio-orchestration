/* eslint-disable import/prefer-default-export */
import bowser from 'bowser';

// Content ID for session-wide sync clock
export const CONTENT_ID = 'github.com/bbc/bbcat-orchestration-template/syncClock';

// Timeline type and tick rate should correspond
export const TIMELINE_TYPE = 'tag:rd.bbc.co.uk,2015-12-08:dvb:css:timeline:simple-elapsed-time:1000';
export const TIMELINE_TYPE_TICK_RATE = 1000;

// hostname of cloud sync service endpoint
export const CLOUDSYNC_ENDPOINT = 'mqttbroker.edge.platform.2immerse.eu';

// number of digits in the session code, used for placeholders and validity check
export const SESSION_CODE_LENGTH = 6;

// Time in milliseconds. Report an error if any individual loading step takes longer than this.
export const LOADING_TIMEOUT = 5 * 1000;

// Content IDs are used to identify the playing sequence.
export const CONTENT_ID_LOOP = 'bbcat-orchestration-template:loop';
export const CONTENT_ID_MAIN = 'bbcat-orchestration-template:main';

// Detect safari, it may require differently encoded audio, and thus a different sequence URL.
// const browser = bowser.getParser(window.navigator.userAgent);
// const isSafari = browser.is('Safari') || browser.is('iOS');

// Sequence URLs point to the sequence.json metadata file.
const SEQUENCE_LOOP = 'audio/clicks-and-tone/loop.json';
const SEQUENCE_MAIN = 'audio/clicks-and-tone/sequence.json';

export const SEQUENCE_URLS = [
  { contentId: CONTENT_ID_LOOP, url: SEQUENCE_LOOP },
  { contentId: CONTENT_ID_MAIN, url: SEQUENCE_MAIN },
];

export const INITIAL_CONTENT_ID = CONTENT_ID_LOOP;
export const PLAY_AGAIN_CONTENT_ID = CONTENT_ID_MAIN;

export const DEFAULT_IMAGE_URL = 'images/default.png';
export const JOIN_URL = 'http://localhost:8080/join';

export const DEBUG_UI = true;

export const MDO_COMPRESSOR_RATIO = 4;
export const MDO_COMPRESSOR_THRESHOLD = -40;

export const VALIDATE_SESSION_IDS = false;
export const SESSION_ID_URL = `//${window.location.hostname}:5000`;

// Time in seconds between request and scheduled transition to next sequence.
export const SEQUENCE_TRANSITION_DELAY = 1.0;
