var Messenger, MockMessagingAdapter, m1, r1, c1, 
    responseHandler, timeoutHandler;

Messenger = require("Messenger");
MockMessagingAdapter = require("MockMessagingAdapter");
MessageFactory = require("MessageFactory");

m1 = MessageFactory.create("JoinREQ", "ses1", "ctx1", "dvc1", "sessions/123/RESP", "sessions/123/REQ", 1, "msg1", "v1");
r1 = MessageFactory.create("JoinRESP", "ses1", 0, "ws://172.19.0.1:6676", "ws://sessionsynccontroller.example.com", "msg1", "v1");
c1 = "sessions/123/devices/456";

describe ("Messenger", function () {

    beforeEach (function () {
        responseHandler = jasmine.createSpy("responseHandler");
        timeoutHandler = jasmine.createSpy("timeoutHandler");
        jasmine.clock().install();
    });

    afterEach (function () {
        jasmine.clock().uninstall();
    });

    it ("sendRequest: Receives a response to a request", function () {
        
        var adapter, messenger;
        adapter = new MockMessagingAdapter(r1, 200);
        messenger = new Messenger(adapter);
        
        messenger.sendRequest(m1, c1, responseHandler, { onMaxRetryFailed: timeoutHandler });
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler).not.toHaveBeenCalled();

        jasmine.clock().tick(201);
        expect(responseHandler).toHaveBeenCalledWith(r1);
        expect(timeoutHandler).not.toHaveBeenCalled();
    });

    it ("sendRequest: Receives a response after timeout and first retry", function () {
        
        var adapter, messenger;
        adapter = new MockMessagingAdapter(r1, 1500);
        messenger = new Messenger(adapter);

        messenger.sendRequest(m1, c1, responseHandler, { maxRetry: 1, onMaxRetryFailed: timeoutHandler });
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler).not.toHaveBeenCalled();

        jasmine.clock().tick(1200);
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler).not.toHaveBeenCalled();

        jasmine.clock().tick(1501);
        expect(responseHandler).toHaveBeenCalled();
        expect(timeoutHandler).not.toHaveBeenCalled();
    });

    it ("sendRequest: Cancels request after max number of retry attempts", function () {
        
        var adapter, messenger;
        adapter = new MockMessagingAdapter(r1, 2500);
        messenger = new Messenger(adapter);

        messenger.sendRequest(m1, c1, responseHandler, { maxRetry: 1, onMaxRetryFailed: timeoutHandler });
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler).not.toHaveBeenCalled();

        jasmine.clock().tick(1001);
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler).not.toHaveBeenCalled();

        jasmine.clock().tick(1000);
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler.calls.count()).toEqual(1);

        jasmine.clock().tick(1000);
        expect(responseHandler).not.toHaveBeenCalled();
        expect(timeoutHandler.calls.count()).toEqual(1);

        console.log(timeoutHandler.calls.argsFor(0));
    });

});