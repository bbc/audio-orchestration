// Content ID for session-wide sync clock
export const CONTENT_ID = 'github.com/bbc/bbcat-orchestration-template/syncClock';

// Timeline type and tick rate should correspond
export const TIMELINE_TYPE = 'tag:rd.bbc.co.uk,2015-12-08:dvb:css:timeline:simple-elapsed-time:1000';
export const TIMELINE_TYPE_TICK_RATE = 1000;

// cloud sync service websockets endpoint, specified as { hostname } for standard wss:// connection
// on default port, also specify a { port } number to use a plain ws:// connection on that port.
export const CLOUDSYNC_ENDPOINT = { hostname: 'cloudsync.virt.ch.bbc.co.uk' };

// number of digits in the session code, used for placeholders and validity check
export const SESSION_CODE_LENGTH = 6;

// Time in milliseconds. Report an error if any individual loading step takes longer than this.
export const LOADING_TIMEOUT = 5 * 1000;

// Content IDs are used to identify the playing sequence and must be unique per sequence.
const CONTENT_ID_LOOP = 'bbcat-orchestration-template:loop';
const CONTENT_ID_MAIN = 'bbcat-orchestration-template:main';

// Sequence URLs point to the sequence.json metadata files
const SEQUENCE_LOOP = 'audio/clicks-and-tone/loop.json';
const SEQUENCE_MAIN = 'audio/clicks-and-tone/sequence.json';

// This list specifies how the different sequences relate, and how one may move from one to the
// next. The default assignment has the intro loop, moving to the main content when the user
// clicks 'Continue'. The main content stops playing at the end, and offers the choice to 'Listen
// Again', linking back to itself.
//
// * contentId: unique id for the sequence
// * url: link to the sequence.json file
// * hold: if true, the player pauses at the end of the sequence, waiting for a choice.
// * skippable: if true, the choice is displayed throughout the sequence.
// * next: list of choices, the first entry is used as the default if hold is false.
//    * contentId: the sequence id to transition to
//    * label: the label to use for the button.
//
// The behaviour of these fields is defined in template/orchestration.js.
export const SEQUENCE_URLS = [
  {
    contentId: CONTENT_ID_LOOP,
    url: SEQUENCE_LOOP,
    hold: false,
    skippable: true,
    next: [
      {
        contentId: CONTENT_ID_MAIN,
        label: 'Continue',
      },
    ],
  },
  {
    contentId: CONTENT_ID_MAIN,
    url: SEQUENCE_MAIN,
    hold: true,
    skippable: false,
    next: [
      {
        contentId: CONTENT_ID_MAIN,
        label: 'Listen Again',
      },
    ],
  },
];

// The initial content id is what starts playing when the user first creates the session.
export const INITIAL_CONTENT_ID = CONTENT_ID_LOOP;

export const DEFAULT_IMAGE = 'default';
export const JOIN_URL = 'http://localhost:8080/#!/join';

export const DEBUG_UI = true;

export const MDO_COMPRESSOR_RATIO = 4;
export const MDO_COMPRESSOR_THRESHOLD = -40;

// don't check against a session-id service by default.
export const VALIDATE_SESSION_IDS = false;

// the session-id service to use, not used unless enabled above.
export const SESSION_ID_URL = `//${window.location.hostname}:5000`;

// if session id service returns an error or is not used, generate codes locally according to this
// pattern and verify that they match the check digit pattern.
export const USE_FALLBACK_SESSION_CODES = true;
export const SESSION_CODE_CHECK_DIGITS = 1;
export const LOCAL_SESSION_CODE_CHECK_DIGIT_OFFSET = 3;

// should be unique to your experience to reduce the chance of collisions
export const LOCAL_SESSION_ID_PREFIX = 'bbcat-orchestration-template';

// Time in seconds between request and scheduled transition to next sequence.
export const SEQUENCE_TRANSITION_DELAY = 1.0;

// Zones a device can be in. The names must match the zones used in the metadata for all sequences,
// the friendlyNames are used for button labels in the AuxiliaryLocationSelection component.
export const ZONES = [
  { name: 'nearFront', friendlyName: 'near front' },
  { name: 'nearSide', friendlyName: 'near side' },
  { name: 'nearRear', friendlyName: 'near rear' },
  { name: 'farFront', friendlyName: 'far front' },
  { name: 'farSide', friendlyName: 'far side' },
  { name: 'farRear', friendlyName: 'far rear' },
];
