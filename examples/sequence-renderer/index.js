import Clocks from 'dvbcss-clocks';
import SyncPlayers from 'bbcat-orchestration/src/sync-players';
import SequenceRenderer from 'bbcat-orchestration/src/sequence-renderer';

const { AudioContextClock } = SyncPlayers;
const { Sequence, SynchronisedSequenceRenderer } = SequenceRenderer;

const audioContext = new AudioContext();
const sysClock = new AudioContextClock({}, audioContext);
const clock = new Clocks.CorrelatedClock(sysClock, { correlation: [0, 0], speed: 0, tickRate: 1 });
const isStereo = true;

function initRenderer(sequenceData) {
  const sequence = new Sequence(sequenceData);
  const renderer = new SynchronisedSequenceRenderer(audioContext, clock, sequence, isStereo);
  renderer.output.connect(audioContext.destination);

  console.log(renderer);

  return renderer;
}

function getSelectedObjectIds() {
  const objectIds = [];
  document.querySelectorAll('input[type=checkbox]:checked').forEach(input =>
    objectIds.push(input.value));
  return objectIds;
}

function initControls(renderer) {
  renderer.sequence.objectIds.forEach((objectId, i) => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = (i === 0);
    input.value = objectId;

    const label = document.createElement('label');
    label.appendChild(input);
    label.appendChild(document.createTextNode(objectId));

    document.getElementById('object-ids').appendChild(label);
  });

  const clickHandlers = {
    'btn-play': () => clock.setCorrelationAndSpeed([sysClock.now(), clock.now()], 1),
    'btn-pause': () => clock.setCorrelationAndSpeed([sysClock.now(), clock.now()], 0),
    'btn-reset': () => clock.setCorrelationAndSpeed([sysClock.now(), 0], 1),
    'btn-skip': () => clock.setCorrelationAndSpeed([sysClock.now(), clock.now() + 10], 1),
    'btn-allocate': () => renderer.setActiveObjectIds(getSelectedObjectIds()),
  };
  Object.entries(clickHandlers).forEach(([id, cb]) => {
    document.getElementById(id).addEventListener('click', cb);
  });
}

function init() {
  fetch('./sequence.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error('could not download sequence.json');
      }
      return response.json();
    })
    .then(data => initRenderer(data))
    .then(renderer => initControls(renderer));

  setInterval(() => {
    document.getElementById('clock').innerText = clock.now().toFixed(1);
  }, 100);
}

init();
