/**
 * An implementaton of the Event-Listener pattern that meets the
 * EventTarget interface specified by Mozilla.
 * @abstract
 * @private
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
 */
export default class EventTarget {
  /**
   * Constructs a new {@link EventTarget}.
   */
  constructor() {
    this._listeners = {};
  }

  /**
   * Registers an event listener of a specific event type.
   * @param  {!string} type
   *         A string representing the event type to listen for.
   * @param  {!function(event: Object)} listener
   *         The javascript function/callback that is called when an event of
   *         the specified type occurs.
   */
  addEventListener(type, listener) {
    if (this._getListenerIdx(type, listener) === -1) {
      if (!this._listeners[type]) {
        this._listeners[type] = [];
      }
      this._listeners[type].push(listener);
    }
  }

  /**
   * Removes an event listener.
   * @param  {!string} type
   *         A string representing the event type to remove.
   * @param  {!function(event: Object)} listener
   *         The javascript function/callback to remove.
   */
  removeEventListener(type, listener) {
    const idx = this._getListenerIdx(type, listener);

    if (idx >= 0) {
      this._listeners[type].splice(idx, 1);
    }
  }

  /**
   * Dispatches an event, invoking the affected listeners.
   * @param  {!Object} event
   *         The event object to be dispatched.
   */
  dispatchEvent(event) {
    const typeListeners = this._listeners[event.type];

    if (typeListeners) {
      for (let i = 0; i < typeListeners.length; i++) {
        typeListeners[i].call(null, event);
      }
    }
  }

  /**
   * @private
   * Gets the index of the type/listener.
   * @param  {!string} type
   *         A string representing the event type.
   * @param  {!function(event: Object)} listener
   *         The javascript function/callback.
   * @return {number} The index of the type/listener.
   */
  _getListenerIdx(type, listener) {
    const typeListeners = this._listeners[type];

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
