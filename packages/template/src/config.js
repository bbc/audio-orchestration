/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
/**
 * This file can be used to set default configuration values for custom templates, and to modify
 * the configuration object generated by Audio Orchestrator in the updateConfig method below.
 *
 * To make it easier to start developing the template without linking it to Audio Orchestrator, a
 * working configuration is provided in index.html. The example configuration in index.html will be
 * completely replaced by Audio Orchestrator when exporting or previewing the experience.
 *
 * The configuration in index.html does not need to specify all settings. By default any setting
 * present in index.html will be used instead of the values in this file. If a settings key is not
 * set in index.html (the example file or or that exported by Audio Orchestrator), the value defined
 * below is used.
 *
 * If your custom template needs an additional setting that is not exported by Audio Orchestrator,
 * add it to the config object below.
 *
 * If you need to modify a settings value generated by Audio Orchestrator, for example to add
 * properties to specific sequences in SEQUENCE_URLS, edit the updateConfig method.
 */

// Fallback in case this is not running in a browser with a defined window object
const location = window ? window.location : {};
const DEFAULT_JOIN_URL = [
  `${location.protocol}//`,
  location.hostname,
  location.port ? `:${location.port}` : '',
  location.pathname,
  '#!/join',
].join('');

const config = {
  // The cloud sync service endpoint, is specified as { hostname } for a standard wss:// connection
  // on the default port. Can set a { port } number to use a plain ws:// connection on that port.
  // Other synchronisation adapters may use different endpoint formats.
  SYNC_ENDPOINT: null,

  // The join URL is used to generate the QR code and should correspond to where the template is
  // hosted. The "#!/join" suffix immediately opens the connect-form page.
  // for example: 'https://bit.ly/my-short-joining-link/#!/join',
  JOIN_URL: DEFAULT_JOIN_URL,

  // This prefix for the random numerical session code is used to generate the full session ID.
  LOCAL_SESSION_ID_PREFIX: 'audio-orchestration-template',

  // This is the contentId of the first sequence (defined below) to play when the session begins.
  INITIAL_CONTENT_ID: '',

  // Each sequence object must have a unique contentId and a url to a JSON file describing the
  // audio objects in it. Other options may be set, an example is given in index.html.
  SEQUENCE_URLS: [],

  // Each control must have a unique controlId, a controlType, and controlParameters. Examples are
  // given in index.html.
  CONTROLS: [],

  // These various text labels are usually configured in index.html.
  // TEXT_TITLE: '',
  // TEXT_SUBTITLE: '',
  // TEXT_INTRODUCTION: '',
  // TEXT_START_LABEL: '',
  // TEXT_JOIN_LABEL: '',
  // TEXT_ONBOARDING_TITLE: '',
  // TEXT_ONBOARDING_DESCRIPTION: '',

  // A default image for the player can be set, this is also shown on the start and join pages.
  PLAYER_IMAGE_URL: null,
  PLAYER_IMAGE_ALT: '',

  // The accent colour is used in various places in the user interface, such as for buttons and the
  // seek bar.
  ACCENT_COLOUR: '#006DEF',

  // Whether to show the play/pause controls on auxiliary devices in addition to the main device.
  ENABLE_PLAY_PAUSE_ON_AUX: false,

  // Dynamics compression with these settings is applied to the output of all auxiliary devices.
  // Compression is disabled by default by setting the threshold to 0dB.
  MDO_COMPRESSOR_RATIO: 2,
  MDO_COMPRESSOR_THRESHOLD: 0,

  // Fade out objects that are being moved away from a device for this duration (in seconds).
  OBJECT_FADE_OUT_DURATION: 0.5,

  // Time in milliseconds. Report an error if any individual loading step takes longer than this.
  LOADING_TIMEOUT: 5 * 1000,

  // Default settings for calibration mode. Calibration mode is hidden if CALIBRATION_SEQUENCE_URL
  // is not set. If it is set, it should point to a looping sequence playing synchronous audio on
  // all devices. The template ships with an example in 'audio/calibration/sequence.json'.
  CALIBRATION_SEQUENCE_URL: null,
  CALIBRATION_SEQUENCE_TRANSITION_DELAY: 0.1,
  CALIBRATION_LOADING_TIMEOUT: 5 * 1000,
  ALLOW_CALIBRATION_FROM_AUX: true,

  // The number of digits in the session codes generated. Note that one digit is used as checksum by
  // default, so there are actually only 100,000 possible codes for six total digits, not 1,000,000.
  SESSION_CODE_LENGTH: 6,

  // If session id service returns an error or is not used, generate codes locally according to this
  // pattern and verify that they match the check digit pattern. The check digit is used to encode
  // whether a session code comes from a remote service or was generated locally, and to provide
  // some protection against transcription errors (as 90% of possible six digit codes will be
  // invalid if one check digit is used).
  USE_FALLBACK_SESSION_CODES: true,
  SESSION_CODE_CHECK_DIGITS: 1,
  LOCAL_SESSION_CODE_CHECK_DIGIT_OFFSET: 3,

  // Time in seconds between request and scheduled transition to next sequence.
  SEQUENCE_TRANSITION_DELAY: 1.0,

  // The standard debug UI shows object labels; this setting can be changed in Audio Orchestrator.
  DEBUG_UI: true,

  // The more advanced device debug UI displays all current device metadata, including allocated
  // objects, controls, and control values for all devices.
  DEVICE_DEBUG_UI: false,

  // If this is set, nosleep.js will be used to attempt to keep mobile device screens awake for
  // longer, however this feature does not work for all devices and web browsers.
  ENABLE_WAKE_LOCK: true,

  // Optional prompt to display in some sequences
  PROMPT_SEQUENCES: [],
  // PROMPT_TITLE: '',
  // PROMPT_BODY: '',
  // PROMPT_BUTTON_LINK: '',
  // PROMPT_BUTTON_TEXT: '',

  // Whether to show the BBC Copyright and "made with Audio Orchestrator" footer
  SHOW_BBC_FOOTER: false,
};

export const updateConfig = (newConfig = {}) => {
  Object.keys(newConfig).forEach((key) => {
    config[key] = newConfig[key];

    // You might want to modify the settings from index.html here before saving them to the config
    // object. This can be useful if you have implemented additional features that need additional
    // per-sequence settings not exported by Audio Orchestrator. For example, to enable the
    // 'instructions' flag for a particular sequence:
    //
    // if (key === 'SEQUENCE_URLS') {
    //   config[key] = newConfig[key].map((sequence) => {
    //     switch (sequence.sequenceId) {
    //       case 'loop':
    //         return {
    //          ...sequence,
    //          instructions = true;
    //         };
    //       default:
    //         return sequence;
    //     }
    //   });
    // }
  });
};

export default config;
