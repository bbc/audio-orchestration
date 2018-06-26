function stringify (arr) {
    var i, urn;
    urn = "urn";
    arr.forEach(function(elem) {
        urn += ":" + elem;
    });
    return urn;
}

function parse (urnString) {
    return urnString.split(":").splice(1);
}

module.exports = {
    stringify: stringify,
    parse: parse
};