const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ENCODE_CODEC = 'libfdk_aac';
const ENCODE_BITRATE = '128k';

const BUFFER_EXTENSION = 'm4a';
const DASH_SEGMENT_NAMES = `%04d.${BUFFER_EXTENSION}`;
const DASH_SEGMENT_MEDIA = `$Number%04d$.${BUFFER_EXTENSION}`; // different placeholder format

// ~ 4.096 seconds at 48000Hz are an exact multiple of the AAC block size of 1024 samples:
const SAMPLE_RATE = 48000;
const SEGMENT_DURATION = (192 * 1024) / SAMPLE_RATE;

const SILENCE_PATH = 'silence.wav';
const SILENCE_DURATION = SEGMENT_DURATION;

function usage() {
  process.stdout.write('Usage:\n\n');
  process.stdout.write('node encode-media.js sequence inputPath outputPath\n\n');
  process.stdout.write('* sequence\t\t path to json file produced by generate-sequence tool\n');
  process.stdout.write('* inputPath\t\t base path for .wav source files referenced by sequence items\n');
  process.stdout.write('* outputPath\t\t base path for storing encoded media\n');
  process.stdout.write('* baseUrl\t\t base url for where the media will be hosted\n');
  process.exit(1);
}

const args = {
  inputPathSequence: process.argv[2],
  inputPath: process.argv[3],
  outputPath: process.argv[4],
  baseUrl: process.argv[5],
};

if (args.inputPathSequence === undefined) {
  console.error('sequence path not defined, use path to sequence.json generated by ../generate-sequence');
  usage();
}

if (args.inputPath === undefined) {
  console.error('inputPath not defined, use path to split audio folder');
  usage();
}

if (args.outputPath === undefined) {
  console.error('outputPath not defined');
  usage();
}

if (args.baseUrl === undefined) {
  console.error('baseUrl not defined');
  usage();
}

/**
 * Encodes a mono input .wav file as a single continuous buffer.
 *
 * @param inputName name of the wav file
 * @param inputPath directory the wav file is in
 * @param outputPath directory the outputs are collected in
 * @param baseUrl the baseUrl where the encoded files will be hosted
 *
 * @returns {string} the url to use in the sequence ource object (including the baseUrl).
 */
function encodeBuffer(inputName, inputPath, outputPath, baseUrl) {
  const input = path.join(inputPath, inputName);
  const outputName = `${path.basename(inputName, '.wav')}.${BUFFER_EXTENSION}`;
  const output = path.join(outputPath, outputName);

  const cmdArgs = [
    '-loglevel', 'warning',
    '-hide_banner',
    '-y',
    '-i', input,
    '-c:a', ENCODE_CODEC,
    '-b:a', ENCODE_BITRATE,
    output,
  ];
  console.debug('ffmpeg', cmdArgs.join(' '));
  spawnSync('ffmpeg', cmdArgs, { stdio: 'inherit' });

  return `${baseUrl}/${outputName}`;
}

