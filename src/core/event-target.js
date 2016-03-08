class EventTarget {
  // TODO: Consider adding more argument checking to the addEventListener,
  // removeEventListener and dispatchEvent methods.
  constructor() {
    this.listeners = {}
  }

  addEventListener(type, listener) {
    if (this.getListenerIdx(type, listener) === -1) {
      if (!this.listeners[type]) {
        this.listeners[type] = [];
      }
      this.listeners[type].push(listener);
    }
  }

  removeEventListener(type, listener) {
    const idx = this.getListenerIdx(type, listener);

    if (idx >= 0) {
      this.listeners[type].splice(idx, 1);
    }
  }

  dispatchEvent(event) {
    const typeListeners = this.listeners[event.type];

    if (typeListeners) {
      for (let i = 0; i < typeListeners.length; i++) {
        typeListeners[i].call(null, event);
      }
    }
  }

  getListenerIdx(type, listener) {
    const typeListeners = this.listeners[type];

    if (typeListeners) {
      for (let i = 0; i < typeListeners.length; i++) {
        if (typeListeners[i] === listener) {
          return i;
        }
      }
    }

    return -1;
  }
}

export default EventTarget;
