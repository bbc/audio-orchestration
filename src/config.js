/* eslint-disable import/prefer-default-export */
export const SESSION_CODE_LENGTH = 4;
export const TIMELINE_TYPE = 'tag:rd.bbc.co.uk,2015-12-08:dvb:css:timeline:simple-elapsed-time:1000';
export const TIMELINE_TYPE_TICK_RATE = 1000;
export const CLOUDSYNC_ENDPOINT = 'mqttbroker.edge.platform.2immerse.eu';
export const SEQUENCE_URLS = [
  'audio/clicks-and-tone/sequence.json',
];
export const CONTENT_ID = 'github.com/bbc/bbcat-orchestration-template/syncClock';

// Time in milliseconds. Report an error if any individual loading step takes longer than this.
export const LOADING_TIMEOUT = 5 * 1000;