function mkdirIfNotExists(dir) {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Encodes a mono input .wav as a series of equal-length DASH segments.
 *
 * @param inputName name of the wav file
 * @param inputPath directory the wav file is in
 * @param outputPath directory the outputs are collected in
 * @param silencePath path to a silent .wav file to append to the input before encoding.
 *
 * @returns {string} the basename of the wav file to be used for the manifest generation.
 */
function encodeDash(inputName, inputPath, outputPath, silencePath = null) {
  const input = path.join(inputPath, inputName);
  const outputBasename = path.basename(inputName, '.wav');
  const segmentNames = path.join(outputBasename, DASH_SEGMENT_NAMES);

  const output = path.join(outputPath, segmentNames);
  mkdirIfNotExists(path.dirname(output));

  const inputArgs = [
    '-loglevel', 'warning',
    '-hide_banner',
    '-y',
    '-i', input,
  ];

  const silenceArgs = [
    '-i',
    silencePath,
    '-filter_complex',
    '[0:a] concat=n=2:v=0:a=1',
  ];

  const outputArgs = [
    '-c:a', ENCODE_CODEC,
    '-frame_size', 1024,
    '-b:a', ENCODE_BITRATE,
    '-f', 'segment',
    '-segment_time', SEGMENT_DURATION,
    output,
  ];

  const cmdArgs = [].concat(
    inputArgs,
    silencePath !== null ? silenceArgs : [],
    outputArgs,
  );

  console.debug('ffmpeg', cmdArgs.join(' '));
  spawnSync('ffmpeg', cmdArgs, { stdio: 'inherit' });

  return outputBasename;
}

function formatPT(seconds) {
  return `PT${Math.floor(seconds / 60)}M${(seconds % 60).toFixed(2)}S`;
}

/**
 * Generates a standard DASH manifest and writes it to disk.
 *
 * @param outputPath directory the outputs are collected in
 * @param outputBasename base name of this output to use for the manifest name
 * @param baseUrl baseUrl to where the media is hosted on the server
 * @param duration duration of the encoded media to use in the manifest
 *
 * @returns {string} the url to use in the sequence description (including baseUrl).
 */
function generateDashManifest(outputPath, outputBasename, baseUrl, duration) {
  const manifestName = `${outputBasename}.mpd`;
  const manifestPath = path.join(outputPath, manifestName);

  const minBufferTime = formatPT(2 * SEGMENT_DURATION);
  const durationPT = formatPT(duration);
  const segmentDurationPT = formatPT(SEGMENT_DURATION);
  const periodStartPT = formatPT(0);
  const adaptationSetId = '0'; // TODO hard-coded '0' in library should be taken from sequence.json.
  const representationAudioSamplingRate = SAMPLE_RATE;
  const representationBandwidth = ENCODE_BITRATE;
  const timescale = SAMPLE_RATE;
  const segmentDuration = timescale * SEGMENT_DURATION;
  const segmentMedia = `${outputBasename}/${DASH_SEGMENT_MEDIA}`;

  const manifestContents = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<MPD',
    '  type="static" xmlns="urn:mpeg:dash:schema:mpd:2011" profiles="urn:dvb:dash:profile:dvb-dash:2014,urn:dvb:dash:profile:dvb-dash:isoff-ext-live:2014"',
    `  minBufferTime="${minBufferTime}"`,
    `  mediaPresentationDuration="${durationPT}"`,
    `  maxSegmentDuration="${segmentDurationPT}"`,
    '>',
    `  <BaseURL>${baseUrl}</BaseURL>`,
    `  <Period start="${periodStartPT}" duration="${durationPT}">`,
    `    <AdaptationSet id="${adaptationSetId}" contentType="audio" segmentAlignment="true" mimeType="audio/mp4">`,
    `      <Representation id="0" mimeType="audio/mp4" codecs="mp4a.40.2" bandwidth="${representationBandwidth}" audioSamplingRate="${representationAudioSamplingRate}" />`,
    '      <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="1" />',
    `      <SegmentTemplate timescale="${timescale}" duration="${segmentDuration}" media="${segmentMedia}" startNumber="0" />`,
    '    </AdaptationSet>',
    '  </Period>',
    '</MPD>',
  ].join('\n');

  fs.writeFileSync(manifestPath, manifestContents);
  return `${baseUrl}/${manifestName}`;
}

function generateSilence() {
  spawnSync('ffmpeg', [
    '-hide_banner',
    '-loglevel', 'warning',
    '-y',
    '-f', 'lavfi',
    '-i', 'anullsrc=r=48000:cl=1',
    '-t', SILENCE_DURATION,
    SILENCE_PATH,
  ], { stdio: 'inherit' });
}

function encodeObjects(objects, inputPath, outputPath, baseUrl) {
  return objects.map(object => Object.assign({}, object, {
    items: object.items.map((item) => {
      let url = null;
      if (item.source.type === 'dash') {
        const basename = encodeDash(item.source.url, inputPath, outputPath, SILENCE_PATH);
        url = generateDashManifest(outputPath, basename, baseUrl, item.duration + SILENCE_DURATION);
      } else if (item.source.type === 'buffer') {
        url = encodeBuffer(item.source.url, inputPath, outputPath, baseUrl);
      }

      return Object.assign({}, item, {
        source: Object.assign({}, item.source, {
          url,
        }),
      });
    }),
  }));
}


mkdirIfNotExists(args.outputPath);
generateSilence();
const sequence = JSON.parse(fs.readFileSync(args.inputPathSequence));

sequence.duration = 0;
sequence.objects.forEach(({ items }) => {
  items.forEach(({ start, duration }) => {
    sequence.duration = Math.max(sequence.duration, start + duration);
  });
});

console.debug(sequence.duration);


sequence.objects = encodeObjects(
  sequence.objects,
  args.inputPath,
  args.outputPath,
  args.baseUrl,
);


fs.writeFileSync(path.join(args.outputPath, 'sequence.json'), JSON.stringify(sequence, null, 2));
