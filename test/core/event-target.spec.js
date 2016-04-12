import EventTarget from './../../src/core/event-target';

describe('EventTarget', function() {
  it('should add a listener', function() {
    const eventTarget = new EventTarget();
    const eventFunction = jasmine.createSpy('eventFunction');
    const testEvent = { type: 'testevent' };

    eventTarget.addEventListener(testEvent.type, eventFunction);
    eventTarget.dispatchEvent(testEvent);

    expect(eventFunction).toHaveBeenCalledWith(testEvent);
  });

  it('should remove a listener', function() {
    const eventTarget = new EventTarget();
    const eventFunction = jasmine.createSpy('eventFunction');
    const testEvent = { type: 'testevent' };

    eventTarget.addEventListener(testEvent.type, eventFunction);
    eventTarget.removeEventListener(testEvent.type, eventFunction);
    eventTarget.dispatchEvent(testEvent);

    expect(eventFunction).not.toHaveBeenCalled();
  });

  it('should handle single listener multiple events', function() {
    const eventTarget = new EventTarget();
    const eventFunction = jasmine.createSpy('eventFunction');
    const testEvent1 = { type: 'testevent1' };
    const testEvent2 = { type: 'testevent2' };

    // Add listener for multiple events and emit events.
    eventTarget.addEventListener(testEvent1.type, eventFunction);
    eventTarget.addEventListener(testEvent2.type, eventFunction);
    eventTarget.dispatchEvent(testEvent2);
    eventTarget.dispatchEvent(testEvent1);

    // Test listener was called for both events, once each.
    expect(eventFunction).toHaveBeenCalledWith(testEvent1);
    expect(eventFunction).toHaveBeenCalledWith(testEvent2);
    expect(eventFunction).toHaveBeenCalledTimes(2);

    // Remove the listener for only one of the events.
    eventTarget.removeEventListener(testEvent1.type, eventFunction);

    // Emit event still being listened for and ensure listener is called.
    eventTarget.dispatchEvent(testEvent2);
    expect(eventFunction).toHaveBeenCalledTimes(3);

    // Emit event not being listened for and ensure listener is not called.
    eventTarget.dispatchEvent(testEvent1);
    expect(eventFunction).toHaveBeenCalledTimes(3);
  });

  it('should handle single event multiple listeners', function() {
    const eventTarget = new EventTarget();
    const eventFunction1 = jasmine.createSpy('eventFunction1');
    const eventFunction2 = jasmine.createSpy('eventFunction2');
    const testEvent = { type: 'testevent' };

    // Add two event listerners and then dispatch an event.
    eventTarget.addEventListener(testEvent.type, eventFunction1);
    eventTarget.addEventListener(testEvent.type, eventFunction2);
    eventTarget.dispatchEvent(testEvent);

    // Test both function are called with the correct param only once.
    expect(eventFunction1).toHaveBeenCalledWith(testEvent);
    expect(eventFunction1).toHaveBeenCalledTimes(1);

    expect(eventFunction2).toHaveBeenCalledWith(testEvent);
    expect(eventFunction2).toHaveBeenCalledTimes(1);

    // Remove one of the event listeners.
    eventTarget.removeEventListener(testEvent.type, eventFunction1);
    eventTarget.dispatchEvent(testEvent);

    // Test remaining function still fires.
    expect(eventFunction1).toHaveBeenCalledTimes(1);
    expect(eventFunction2).toHaveBeenCalledTimes(2);
  });
});
