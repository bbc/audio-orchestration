const fs = require('fs');

const MAX_BUFFER_DURATION = 10;
const inputPathMDOData = process.argv[2];
const inputPathTrackData = process.argv[3];

if (inputPathMDOData === undefined) {
  console.error('Path to MDO data table not set. Point to csv export of table, or json file produced by S3A MDO Table plugin.');
  process.exit(1);
}

if (inputPathTrackData === undefined) {
  console.warn('Path to Track metadata not set. Generate with ../split-tracks/get_metadata. Not generating items.');
}


// type conversions for mdo metadata
const toInt = s => parseInt(s, 10);
const toFloat = s => parseFloat(s, 10);
const toBool = s => parseInt(s, 10) === 1;
const toString = s => s;

const conversions = {
  objectNumber: toInt,
  label: toString,
  group: toInt,
  mdoThreshold: toInt,
  mdoOnly: toBool,
  mdoMethod: toInt,
  speakerNumber: toInt,
  diffuseness: toFloat,
  mdoSpread: toBool,
  mdoDynamic: toInt,
  mdoGainDB: toFloat,
  muteIfObject: toInt,
  exclusivity: toBool,
  nearFront: toInt,
  nearSide: toInt,
  nearRear: toInt,
  farFront: toInt,
  farSide: toInt,
  farRear: toInt,
  above: toInt,
  onDropin: toInt,
  onDropout: toInt,
  minQuality: toInt,
  image: toString,
};

function transformOrchestration(data) {
  const ret = {};
  Object.keys(conversions).forEach((prop) => {
    ret[prop] = conversions[prop](data[prop]);
  });
  return ret;
}

/**
 * parses a JSON object, or a CSV table representing the MDO metadata. Does not transform this data
 * in any way, just convert a csv into a list of objects with a key per column.
 * TODO: Except it has to rename column names that were changed in the spreadsheet.
 */
function parseMdoTable(contents) {
  try {
    // try parsing as JSON.
    return JSON.parse(contents).mdoObjects;
  } catch (e) {
    // if it's not valid json, assume it is a csv file.
    const lines = contents.split('\n');
    const keys = lines.shift().split(',').map(s => s.trim());

    return lines.map((line) => {
      const values = line.split(',').map(s => s.trim());
      const ret = {};
      keys.forEach((k, i) => {
        ret[k] = values[i];
      });

      // TODO: Hack, the spreadsheet refers to the label property as mdoObjectLabel
      ret.label = ret.mdoObjectLabel;
      return ret;
    }).filter(({ objectNumber }) => objectNumber !== '');
  }
}

// TODO assume mdoMetadata also has fields for filename, panning, in addition to the data output
// from the S3A table.
const mdoMetadata = parseMdoTable(fs.readFileSync(inputPathMDOData, 'utf8'));
const trackMetadata = inputPathTrackData !== undefined ?
  JSON.parse(fs.readFileSync(inputPathTrackData, 'utf8')) : [];

const sequenceData = {
  duration: 0,
  loop: false,
  outPoints: [],
  objects: mdoMetadata.map(metadata => ({
    objectId: `${toInt(metadata.objectNumber)}-${metadata.label}`,
    filename: metadata.filename,
    panning: toInt(metadata.panning),
    orchestration: transformOrchestration(metadata),
    items: [],
  })),
};

sequenceData.objects.forEach(({ filename, items, panning }) => {
  let channelMapping = 'mono';
  if (panning === -30) {
    channelMapping = 'right';
  } else if (panning === 30) {
    channelMapping = 'left';
  }

  const track = trackMetadata.find(({ trackName }) => filename.startsWith(trackName));
  if (track === undefined) {
    return;
  }
  track.objects.forEach(({ filename: itemFilename, startTime, duration }) => {
    items.push({
      start: startTime,
      duration,
      source: {
        channelMapping,
        type: duration < MAX_BUFFER_DURATION ? 'buffer' : 'dash',
        url: `${track.trackName}/${itemFilename}`,
      },
    });
  });
});

process.stdout.write(JSON.stringify(sequenceData, null, 2));
