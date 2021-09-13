module.exports = function (arguments) {
    var i = 0, arr = [];
    for (; i < arguments.length; i++) {
        arr.push(arguments[i]);
    }
    return arr;
}