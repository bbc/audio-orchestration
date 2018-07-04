const fs = require('fs');

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
};

function transformOrchestration(data) {
  const ret = {};
  Object.keys(conversions).forEach((prop) => {
    ret[prop] = conversions[prop](data[prop]);
  });
  return ret;
}

const inputPath = process.argv[2];
const mdoMetadata = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const sequenceData = {
  duration: 0,
  loop: false,
  outPoints: [],
  objects: mdoMetadata.mdoObjects.map(metadata => ({
    objectId: `${metadata.objectNumber}-${metadata.label}`,
    items: [],
    orchestration: transformOrchestration(metadata),
  })),
};


console.log(JSON.stringify(sequenceData, null, 2));
