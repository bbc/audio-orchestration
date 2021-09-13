var ParameterList,
    WeakMap = require("weak-map"),
    PRIVATE = new WeakMap();

/**
 * @constructor
 * @name ParameterList
 */
ParameterList = function (params) {
    var priv;
    PRIVATE.set(this, {});
    priv = PRIVATE.get(this);
    priv.mandatory = [];
    priv.optional = [];
    this.extend(params);
}

/**
 * @typedef {object} Parameter
 * @property {string} name Name of this parameter
 * @property {string} type Type of this parameter
 * @property {boolean} writable Specifies if value of this parameter can be changed
 * @property {boolean} optional Specifies if this parameter is optional
 * @property {string} [default] Specifies default value for optional parameter
 */

/**
 * @function
 * @memberof ParameterList
 * @param {Parameter[]} params Array of Parameter objects
 */
ParameterList.prototype.extend = function (params) {
    var priv = PRIVATE.get(this);
    params.forEach(function (param) {
        if (!param.optional) {
            priv.mandatory.push(param);
        } else {
            priv.optional.push(param);
        }
    });
    return this;
}

/**
 * @function
 * @memberof ParameterList
 * @returns {Parameter[]} Array of Parameter objects
 */
ParameterList.prototype.get = function () {
    var priv = PRIVATE.get(this);
    return priv.mandatory.concat(priv.optional);
};

module.exports = ParameterList;
