import {
  CompoundNode
} from '../core/_index';

import AudioSegmentStream from './streams/audio-segment-stream';
import MetadataSegmentStream from './streams/metadata-segment-stream';

export default class DashSourceNode extends CompoundNode {
  constructor(context, manifest) {
    super(context);

    // Maintain a list of the audio streams in addition to a list of all
    // streams, allowing easier iteration of the audio streams only.
    this.allStreams = [];
    this.audioStreams = [];
    this.totalChannels = 0;

    this.initStreams(manifest);
    this.initAudioGraph();
    this.setState('ready');
  }

  initStreams(manifest) {
    // Digests the manifest into a set of streams. Each stream manages a buffer
    // for downloaded segments and synchronises scheduling (and playback in the
    // case of audio) to the AudioContext.
    this.playbackDuration = manifest.mediaPresentationDuration;
    const bufferTime = manifest.minBufferTime;
    const baseURL = manifest.baseURL[0];

    for (let i = 0; i < manifest.periods.length; i++) {
      const period = manifest.periods[i];

      for (let j = 0; j < period.adaptationSets.length; j++) {
        const adaptationSet = period.adaptationSets[j];
        const template = adaptationSet.segmentTemplate;

        const templateDefinition = {
          id: `${period.id}-${adaptationSet.id}`,
          type: adaptationSet.mimeType,
          start: period.start + template.presentationTimeOffset,
          duration: period.duration,
          segmentStart: template.startNumber,
          segmentDuration: Math.floor(template.duration / template.timescale),
          channelCount: adaptationSet.value,
          templateUrl: baseURL + template.media,
          bufferTime: bufferTime
        }

        if (adaptationSet.mimeType.indexOf('json') > -1) {
          // If type is JSON then create a metadata stream.
          const metadataStream = new MetadataSegmentStream(
            this.context,
            templateDefinition
          );

          // Bubble bufferedsegment events as metadataevent allow a listening
          // for all metadata against the DashSourceNode.
          metadataStream.addEventListener('bufferedsegment', (event) => {
            this.dispatchMetadataEvent(event);
          });

          this.allStreams.push(metadataStream);
        } else if (adaptationSet.mimeType.indexOf('audio') > -1) {
          // If type is audio then create an audio stream.
          const audioStream = new AudioSegmentStream(
            this.context,
            templateDefinition
          );

          // Tally up the total number of channels across all audio streams.
          this.totalChannels += audioStream.channelCount;
          this.audioStreams.push(audioStream);
          this.allStreams.push(audioStream);
        }
      }
    }
  }

  initAudioGraph() {
    // Create and connect a ChannelMergerNode to merge all output channels from
    // each audio stream into a single output. NOTE: Chrome and firefox have
    // arbitrary limits to the number of channels that can be merged (currently
    // 32). This limit will be relaxed in the future.
    const merger = this.context.createChannelMerger(this.totalChannels);
    this.outputs[0] = merger;

    let input = 0;
    for (let i = 0; i < this.audioStreams.length; i++) {
      const stream = this.audioStreams[i];

      for (let output = 0; output < stream.output.numberOfOutputs; output++) {
        stream.output.connect(merger, output, input);
        input++;
      }
    }
  }

  start(playbackStart = 0) {
    // Node must be in a ready state.
    if (this.state !== 'ready') {
      return;
    }

    // playbackStart must be non-nagative and less than duration.
    if (playbackStart < 0 || playbackStart >= this.playbackDuration) {
      throw "Invalid playbackStart";
    }

    this.setState('priming');
    this.playbackStart = playbackStart;

    // Prime and then start (syncing to a common context time) all streams.
    var promises = [];
    for (let i = 0; i < this.allStreams.length; i++) {
      promises.push(this.allStreams[i].prime(this.playbackStart));
    }

    Promise.all(promises).then(() => {
      this.setState('playing');
      this.contextSyncTime = this.context.currentTime;
      for (let i = 0; i < this.allStreams.length; i++) {
        this.allStreams[i].start(this.contextSyncTime);
      }

      this.checkIfEndedInterval = setInterval(
        () => this.checkIfEnded(), 100
      );
    });
  }

  checkIfEnded() {
    // Stop all streams and clocks when the presentation has ended.
    if (this.getCurrentPlaybackTime() > this.playbackDuration) {
      this.stop();
      this.dispatchEndedEvent();
    }
  }

  stop() {
    // Node must be in a playing state.
    if (this.state !== 'playing') {
      return;
    }

    // Stop all streams.
    clearInterval(this.checkIfEndedInterval);
    for (let i = 0; i < this.allStreams.length; i++) {
      this.allStreams[i].stop();
    }

    this.setState('ready');
  }

  getCurrentPlaybackTime() {
    return this.context.currentTime - this.contextSyncTime + this.playbackStart;
  }

  setState(state) {
    this.state = state;
    this.dispatchStateChangeEvent(this.state);
  }

  dispatchMetadataEvent(event) {
    this.dispatchEvent({
      src: this,
      type: 'metadataevent',
      metadata: event.segment
    });
  }

  dispatchStateChangeEvent(state) {
    this.dispatchEvent({
      src: this,
      type: 'statechange',
      state
    });
  }

  dispatchEndedEvent() {
    this.dispatchEvent({
      src: this,
      type: 'ended'
    });
  }
}
