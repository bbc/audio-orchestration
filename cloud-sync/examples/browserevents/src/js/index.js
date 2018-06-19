var $ = require("$");
var msToTimeString = require("Converter").msToTimeString;
var WeakMap = require("weak-map");
var PRIVATE = new WeakMap();

var eventNames = [
    "beforeunload",
    "unload",
    "click"
];

window.addEventListener("load", init);

function init () {    
    setEventListeners(window, eventNames);
    initCountersForEvents(eventNames);
    drawEventCallCount();
    $("#btn-clear-memory").on("click", clearEventMemory);
}

function setEventListeners (object, eventNames) {
    eventNames.forEach(function (eventName) {
        setEventListener(object, eventName);
    });
}

function setEventListener (object, eventName) {    
    $(object).on(eventName, countEventCall);
}

function initCountersForEvents (eventNames) {
    eventNames.forEach(function (eventName) {
        initCounterForEvent(eventName);
    });
}

function initCounterForEvent (eventName) {
    if (localStorage.getItem(eventName) === null) {
        localStorage.setItem(eventName, JSON.stringify(new CountValue()));
    }
}

function countEventCall (event) {
    var count = parseInt(JSON.parse(localStorage.getItem(event.type)).count, 10);
    localStorage.setItem(event.type, JSON.stringify(new CountValue(count+1, Date.now())));
    drawEventCallCount();
}

function clearEventMemory (evt) {
    localStorage.clear();
    initCountersForEvents(eventNames);
    drawEventCallCount();
    evt.stopPropagation();
}

function drawEventCallCount () {
    var i = 0, key, value, table, container;
    table = new Table("Event name", "Call count", "Last called");
    
    for (; i < localStorage.length; i++) {
        key = localStorage.key(i);
        value = JSON.parse(localStorage.getItem(key));
        table.addRow(key, value.count, msToTimeString(value.date) || "never");
    }

    container = $("#results");
    if (container.children.length > 0) {
        container.replaceChild(table.node, container.lastChild);
    } else {
        container.appendChild(table.node);
    }
}

var CountValue = function (cVal, dVal) {
    this.count = cVal || 0;
    this.date = dVal || 0;
}

var Table = function (name1, name2, name3) {
    var priv;

    PRIVATE.set(this, {
        table: null
    });

    this.node = document.createElement("div");
    this.node.className = "pure-u-1";

    priv = PRIVATE.get(this);
    priv.table = document.createElement("table");
    priv.table.className = "pure-table pure-table-bordered";
    priv.table.innerHTML = '' +
        '<thead>' +
            '<tr>' +
                '<th>' + name1 + '</th>' +
                '<th>' + name2 + '</th>' +
                '<th>' + name3 + '</th>' +
            '</tr>' +
        '</thead>';

    priv.table.body = document.createElement("tbody");
    priv.table.appendChild(priv.table.body);
    this.node.appendChild(priv.table);
};

Table.prototype.addRow = function (key, value, date) {
    PRIVATE.get(this).table.body.innerHTML += '' +
        '<tr>' +
            '<td>' + key + '</td>' +
            '<td>' + value + '</td>' +
            '<td>' + date + '</td>' +
        '</tr>';
}