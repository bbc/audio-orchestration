var MessageDispatcher = require("messagedispatcher/MessageDispatcher");

describe("MessageDispatcher", function () {

    var cb0, cb1, cb2, cb3, md, m1, m2, m3, r1, r2, r3;
    
    m1 = r1 = { id: "1" };
    m2 = r2 = { id: "2" };
    m3 = r3 = { id: "3" };

    it("Exists", function () {
        expect(MessageDispatcher).toBeDefined();
    });

    it("Creates instance", function () {
        md = new MessageDispatcher();
        expect(md).toBeDefined();
    });

    it("Sets a callback for a given message", function () {
        md = new MessageDispatcher();
        cb0 = jasmine.createSpy("cb0");
        md.set(m1, cb0);
        expect(cb0.and.identity()).toEqual("cb0");
    });

    it("Calls callback for a given response", function () {
        md.call(r1);
        expect(cb0).toHaveBeenCalled();
    });

    it("Sets multiple callbacks for given messages", function () {
        md = new MessageDispatcher();
        cb1 = jasmine.createSpy("cb1");
        cb2 = jasmine.createSpy("cb2");
        cb3 = jasmine.createSpy("cb3");
        md.set(m1, cb1);
        md.set(m2, cb2);
        md.set(m3, cb3);
        expect(cb1.and.identity()).toEqual("cb1");
        expect(cb2.and.identity()).toEqual("cb2");
        expect(cb3.and.identity()).toEqual("cb3");
    });

    it("Calls mutiple callbacks in expected order", function () {
        
        md.call(r1);
        expect(cb1).toHaveBeenCalled();
        expect(cb2).not.toHaveBeenCalled();
        expect(cb3).not.toHaveBeenCalled();
        
        md.call(r3);
        expect(cb2).not.toHaveBeenCalled();
        expect(cb3).toHaveBeenCalled();
        
        md.call(r2);
        expect(cb2).toHaveBeenCalled();
    });

    it("Calls timeout callback, if timeout expires", function () {
        
        var cbt, cb4;

        cb4 = jasmine.createSpy("cb4");
        cbt = jasmine.createSpy("cbt");
        
        jasmine.clock().install();

        md = new MessageDispatcher();
        md.set(m1, cb4, cbt, 1000);

        jasmine.clock().tick(0);
        expect(cbt).not.toHaveBeenCalled();
        expect(cb4).not.toHaveBeenCalled();

        jasmine.clock().tick(999);
        expect(cbt).not.toHaveBeenCalled();
        expect(cb4).not.toHaveBeenCalled();

        jasmine.clock().tick(1001);
        expect(cbt).toHaveBeenCalled();
        expect(cb4).not.toHaveBeenCalled();

        jasmine.clock().uninstall();
    });

    it("Does not call message handler, if callback expired", function () {

        var cbt, cb4;
        
        cb4 = jasmine.createSpy("cb4");
        cbt = jasmine.createSpy("cbt");
        
        jasmine.clock().install();

        md = new MessageDispatcher();
        md.set(m1, cb4, cbt, 1000);

        jasmine.clock().tick(1001);
        expect(cb4).not.toHaveBeenCalled();
        expect(cbt).toHaveBeenCalled();

        md.call(r1);
        expect(cb4).not.toHaveBeenCalled();
        
        jasmine.clock().uninstall();
    });

    it("Calls one-time message handler only once", function () {
        
        var cb4 = jasmine.createSpy("cb4");

        md = new MessageDispatcher();
        md.setOnce(m1, cb4);

        expect(cb4).not.toHaveBeenCalled();

        md.call(r1);
        expect(cb4.calls.count()).toEqual(1);

        md.call(r1);
        expect(cb4.calls.count()).toEqual(1);
    });
});