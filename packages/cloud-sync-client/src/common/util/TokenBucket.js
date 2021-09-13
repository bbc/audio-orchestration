var WeakMap = require("weak-map");

var PRIVATE = new WeakMap();


/**
 * @class TokenBucket
 * 
 * @classdesc
 * A token bucket for rate limiting using the token
 * {@link https://blog.figma.com/an-alternative-approach-to-rate-limiting-f8a06cf7c94c|bucket algorithm}.
 * An action subject to rate limiting should only be
 * performed if the TokenBucket.getToken call returns
 * a token other than null.
 * 
 * @example
 * var bucketSize = 50 // tokens
 * var restockInterval = 10 // seconds
 * var tokenBucket = new TokenBucket(bucketSize, restockInterval);
 * 
 * // Implement a function for rate-limited transmission of messages
 * function send (message) {
 *     if (tocketBucket.getToken() !== null) {
 *         // Do send message
 *     }
 * }
 * 
 * @constructor
 * @param {number} bucketSize Number of tokens in a filled bucket
 * @param {number} restockInterval Interval in seconds after which the bucket is refilled 
 */
var TokenBucket = function (bucketSize, restockInterval) {
    PRIVATE.set(this, {
        size: bucketSize,
        restockInterval: restockInterval*1000, // to milis
        lastBucketRestock: null,
        numTokensInBucket: 0
    });
};

/**
 * Returns null if bucket is empty, else returns token
 * @returns {string} 
 */
TokenBucket.prototype.getToken = function () {
    var priv = PRIVATE.get(this);

    if (checkBucket.call(this)) {
        priv.numTokensInBucket -= 1;
        return generateToken.call(this);
    } else {
        return null;
    }
};

/**
 * Returns false if bucket is empty, else returns true.
 * Fills bucket if last restock date exceeds 'restockInterval'
 * or if bucket was never filled before.
 * 
 * @returns {boolean}
 */
function checkBucket () {
    var priv = PRIVATE.get(this);

    // Fill bucket initialy or if last restock date exceeds 'restockInterval'
    if (priv.lastBucketRestock === null || (Date.now() - priv.lastBucketRestock > priv.restockInterval)) {
        fillBucket.call(this);
    }
    
    if (priv.numTokensInBucket < 1) {
        return false;
    } else {
        return true;
    }
}

function fillBucket () {
    var priv = PRIVATE.get(this);
    priv.numTokensInBucket = priv.size;
    priv.lastBucketRestock = Date.now();
}

function generateToken () {
    return "token";
}

module.exports = TokenBucket;