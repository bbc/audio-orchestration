import Clocks from 'dvbcss-clocks';
import SyncPlayers from 'bbcat-orchestration/src/sync-players';
import SequenceRenderer from 'bbcat-orchestration/src/sequence-renderer';

const { AudioContextClock } = SyncPlayers;
const { Sequence, SynchronisedSequenceRenderer } = SequenceRenderer;

const audioContext = new AudioContext();
const sysClock = new AudioContextClock({}, audioContext);
const clock = new Clocks.CorrelatedClock(sysClock, { correlation: [0, 0], speed: 0, tickRate: 1 });
const loopClock = new Clocks.CorrelatedClock(clock, { correlation: [0, 0], speed: 1, tickRate: 1 });
const mainClock = new Clocks.CorrelatedClock(clock, { correlation: [0, 0], speed: 0, tickRate: 1 });

const isStereo = true;

function initRenderer(sequenceData, rendererClock) {
  const sequence = new Sequence(sequenceData);
  const renderer = new SynchronisedSequenceRenderer(
    audioContext,
    rendererClock,
    sequence,
    isStereo,
  );
  renderer.output.connect(audioContext.destination);

  console.log(renderer);

  return renderer;
}

function initControls(renderer, el) {
  const inputs = [];
  renderer.sequence.objectIds.forEach((objectId) => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = objectId;

    const label = document.createElement('label');
    label.appendChild(input);
    label.appendChild(document.createTextNode(objectId));

    el.appendChild(label);
    inputs.push(input);
  });

  const btn = document.createElement('button');
  btn.innerText = 'Allocate Objects';
  btn.addEventListener('click', () => renderer.setActiveObjectIds(inputs
    .filter(d => d.checked)
    .map(d => d.value)));
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
    .then(data => initRenderer(data, mainClock))
    .then((renderer) => {
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
    .then(data => initRenderer(data, loopClock))
    .then((renderer) => {
      initControls(renderer, document.getElementById('object-ids-loop'));
      return renderer;
    });

  Promise.all([mainRendererPromise, loopRendererPromise])
    .then(([mainRenderer, loopRenderer]) => {
      document.getElementById('btn-transition').addEventListener('click', (e) => {
        e.target.disabled = true;
        loopRenderer.setActiveObjectIds(['music']);
        const syncTime = loopRenderer.stopAtOutPoint(0.5);
        const correlation = [clock.now() + (syncTime - audioContext.currentTime), 0];
        console.debug(
          `current: ${audioContext.currentTime}, sync: ${syncTime}`,
          `new correlation: ${correlation}`,
        );
        mainClock.setCorrelationAndSpeed(correlation, 1);
      });
    })
    .then(() => {
      const clickHandlers = {
        'btn-play': () => clock.setCorrelationAndSpeed([sysClock.now(), clock.now()], 1),
        'btn-pause': () => clock.setCorrelationAndSpeed([sysClock.now(), clock.now()], 0),
        'btn-reset': () => clock.setCorrelationAndSpeed([sysClock.now(), 0], 1),
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
