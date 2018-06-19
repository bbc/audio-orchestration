function $ (id) {
    id = getElement(id);
    addMyMethods(id);
    return id;
}

function getElement (param) {
    var op, val;
    if (typeof param === "string") {
        op = param.substring(0, 1);
        val = param.substring(1);
        switch (op) {
            case "#":
                return document.getElementById(val);
            case ".":
                return document.getElementsByClassName(val);
            default:
                return document.getElementsByTagName(param);
        }
    }
    else if (typeof param === "object") {
        return param;
    }
}

function addMyMethods (elem) {
    var i = 0;
    if (typeof elem.length !== "undefined" && typeof elem[0] !== "undefined") {
        addMethodsToCollection(elem);
    }
    else if (elem !== null && typeof elem.addEventListener !== "undefined") {
        addMyMethodsToElement(elem);
    };
}

function addMethodsToCollection (elem) {
    elem.on = function () {
        for (var i = 0; i < elem.length; i++) {
            elem[i].addEventListener(arguments[0], arguments[1]);
        }
    }
}

function addMyMethodsToElement (elem) {
    // Aliases
    elem.on = elem.addEventListener;
}

module.exports = $;