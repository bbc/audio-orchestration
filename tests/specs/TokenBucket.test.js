var TokenBucket = require("../../src/common/util/TokenBucket");

var tocketBucket = null;
var bucketSize = 2;
var restockInterval = 1;

describe("TokenBucket", function () {

    beforeEach (function () {
        tokenBucket = new TokenBucket(bucketSize, restockInterval);
        jasmine.clock().install();
    });

    afterEach (function () {
        jasmine.clock().uninstall();
    });


    it ("Exists", function () {
        expect(TokenBucket).toBeDefined();
    });

    it ("Creates instance", function () {
        expect(tokenBucket instanceof TokenBucket).toBe(true);
    });

    it ("Dispenses tokens", function () {
        var token = tokenBucket.getToken();
        expect(typeof token).toBe("string");
    });

    it ("Stops dispensing tokens, if bucket is empty", function () {
        var token;
        
        token = tokenBucket.getToken();
        expect(typeof token).toBe("string");

        token = tokenBucket.getToken();
        expect(typeof token).toBe("string");

        token = tokenBucket.getToken();
        expect(token).toBe(null);
    });

    it ("Refills bucket after restock interval", function () {
        var token;
        
        token = tokenBucket.getToken();
        expect(typeof token).toBe("string");

        token = tokenBucket.getToken();
        expect(typeof token).toBe("string");

        jasmine.clock().tick(1001);
        expect(typeof token).toBe("string");
    });

});