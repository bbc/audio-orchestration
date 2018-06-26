var WeakMap = require("weak-map");
var $ = require("../Utility/$");
var PRIVATE = new WeakMap();

var SelectList = function (name, list) {
    var ul, li, self, overlay, node;

    self = this;
    ul = document.createElement("ul");
    ul.className = "pure-menu-list";

    overlay = document.createElement("div");
    overlay.className = "overlay";
    $("body")[0].appendChild(overlay);

    list.forEach(function (item) {
        li = document.createElement("li");
        li.innerHTML = '<a href="#" class="pure-menu-link">' + item.name + '</a>';
        li.className = "pure-menu-item";
        ul.appendChild(li);
        $(li).on("click", select.bind(self, item));
    });

    node = document.createElement("div");
    node.className = "pure-menu select-list";
    node.innerHTML = '<span class="pure-menu-heading">' + name + '</span>';
    node.appendChild(ul);

    PRIVATE.set(this, {
        overlay: overlay,
        node: node
    });

    return node;
};

function select (item) {
    close.call(this);
    item.action();
}

function close () {
    var priv = PRIVATE.get(this);
    priv.node.parentNode.removeChild(priv.node);
    priv.overlay.parentNode.removeChild(priv.overlay);
}

module.exports = SelectList;