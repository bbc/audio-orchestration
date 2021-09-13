import express from 'express';
import http from 'http';
import clocks from 'dvbcss-clocks';
import { TimelineSyncServer, SimpleClockTimelineSource } from './TimelineSync';
import { WallClockServer } from './WallClock';

const PAUSE_DURATION = 1000;
const MEDIA_DURATION = 5000;

function spoofTimelineSource(wallClock, server) {
  const timelineClock = new clocks.CorrelatedClock(wallClock, {
    tickRate: 1000,
    correlation: [0, 0],
    speed: 0,
  });

  const timelineSelector = 'timeline-selector';

  const timelineSource = new SimpleClockTimelineSource(timelineSelector, wallClock, timelineClock, {
    autoUpdateClients: true,
  });

  function togglePlayback() {
    if (timelineClock.speed === 0) {
      console.log('play');
      timelineClock.setCorrelationAndSpeed([wallClock.now(), 0], 1);
      setTimeout(togglePlayback, MEDIA_DURATION);
    } else {
      console.log('pause');
      timelineClock.setSpeed(0);
      setTimeout(togglePlayback, PAUSE_DURATION);
    }
  }

  server.attachTimelineSource(timelineSource);
  togglePlayback();
}

export default function initSyncServices() {
  // create an http server
  const app = express();
  const server = http.createServer(app);

  // Create the system and wall clock objects
  const sysClock = new clocks.DateNowClock();
  const wallClock = new clocks.CorrelatedClock(sysClock, { tickRate: 1000 });

  const wcProtocolOptions = {
    precision: sysClock.dispersionAtTime(sysClock.now()),
    maxFreqError: sysClock.getRootMaxFreqError(),
    followup: true,
  };

  // create the wall clock server and attach at /wc.
  const wcServer = new WallClockServer(wallClock, wcProtocolOptions, {});
  wcServer.attachToServer(server, '/wc');

  // Create the TimelineSyncServer and attach at /ts.
  const tsServer = new TimelineSyncServer('content-id', wallClock, {});
  tsServer.attachToServer(server, '/ts');

  // Create a timeline source that keeps pausing, playing, stopping.
  spoofTimelineSource(wallClock, tsServer);

  // start the http server
  const host = '0.0.0.0';
  const port = 7681;

  server.listen(port, host, () => {
    console.log(`WebSocket services listening on ${host}:${port}`);
  });
}
