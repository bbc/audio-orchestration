const config = {
  // Content ID for session-wide sync clock - don't change this.
  SYNC_CLOCK_CONTENT_ID: 'github.com/bbc/bbcat-orchestration-template/syncClock',

  // Timeline type and tick rate should correspond - don't change this.
  TIMELINE_TYPE: 'tag:rd.bbc.co.uk,2015-12-08:dvb:css:timeline:simple-elapsed-time:1000',
  TIMELINE_TYPE_TICK_RATE: 1000,

  // cloud sync service websockets endpoint, specified as { hostname } for standard wss:// connection
  // on default port, also specify a { port } number to use a plain ws:// connection on that port.
  CLOUDSYNC_ENDPOINT: {},

  // number of digits in the session code, used for placeholders and validity check
  SESSION_CODE_LENGTH: 6,

  // Time in milliseconds. Report an error if any individual loading step takes longer than this.
  LOADING_TIMEOUT: 5 * 1000,

  // This list specifies how the different sequences relate, and how one may move from one to the
  // next. Each entry should be an object with the following properties:
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
  SEQUENCE_URLS: [],

  // The initial content id is what starts playing when the user first creates the session.
  INITIAL_CONTENT_ID: null,

  // The default image is the name used when no active object specifies the image property in its
  // orchestration metadata. The names are mapped to image files in images.scss.
  DEFAULT_IMAGE: 'default',

  // The join URL is used to generate the QR code and should correspond to where the template is
  // hosted. The "#!/join" suffix immediately opens the connect-form page.
  JOIN_URL: '',

  // The debug UI components, if shown, display the currently playing contentId and any objects
  // allocated to the current device.
  DEBUG_UI: true,

  // Dynamics compression with these settings is applied to the output of all auxiliary devices.
  MDO_COMPRESSOR_RATIO: 4,
  MDO_COMPRESSOR_THRESHOLD: -40,

  // don't check against a session-id service by (sessionIds are generated and verified locally).
  VALIDATE_SESSION_IDS: false,

  // the session-id service to use, not used unless enabled above.
  SESSION_ID_URL: '',

  // If session id service returns an error or is not used, generate codes locally according to this
  // pattern and verify that they match the check digit pattern.
  USE_FALLBACK_SESSION_CODES: true,
  SESSION_CODE_CHECK_DIGITS: 1,
  LOCAL_SESSION_CODE_CHECK_DIGIT_OFFSET: 3,

  // should be unique to your experience to reduce the chance of collisions
  LOCAL_SESSION_ID_PREFIX: 'bbcat-orchestration-template',

  // Time in seconds between request and scheduled transition to next sequence.
  SEQUENCE_TRANSITION_DELAY: 1.0,

  // Tags that can be associated with a device and used to determine where objects can go. Each
  // entry must be an object with the keys:
  //
  // * name: name used in the orchestration metadata for all sequences
  // * friendlyName: the user-facing name used for button labels in the tag selection screen.
  DEVICE_TAGS: [],

  // Some text on the start page can be customised here to avoid having to rebuild the template.
  TEXT_TITLE: 'Title',
  TEXT_INTRODUCTION: 'Introduction',
  TEXT_START_LABEL: 'Create Session',
  TEXT_JOIN_LABEL: 'Join',

  ACCENT_COLOUR: '#80BBFF',
};

export const updateConfig = (newConfig = {}) => {
  Object.keys(newConfig).forEach((key) => {
    config[key] = newConfig[key];
  });
};

export default config;
