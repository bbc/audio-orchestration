import Clocks from 'dvbcss-clocks';
import { AudioContextClock } from '../../src/sync-players';
import { Sequence, SynchronisedSequenceRenderer } from '../../src/sequence-renderer';

const audioContext = new AudioContext();
const sysClock = new AudioContextClock({}, audioContext);
const clock = new Clocks.CorrelatedClock(sysClock, { correlation: [0, 0], speed: 0, tickRate: 1 });
const isStereo = true;

function initRenderer(sequenceData, rendererClock) {
  const sequence = new Sequence(sequenceData);
  const renderer = new SynchronisedSequenceRenderer(
    audioContext,
    null,
    rendererClock,
    sequence,
    isStereo,
  );
  renderer.output.connect(audioContext.destination);

  return renderer;
}

function initControls(renderer, el) {
  const inputs = [];
  renderer.sequence.objectIds.forEach((objectId) => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = objectId;
    input.checked = renderer.activeObjectIds.includes(objectId);

    const label = document.createElement('label');
    label.appendChild(input);
    label.appendChild(document.createTextNode(objectId));

    el.appendChild(label);
    inputs.push(input);
  });

  const btn = document.createElement('button');
  btn.innerText = 'Allocate Objects';
  btn.addEventListener('click', () => renderer.setActiveObjects(inputs
    .filter(d => d.checked)
    .map(d => ({ objectId: d.value }))));
  el.appendChild(btn);
}

function init() {
  const mainRendererPromise = fetch('./intro.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error('could not download intro.json');
      }
      return response.json();
    })
    .then(data => initRenderer(data, clock))
    .then((renderer) => {
      renderer.setActiveObjects(renderer.sequence.objectIds.map(objectId => ({ objectId })));
      initControls(renderer, document.getElementById('object-ids-main'));
      return renderer;
    });

  const loopRendererPromise = fetch('./loop.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error('could not download loop.json');
      }
      return response.json();
    })
    .then(data => initRenderer(data, clock))
    .then((renderer) => {
      renderer.start(0);
      renderer.setActiveObjects(renderer.sequence.objectIds.map(objectId => ({ objectId })));
      initControls(renderer, document.getElementById('object-ids-loop'));
      return renderer;
    });

  Promise.all([mainRendererPromise, loopRendererPromise])
    .then(([mainRenderer, loopRenderer]) => {
      document.getElementById('btn-transition').addEventListener('click', (e) => {
        e.target.disabled = true;
        loopRenderer.setActiveObjects([{ objectId: 'music' }]);
        const syncTime = loopRenderer.stopAtOutPoint(2);
        mainRenderer.start(syncTime);
      });
    })
    .then(() => {
      const clickHandlers = {
        'btn-play': () => clock.setCorrelationAndSpeed([sysClock.now(), clock.now()], 1),
        'btn-pause': () => clock.setCorrelationAndSpeed([sysClock.now(), clock.now()], 0),
        'btn-skip': () => clock.setCorrelationAndSpeed([sysClock.now(), clock.now() + 10], 1),
      };
      Object.entries(clickHandlers).forEach(([id, cb]) => {
        document.getElementById(id).addEventListener('click', cb);
      });

      setInterval(() => {
        document.getElementById('clock').innerText = clock.now().toFixed(1);
      }, 100);
    })
    .catch((e) => {
      console.error(e);
    });
}

init();
