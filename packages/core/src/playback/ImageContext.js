/**
 * Copyright (C) 2022, BBC R&D
 * This source code is licensed under the GPL license found in the LICENSE file in this repository.
 */
import ImageSourceNode from './ImageSourceNode';

class ImageContext {
  constructor(updateCallback, audioContext) {
    this._updateCallback = updateCallback;
    this._nodes = new Set();
    this._currentSource = null;
    this._audioContext = audioContext;
    this._timeoutLength = 100;
    this._timeout = 0; // hold reference for each subsequent tick

    this._nextNodeId = 0;
  }

  tick() {
    clearTimeout(this._timeout);

    // Find the currently active (started, and within duration) source node with highest priority.
    // Set iteration is in insertion order, so we should always choose the oldest active node if
    // there are multiple with the same priority.
    const newSource = [...this._nodes]
      .filter((node) => node.isActive())
      .reduce((highestPriorityNode, node) => {
        if (!highestPriorityNode || node.priority > highestPriorityNode.priority) {
          return node;
        }
        return highestPriorityNode;
      }, null);

    let updateRequired = false;
    if (newSource !== this._currentSource) {
      this._currentSource = newSource;
      updateRequired = true;
    }

    // Update with the currentSource's image, or null.
    if (updateRequired) {
      this._update();
    }

    // schedule the next update if there are any registered nodes
    if (this._nodes.size > 0) {
      this._scheduleNextTick();
    }
  }

  _scheduleNextTick() {
    clearTimeout(this._timeout);
    this._timeout = setTimeout(() => this.tick(), this._timeoutLength);
  }

  _update() {
    if (this._updateCallback) {
      if (this._currentSource) {
        this._updateCallback(this._currentSource.image);
      } else {
        this._updateCallback(null);
      }
    }
  }

  // eslint-disable-next-line no-unused-vars
  connect(node, destination) {
    this._nodes.add(node);
    this._scheduleNextTick();
  }

  disconnect(node) {
    this._nodes.delete(node);
  }

  pause() {
    clearTimeout(this._timeout);
  }

  resume() {
    this._scheduleNextTick();
  }

  createImageSource(...args) {
    const source = new ImageSourceNode(this, ...args);
    source.nodeId = this._nextNodeId;
    this._nextNodeId += 1;
    return source;
  }

  get currentTime() {
    return this._audioContext.currentTime;
  }
}

export default ImageContext;
