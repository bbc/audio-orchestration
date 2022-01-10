/**
 * Copyright (C) 2021, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
/**
 * @class
 * Provides an API similar to an AudioBufferSourceNode, so it can be used to calculate when the
 * image should be visible.
 */
class ImageSourceNode {
  constructor(imageContext, image, duration, priority) {
    this.imageContext = imageContext;
    this.image = image;
    this.duration = duration;
    this.priority = priority;

    // tracking state of this source node
    this.stopped = true; // initially stopped
    this.when = 0; // to be set to scheduled start time
    this.offset = 0; // to be set to media time to play from
    this.onended = null; // to be set to a handler function
    this.calledOnEnded = false; // track whether onended has been called
  }

  play(when, offset = this.offset) {
    this.stopped = false;
    this.when = when;
    this.offset = offset;
    this.calledOnEnded = false;
  }

  stop() {
    this.stopped = true;
  }

  /**
   * @return {bool} active - whether the source is currently playing (started and within duration)
   */
  isActive() {
    const now = this.imageContext.currentTime;
    const started = !this.stopped && now >= this.when;
    const ended = now >= this.when + (this.duration - this.offset);

    // Call onended handler if registered and its the first time we are past the duration since
    // calling play().
    if (ended && !this.calledOnEnded && this.onended) {
      this.onended();
      this.calledOnEnded = true;
    }

    return !this.stopped && started && !ended;
  }

  connect(destination) {
    this.imageContext.connect(this, destination);
  }

  disconnect() {
    this.imageContext.disconnect(this);
  }
}

export default ImageSourceNode;
