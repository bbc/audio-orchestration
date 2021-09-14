(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["bbcat"] = factory();
	else
		root["bbcat"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/core/_index.js":
/*!****************************!*\
  !*** ./src/core/_index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "EventTarget": () => (/* reexport safe */ _event_target__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "CompoundNode": () => (/* reexport safe */ _compound_node__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   "DocumentParser": () => (/* reexport safe */ _parsers_document_parser__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "Loader": () => (/* reexport safe */ _loaders_loader__WEBPACK_IMPORTED_MODULE_3__["default"]),
/* harmony export */   "AudioLoader": () => (/* reexport safe */ _loaders_audio_loader__WEBPACK_IMPORTED_MODULE_4__["default"])
/* harmony export */ });
/* harmony import */ var _event_target__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./event-target */ "./src/core/event-target.js");
/* harmony import */ var _compound_node__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./compound-node */ "./src/core/compound-node.js");
/* harmony import */ var _parsers_document_parser__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./parsers/document-parser */ "./src/core/parsers/document-parser.js");
/* harmony import */ var _loaders_loader__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./loaders/loader */ "./src/core/loaders/loader.js");
/* harmony import */ var _loaders_audio_loader__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./loaders/audio-loader */ "./src/core/loaders/audio-loader.js");







/***/ }),

/***/ "./src/core/compound-node.js":
/*!***********************************!*\
  !*** ./src/core/compound-node.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ CompoundNode)
/* harmony export */ });
/* harmony import */ var _event_target_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./event-target.js */ "./src/core/event-target.js");
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }


/**
 * A class representing a collection of AudioNodes. The collection is defined
 * similarly to a single node; by a context, and number of channel inputs and
 * outputs.
 * @abstract
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioNode
 * @see https://webaudio.github.io/web-audio-api/#the-audionode-interface
 * @example
 * export default class ToneSourceNode extends CompoundNode {
 *   constructor(context, toneFrequencies) {
 *     super(context);
 *
 *     // Create a gain node that will serve as output.
 *     this._gainNode = context.createGain();
 *     this.outputs.push(this._gainNode);
 *
 *     // For each tone, create an oscillator node set to that tone, connected to
 *     // the output gain node.
 *     this._oscillatorNodes = [];
 *     toneFrequencies.forEach((toneFrequency) => {
 *       const oscillatorNode = context.createOscillator();
 *       oscillatorNode.type = 'sine';
 *       oscillatorNode.frequency.value = toneFrequency;
 *       oscillatorNode.connect(this._gainNode);
 *     });
 *   }
 *
 *   start(when) {
 *     // Start all the oscillators at the given time, when.
 *     this._oscillatorNodes.forEach(oscillator => oscillator.start(when));
 *   }
 *
 *   stop(when) {
 *     // Stop all the oscillators at the given time, when.
 *     this._oscillatorNodes.forEach(oscillator => oscillator.stop(when));
 *   }
 * }
 */

var CompoundNode = /*#__PURE__*/function (_EventTarget) {
  _inherits(CompoundNode, _EventTarget);

  var _super = _createSuper(CompoundNode);

  /**
   * Constructs a new {@link CompoundNode}.
   * @param  {!AudioContext} context
   *         The {@link AudioContext} to associate with the
   *         {@link CompoundNode}.
   */
  function CompoundNode(context) {
    var _this;

    _classCallCheck(this, CompoundNode);

    _this = _super.call(this);
    _this._context = context;
    _this._inputs = [];
    _this._outputs = [];
    return _this;
  }
  /**
   * Returns the associated {@link AudioContext}.
   * @type   {AudioContext}
   *         The associated {@link AudioContext}.
   */


  _createClass(CompoundNode, [{
    key: "context",
    get: function get() {
      return this._context;
    }
    /**
     * Returns the first input feeding the node.
     * @type   {AudioNode}
     *         The first input feeding the node.
     */

  }, {
    key: "input",
    get: function get() {
      return this._inputs[0];
    }
    /**
     * Returns the inputs feeding the node.
     * @type   {Array<AudioNode>}
     *         The inputs feeding the node.
     */

  }, {
    key: "inputs",
    get: function get() {
      return this._inputs;
    }
    /**
     * Returns the first output from the node.
     * @type   {AudioNode}
     *         The first output from the node.
     */

  }, {
    key: "output",
    get: function get() {
      return this._outputs[0];
    }
    /**
     * Returns the outputs from the node.
     * @type   {Array<AudioNode>}
     *         The outputs from the node.
     */

  }, {
    key: "outputs",
    get: function get() {
      return this._outputs;
    }
    /**
     * Connects one output of this node to one input of another node.
     * @param  {!(AudioNode|CompoundNode)} destination
     *         The destination {@link AudioNode} or {@link CompoundNode} to
     *         connect to.
     * @param  {?number} output=0
     *         An index describing the output of the current {@link CompoundNode}
     *         to be connected to the destination.
     * @param  {?number} input=0
     *         An index describing the input of the destination to be connected to
     *         the current {@link CompoundNode}.
     * @return {(AudioNode|CompoundNode)}
     *         A reference to the destination.
     */

  }, {
    key: "connect",
    value: function connect(destination) {
      var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var input = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      if (destination instanceof CompoundNode) {
        this._outputs[output].connect(destination._inputs[input]);
      } else {
        this._outputs[output].connect(destination, 0, input);
      }

      return destination;
    }
    /**
     * Disonnects one output of this node from one input of another node.
     * @param  {AudioNode|CompoundNode} destination
     *         The destination {@link AudioNode} or {@link CompoundNode} to
     *         disconnect from.
     * @param  {?number} output=0
     *         An index describing the output of the current {@link CompoundNode}
     *         to be disconnected from the destination.
     * @param  {?number} input=0
     *         An index describing the input of the destination to be disconnected
     *         from the current {@link CompoundNode}.
     * @return {AudioNode|CompoundNode}
     *         A reference to the destination.
     */

  }, {
    key: "disconnect",
    value: function disconnect(destination) {
      var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      var input = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      if (destination instanceof CompoundNode) {
        this._outputs[output].disconnect(destination._inputs[input]);
      } else {
        this._outputs[output].disconnect(destination, 0, input);
      }
    }
  }]);

  return CompoundNode;
}(_event_target_js__WEBPACK_IMPORTED_MODULE_0__["default"]);



/***/ }),

/***/ "./src/core/event-target.js":
/*!**********************************!*\
  !*** ./src/core/event-target.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ EventTarget)
/* harmony export */ });
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * An implementaton of the Event-Listener pattern that meets the
 * EventTarget interface specified by Mozilla.
 * @abstract
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
 */
var EventTarget = /*#__PURE__*/function () {
  /**
   * Constructs a new {@link EventTarget}.
   */
  function EventTarget() {
    _classCallCheck(this, EventTarget);

    this._listeners = {};
  }
  /**
   * Registers an event listener of a specific event type.
   * @param  {!string} type
   *         A string representing the event type to listen for.
   * @param  {!function(event: Object)} listener
   *         The javascript function/callback that is called when an event of
   *         the specified type occurs.
   */


  _createClass(EventTarget, [{
    key: "addEventListener",
    value: function addEventListener(type, listener) {
      if (this._getListenerIdx(type, listener) === -1) {
        if (!this._listeners[type]) {
          this._listeners[type] = [];
        }

        this._listeners[type].push(listener);
      }
    }
    /**
     * Removes an event listener.
     * @param  {!string} type
     *         A string representing the event type to remove.
     * @param  {!function(event: Object)} listener
     *         The javascript function/callback to remove.
     */

  }, {
    key: "removeEventListener",
    value: function removeEventListener(type, listener) {
      var idx = this._getListenerIdx(type, listener);

      if (idx >= 0) {
        this._listeners[type].splice(idx, 1);
      }
    }
    /**
     * Dispatches an event, invoking the affected listeners.
     * @param  {!Object} event
     *         The event object to be dispatched.
     */

  }, {
    key: "dispatchEvent",
    value: function dispatchEvent(event) {
      var typeListeners = this._listeners[event.type];

      if (typeListeners) {
        for (var i = 0; i < typeListeners.length; i++) {
          typeListeners[i].call(null, event);
        }
      }
    }
    /**
     * @private
     * Gets the index of the type/listener.
     * @param  {!string} type
     *         A string representing the event type.
     * @param  {!function(event: Object)} listener
     *         The javascript function/callback.
     * @return {number} The index of the type/listener.
     */

  }, {
    key: "_getListenerIdx",
    value: function _getListenerIdx(type, listener) {
      var typeListeners = this._listeners[type];

      if (typeListeners) {
        for (var i = 0; i < typeListeners.length; i++) {
          if (typeListeners[i] === listener) {
            return i;
          }
        }
      }

      return -1;
    }
  }]);

  return EventTarget;
}();



/***/ }),

/***/ "./src/core/loaders/audio-loader.js":
/*!******************************************!*\
  !*** ./src/core/loaders/audio-loader.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ AudioLoader)
/* harmony export */ });
/* harmony import */ var _loader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./loader */ "./src/core/loaders/loader.js");
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }


/**
 * A class that provides Promise-based, asynchronous audio loading/decoding.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData
 * @example
 * const context = new AudioContext();
 * const audioLoader = new bbcat.core.AudioLoader(context);
 *
 * audioLoader.load([
 *   'url/to/audio/1.m4a',
 *   'url/to/audio/2.m4a'
 * ]).then((decodedAudioArray) => {
 *   // Use the decoded audio (decodedAudioArray[0], decodedAudioArray[1])
 * }).catch((error) => {
 *   console.log(error);
 * });;
 */

var AudioLoader = /*#__PURE__*/function (_Loader) {
  _inherits(AudioLoader, _Loader);

  var _super = _createSuper(AudioLoader);

  /**
   * Constructs a new {@link AudioLoader}.
   * @param  {!AudioContext} context
   *         The {@link AudioContext} to associate with the
   *         {@link CompoundNode}.
   */
  function AudioLoader(context) {
    var _this;

    _classCallCheck(this, AudioLoader);

    _this = _super.call(this, 'arraybuffer');
    _this._context = context;
    return _this;
  }
  /**
   * Loads and decodes one or more audio files asynchronously.
   * @override
   * @param  {!(string|string[])} urls
   *         A single url or list of urls of audio files to load and decode.
   * @return {Promise}
   *         A Promise that resolves when all audio files have been loaded and
   *         decoded.
   */


  _createClass(AudioLoader, [{
    key: "load",
    value: function load(urls) {
      return _get(_getPrototypeOf(AudioLoader.prototype), "load", this).call(this, urls);
    }
    /**
     * @private
     * Loads and decodes one audio file asynchronously.
     * @param  {!string} url
     *         A single url of an audio file to load and decoded.
     * @return {Promise}
     *         A Promise that resolves when the file has been loaded and decoded.
     */

  }, {
    key: "_loadOne",
    value: function _loadOne(url) {
      var _this2 = this;

      return _get(_getPrototypeOf(AudioLoader.prototype), "_loadOne", this).call(this, url).then(function (data) {
        return _this2._decode(data);
      });
    }
    /**
     * @private
     * Decodes one audio file asynchronously.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/decodeAudioData
     * @param  {!ArrayBuffer} data
     *         An ArrayBuffer containing the audio data to be decoded.
     * @return {Promise}
     *         A Promise that resolves when the audio data has been decoded.
     */

  }, {
    key: "_decode",
    value: function _decode(data) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        // Data must be copied to avoid issue with firefox losing reference.
        _this3._context.decodeAudioData(data.slice(0), resolve, reject);
      });
    }
  }]);

  return AudioLoader;
}(_loader__WEBPACK_IMPORTED_MODULE_0__["default"]);



/***/ }),

/***/ "./src/core/loaders/loader.js":
/*!************************************!*\
  !*** ./src/core/loaders/loader.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Loader)
/* harmony export */ });
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * A class that provides Promise-based, asynchronous file loading.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 * @example
 * const jsonLoader = new bbcat.core.Loader(json);
 *
 * jsonLoader.load([
 *   'url/to/json/1.json',
 *   'url/to/json/2.json'
 * ]).then((jsonArray) {
 *   // Use the json objects (jsonArray[0], jsonArray[1])
 * }).catch(function(error) {
 *   console.log(error);
 * });;
 */
var Loader = /*#__PURE__*/function () {
  /**
   * Constructs a new {@link Loader}.
   * @param  {!string} responseType
   *         The response type the loader should handle. Valid values are
   *         arraybuffer, blob, document, json or text.
   */
  function Loader(responseType) {
    _classCallCheck(this, Loader);

    this._responseType = responseType || 'arraybuffer';
  }
  /**
   * Loads one or more files asynchronously.
   * @param  {!(string|string[])} urls
   *         A single url or list of urls of files to load.
   * @return {Promise}
   *         A Promise that resolves when all files have been loaded.
   */


  _createClass(Loader, [{
    key: "load",
    value: function load(urls) {
      return urls instanceof Array ? this._loadAll(urls) : this._loadOne(urls);
    }
    /**
     * @private
     * Loads one file asynchronously. Promotes overloading in subclasses to add
     * pre- and post-load processing.
     * @param  {!string} url
     *         A single url of file to load.
     * @return {Promise}
     *         A Promise that resolves when the file has been loaded.
     */

  }, {
    key: "_loadOne",
    value: function _loadOne(url) {
      return this._request(url);
    }
    /**
     * @private
     * Loads multiple files asynchronously. Promotes overloading in subclasses to
     * add pre- and post-load processing.
     * @param  {!string[]} urls
     *         A list of urls of files to load.
     * @return {Promise}
     *         A Promise that resolves when all files have been loaded.
     */

  }, {
    key: "_loadAll",
    value: function _loadAll(urls) {
      var _this = this;

      return Promise.all(urls.map(function (url) {
        return _this._loadOne(url);
      }));
    }
    /**
     * @private
     * Loads a single file at the specified URL using the XMLHttpRequest API.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
     * @param  {!string} url
     *         A single url of file to load.
     * @return {Promise}
     *         A Promise that resolves when the file has been loaded.
     */

  }, {
    key: "_request",
    value: function _request(url) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = _this2._responseType;
        request.addEventListener('load', function onLoadEvent() {
          // Any correct response will enter this method including 403
          // (Forbidden), 404 (Not Found) etc. The only responses that
          // indicate true success are 200 (OK) and 304 (Not Modified).
          if (this.status === 200 || this.status === 304) {
            resolve(request.response);
          } else {
            reject(new Error(this.statusText));
          }
        });
        request.addEventListener('error', function () {
          // Transport error has occured.
          reject(new Error('A transport error has occured.'));
        });
        request.send();
      });
    }
  }]);

  return Loader;
}();



/***/ }),

/***/ "./src/core/parsers/document-parser.js":
/*!*********************************************!*\
  !*** ./src/core/parsers/document-parser.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ DocumentParser)
/* harmony export */ });
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * A class to parse documents, returning Javascript objects representing their
 * contents. The structure and content of the returned objects is defined by a
 * set of datamodels and parsers that must be provided.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document
 * @example
 * // When document has the contents:
 * // <ParentTemplate id="0">
 * //   <ChildTemplate text="HelloWorld!"></ChildTemplate>
 * //   <ChildTemplate></ChildTemplate>
 * // </ParentTemplate>
 * //
 * // The result will contain the object:
 * // {
 * //   id: 0,
 * //   childTemplates: [{
 * //     text: 'HelloWorld!',
 * //   }, {
 * //     text: 'Default string.',
 * //   }],
 * // }
 *
 * const models = {
 *   ParentTemplate: {
 *     attributes: [{
 *     name: 'id',
 *       type: 'integer',
 *     }],
 *     nodes: [{
 *       name: 'childTemplates',
 *       node: 'ChildTemplate',
 *       type: 'ChildTemplate',
 *       mapping: 'many',
 *     }],
 *   },
 *   ChildTemplate: {
 *     attributes: [{
 *       name: 'text',
 *       type: 'string',
 *       default: 'Default string.',
 *     }],
 *   },
 * };
 *
 * const parsers = {
 *   integer: (value) => parseInt(value, 10),
 * }
 *
 * const documentParser = new DocumentParser(models, parsers);
 * const result = documentParser.parse(document);
 */
var DocumentParser = /*#__PURE__*/function () {
  /**
   * Constructs a new {@link DocumentParser}.
   * @param  {!Object[]} models
   *         A set of data models that represent nodes within the documents to
   *         be parsed. See {@link DocumentParser} example for model structure.
   * @param  {?Object[]} parsers
   *         A set of parsers that convert strings to a desired type. See
   *         {@link DocumentParser} example for parser structure.
   */
  function DocumentParser(models) {
    var parsers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    _classCallCheck(this, DocumentParser);

    this._models = models;
    this._parsers = parsers;
  }
  /**
   * Parses a document, returning an object representing the document contents.
   * @param  {!Document} document
   *         The document to parse.
   * @return {Object}
   *         The object representing the parsed document contents.
   */


  _createClass(DocumentParser, [{
    key: "parse",
    value: function parse(document) {
      // TODO: Consider adding sanity checks on document etc?
      // Grab the root element and corresponding model, and parse.
      var rootElement = document.childNodes[0];
      var rootModel = this._models[rootElement.nodeName];
      return this._parse(rootElement, rootModel);
    }
    /**
     * Parses the node, by iterating through the nodes DOM tree. The model
     * specifies all attributes and child nodes that should be parsed and the
     * parser that should be used.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
     * @private
     * @param  {!Node} node
     *         The node to parse.
     * @param  {!Object} model
     *         The model to parse the node against.
     * @return {Object}
     *         The object representing the parsed nodes contents.
     */

  }, {
    key: "_parse",
    value: function _parse(node, model) {
      var attrModels = model.attributes || [];
      var nodeModels = model.nodes || [];
      var object = {};

      for (var i = 0; i < attrModels.length; i++) {
        var attrModel = attrModels[i];
        object[attrModel.name] = this._parseAttribute(node, attrModel);
      }

      for (var _i = 0; _i < nodeModels.length; _i++) {
        var nodeModel = nodeModels[_i];
        object[nodeModel.name] = this._parseNode(node, nodeModel);
      }

      return object;
    }
    /**
     * Parses a single attribute on a node. The attrModel specifies the attribute
     * and how it should be parsed.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
     * @private
     * @param  {!Node} node
     *         The node to parse.
     * @param  {!Object} attrModel
     *         The model to parse the attribute against.
     * @return {any}
     *         The parsed attribute.
     */

  }, {
    key: "_parseAttribute",
    value: function _parseAttribute(node, attrModel) {
      // Parses a single attribute on the node as specified by the attrModel. If a
      // parser is found matching the specified type the value is parsed through
      // it. Otherwise; the value is returned.
      var value = node.getAttribute(attrModel.name) || attrModel["default"];
      var parser = this._parsers[attrModel.type];
      return parser ? parser.call(null, value) : value;
    }
    /**
     * Parses all children of the node as specified by the nodeModel.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
     * @private
     * @param  {!Node} node
     *         The node to parse.
     * @param  {!Object} nodeModel
     *         The model to parse the node against.
     * @return {any}
     *         The parsed node.
     */

  }, {
    key: "_parseNode",
    value: function _parseNode(node, nodeModel) {
      var name = nodeModel.node || nodeModel.name;

      var nodes = this._getChildNodes(node, name);

      if (nodes.length === 0) {
        return null;
      }

      return nodeModel.mapping === 'many' ? this._parseNodeMany(nodes, nodeModel) : this._parseNodeOne(nodes[0], nodeModel);
    }
    /**
     * Parses all children of the node as specified by the nodeModel.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
     * @private
     * @param  {!Node} node
     *         The node to parse.
     * @param  {!Object} nodeModel
     *         The model to parse the node against.
     * @return {any[]}
     *         The parsed node.
     */

  }, {
    key: "_parseNodeMany",
    value: function _parseNodeMany(nodes, nodeModel) {
      var childNodes = [];

      for (var i = 0; i < nodes.length; i++) {
        childNodes.push(this._parseNodeOne(nodes[i], nodeModel));
      }

      return childNodes;
    }
    /**
     * Parses a single child of the node as specified by the nodeModel.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
     * @private
     * @param  {!Node} node
     *         The node to parse.
     * @param  {!Object} nodeModel
     *         The model to parse the node against.
     * @return {any}
     *         The parsed node.
     */

  }, {
    key: "_parseNodeOne",
    value: function _parseNodeOne(node, nodeModel) {
      var model = this._models[nodeModel.type];
      return model ? this._parse(node, model) : this._flattenNodeToAttribute(node, nodeModel);
    }
    /**
     * Parses the text content of a node, flattening it to an atrribute.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
     * @private
     * @param  {!Node} node
     *         The node to parse.
     * @param  {!Object} nodeModel
     *         The model to parse the node against.
     * @return {any}
     *         The parsed attribute.
     */

  }, {
    key: "_flattenNodeToAttribute",
    value: function _flattenNodeToAttribute(node, nodeModel) {
      var value = node.textContent || nodeModel["default"];
      var parser = this._parsers[nodeModel.type];
      return parser ? parser.call(null, value) : value;
    }
    /**
     * Gets all child nodes with the name equal to the name provided.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Node
     * @private
     * @param  {!Node} node
     *         The node to parse.
     * @param  {!string} name
     *         The name of the child node(s).
     * @return {Node[]}
     *         Array of nodes with the name equal to the name provided.
     */

  }, {
    key: "_getChildNodes",
    value: function _getChildNodes(node, name) {
      var nodes = [];

      for (var i = 0; i < node.childNodes.length; i++) {
        var childNode = node.childNodes[i];
        var childName = childNode.nodeName;

        if (name.toLowerCase() === childName.toLowerCase()) {
          nodes.push(childNode);
        }
      }

      return nodes;
    }
  }]);

  return DocumentParser;
}();



/***/ }),

/***/ "./src/dash/_index.js":
/*!****************************!*\
  !*** ./src/dash/_index.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ManifestLoader": () => (/* reexport safe */ _manifest_loader_manifest_loader__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   "ManifestParser": () => (/* reexport safe */ _manifest_parser_manifest_parser__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   "DashSourceNode": () => (/* reexport safe */ _dash_source_node_dash_source_node__WEBPACK_IMPORTED_MODULE_2__["default"])
/* harmony export */ });
/* harmony import */ var _manifest_loader_manifest_loader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./manifest-loader/manifest-loader */ "./src/dash/manifest-loader/manifest-loader.js");
/* harmony import */ var _manifest_parser_manifest_parser__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./manifest-parser/manifest-parser */ "./src/dash/manifest-parser/manifest-parser.js");
/* harmony import */ var _dash_source_node_dash_source_node__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./dash-source-node/dash-source-node */ "./src/dash/dash-source-node/dash-source-node.js");





/***/ }),

/***/ "./src/dash/dash-source-node/dash-source-node.js":
/*!*******************************************************!*\
  !*** ./src/dash/dash-source-node/dash-source-node.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ DashSourceNode)
/* harmony export */ });
/* harmony import */ var _core_compound_node__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core/compound-node */ "./src/core/compound-node.js");
/* harmony import */ var _streams_audio_segment_stream__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./streams/audio-segment-stream */ "./src/dash/dash-source-node/streams/audio-segment-stream.js");
/* harmony import */ var _streams_headerless_audio_segment_stream__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./streams/headerless-audio-segment-stream */ "./src/dash/dash-source-node/streams/headerless-audio-segment-stream.js");
/* harmony import */ var _streams_metadata_segment_stream__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./streams/metadata-segment-stream */ "./src/dash/dash-source-node/streams/metadata-segment-stream.js");
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }





/**
 * An AudioNode to perform DASH playback.
 * @see http://mpeg.chiariglione.org/standards/mpeg-dash
 * @extends {CompoundNode}
 * @example
 * const manifestLoader = new bbcat.dash.ManifestLoader();
 * const manifestParser = new bbcat.dash.ManifestParser();
 *
 * manifestLoader.load('url/to/manifest.mpd')
 *   .then((manifestBlob) => {
 *     // Parse the manifest blob to a manifest object.
 *     const manifest = manifestParser.parse(manifestBlob);
 *
 *     // Create the DashSourceNode and connect to context destintion.
 *     const context = new AudioContext();
 *     const dashSourceNode = new bbcat.dash.DashSourceNode(context, manifest);
 *     dashSourceNode.outputs.forEach((output) => {
 *       output.connect(context.destination);
 *     });
 *
 *     // Prime and start playback.
 *     dashSourceNode.prime().then(() => {
 *       dashSourceNode.start();
 *     });
 *   })
 *   .catch((error) => {
 *     console.log(error);
 *   });
 */

var DashSourceNode = /*#__PURE__*/function (_CompoundNode) {
  _inherits(DashSourceNode, _CompoundNode);

  var _super = _createSuper(DashSourceNode);

  /**
   * Constructs a new {@link DashSourceNode}.
   * @param  {!AudioContext} context
   *         The AudioContext that streaming will be synchronised to.
   * @param  {!Object} manifest
   *         A parsed manifest provided by {@link ManifestParser}.
   */
  function DashSourceNode(context, manifest) {
    var _this;

    _classCallCheck(this, DashSourceNode);

    _this = _super.call(this, context); // Initialise a list of the audio streams in addition to a list of all
    // streams, allowing easier iteration of the audio streams only.

    _this._allStreams = [];
    _this._audioStreams = [];
    _this._totalChannels = 0; // Instantiate information describing the playback region.

    _this._presentationDuration = 0;
    _this._playbackInitial = 0;
    _this._playbackOffset = 0;
    _this._playbackDuration = 0;
    _this._playbackLoop = false;
    _this._contextSyncTime = 0;

    _this._initStreams(manifest);

    _this._initAudioGraph();

    _this._state = 'ready';
    return _this;
  }
  /**
   * Buffers a DASH stream for the parameter-defined region.
   * @param  {?number} [initial=0]
   *         The time into the region playback should start from.
   * @param  {?boolean} [loop=true]
   *         True if playback of the region should loop.
   * @param  {?number} [offset=0]
   *         The time into the performance the region starts.
   * @param  {?number} [duration=presentationDuration-offset]
   *         The duration of the region to play.
   * @return {Promise}
   *         A Promise that resolves when the node is ready for playback.
   */


  _createClass(DashSourceNode, [{
    key: "prime",
    value: function prime() {
      var _this2 = this;

      var initial = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var loop = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var duration = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this._presentationDuration - offset;
      // Return a promise that resolves when all streams are primed. Promise is
      // rejected if node cannot currently be primed.
      return new Promise(function (resolve, reject) {
        // Check node state and parse all input paramaters.
        if (_this2.state !== 'ready' && _this2.state !== 'primed') {
          reject('State must be ready or primed before prime() is called.');
          return;
        }

        if (_this2._presentationDuration !== 0 && (initial < 0 || initial >= duration)) {
          reject('Invalid initial. Must be a number less than ' + 'duration and greater than or equal to 0.');
          return;
        }

        if (!(loop === false || loop === true)) {
          reject('Invalid loop. Must be a boolean.');
          return;
        }

        if (_this2._presentationDuration !== 0 && (offset < 0 || offset >= _this2._presentationDuration)) {
          reject('Invalid offset. Must be a number less than ' + 'presentationDuration and greater than or equal to 0.');
          return;
        }

        if (_this2._presentationDuration !== 0 && (duration <= 0 || duration > _this2._presentationDuration - offset)) {
          reject('Invalid duration. Must be a number less than ' + 'presentationDuration minus offset and greater than 0.');
          return;
        } // Store information describing the playback region.


        _this2._playbackInitial = initial;
        _this2._playbackOffset = offset;
        _this2._playbackDuration = duration;
        _this2._playbackLoop = loop;
        _this2._state = 'priming'; // Prime all streams with the same offset, duration and loop parameters.

        var primeStreamsPromises = _this2._allStreams.map(function (stream) {
          return stream.prime(initial, loop, offset, duration);
        });

        Promise.all(primeStreamsPromises).then(function () {
          _this2._state = 'primed';
          resolve();
        });
      });
    }
    /**
     * Starts playback of the buffered region, synchronised with AudioContext.
     * @param  {?number} [contextSyncTime=context.currentTime]
     *         The context time to synchronise with.
     */

  }, {
    key: "start",
    value: function start() {
      var _this3 = this;

      var contextSyncTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.context.currentTime;

      if (this.state !== 'primed') {
        return;
      } // Start all streams.


      this._contextSyncTime = contextSyncTime;

      var startStreamsPromises = this._allStreams.map(function (stream) {
        return new Promise(function (ended) {
          return stream.start(_this3._contextSyncTime, ended);
        });
      }); // Resolve when all streams have completed.


      this._state = 'playing';
      Promise.all(startStreamsPromises).then(function () {
        // Streams playback has been reached.
        _this3._dispatchEndedEvent();

        _this3._state = 'ready';
      });
    }
    /**
     * Stops streaming and playback.
     */

  }, {
    key: "stop",
    value: function stop() {
      if (this.state !== 'playing') {
        return;
      }

      this._allStreams.forEach(function (stream) {
        return stream.stop();
      });

      this._state = 'ready';
    }
    /**
    * Seek playback by a provided offset value.
    * @param  {?number} [seconds]
    *         Time in seconds to seek by note this is relative to the current playback position and
    *         can be +/ve or -/ve
    */

  }, {
    key: "seek",
    value: function seek(seekTime) {
      var _this4 = this;

      var seekStart = this.context.currentTime;
      var seekEnd = seekStart + seekTime;
      this.stop();
      this.prime(seekEnd).then(function () {
        _this4.start();
      });
    }
    /**
     * Get the current performance time in seconds.
     * @type {number}
     *       The current performance time in seconds.
     */

  }, {
    key: "playbackTime",
    get: function get() {
      return this.state === 'playing' ? (this.context.currentTime - this._contextSyncTime + this._playbackInitial) % this._playbackDuration + this._playbackOffset : 0;
    }
    /**
     * Get the total performance duration in seconds.
     * @type {number}
     *       The total performance duration time in seconds.
     */

  }, {
    key: "presentationDuration",
    get: function get() {
      return this._presentationDuration;
    }
    /**
     * Gets the current state.
     * @type {string}
     *       The current state.
     */

  }, {
    key: "state",
    get: function get() {
      return this._playbackState;
    }
    /**
     * Sets the current state and emits a statechange event.
     * @type {string}
     *       The state.
     */

  }, {
    key: "_state",
    set: function set(state) {
      // Sets the state and emits an event describing the state change.
      this._playbackState = state;

      this._dispatchStateChangeEvent(state);
    }
    /**
     * Digests the manifest into a set of streams.
     * @param  {!Object} manifest
     *         The DASH Manifest.
     */

  }, {
    key: "_initStreams",
    value: function _initStreams(manifest) {
      var _this5 = this;

      // Digests the manifest into a set of streams. Each stream manages a buffer
      // for downloaded segments and synchronises scheduling (and playback in the
      // case of audio) to the AudioContext.
      this._presentationDuration = manifest.mediaPresentationDuration || 0;
      var bufferTime = manifest.minBufferTime;
      var baseURL = manifest.baseURL ? manifest.baseURL[0] : '';
      manifest.periods.forEach(function (period) {
        period.adaptationSets.forEach(function (adaptationSet) {
          var template = adaptationSet.segmentTemplate;
          var representation = adaptationSet.representations ? adaptationSet.representations[0] : null;
          var representationURL = representation ? representation.baseURL : '';
          var definition = {
            periodId: period.id,
            adaptationSetId: adaptationSet.id,
            representationId: representation ? representation.id : null,
            type: adaptationSet.mimeType,
            start: period.start + template.presentationTimeOffset / template.timescale,
            // duration: period.duration,
            duration: period.duration,
            segmentStart: template.startNumber,
            segmentDuration: template.duration / template.timescale,
            templateUrl: (baseURL || representationURL || '') + (adaptationSet.baseURL || '') + (template.media || ''),
            initUrl: (baseURL || representationURL || '') + (adaptationSet.baseURL || '') + (template.initialization || ''),
            bufferTime: bufferTime
          };

          if (adaptationSet.mimeType.indexOf('json') > -1) {
            // If type is JSON then create a metadata stream.
            var stream = new _streams_metadata_segment_stream__WEBPACK_IMPORTED_MODULE_3__["default"](_this5.context, definition);
            stream.metadataCallback = _this5._dispatchMetadataEvent.bind(_this5);

            _this5._allStreams.push(stream);
          } else if (adaptationSet.mimeType.indexOf('audio') > -1) {
            // Add channel count to the definition for audio streams.
            definition.channelCount = adaptationSet.value === 0 || adaptationSet.value ? adaptationSet.value : adaptationSet.audioChannelConfiguration.value; // If type is audio then create an audio stream. If there is an
            // initialization chunk then create a headerless stream.

            var _stream = template.initialization ? new _streams_headerless_audio_segment_stream__WEBPACK_IMPORTED_MODULE_2__["default"](_this5.context, definition) : new _streams_audio_segment_stream__WEBPACK_IMPORTED_MODULE_1__["default"](_this5.context, definition);

            _this5._audioStreams.push(_stream);

            _this5._allStreams.push(_stream); // Tally up the total number of channels across all audio streams.


            _this5._totalChannels += _stream.channelCount;
          }
        });
      });
    }
    /**
     * Initialises the required AudioNodes.
     */

  }, {
    key: "_initAudioGraph",
    value: function _initAudioGraph() {
      var _this6 = this;

      // The DashSourceNode is single-channel, muliple-output. Create and connect
      // a gain node for each channel in each audio stream.
      var input = 0;

      this._audioStreams.forEach(function (stream) {
        for (var output = 0; output < stream.output.numberOfOutputs; output++) {
          var gain = _this6.context.createGain();

          stream.output.connect(gain, output);
          _this6._outputs[input] = gain;
          input++;
        }
      });
    }
    /**
     * Dispatches an event of type metadata.
     * @emits {metadata}
     * @param  {!Object} metadata
     *         The segment containing metadata.
     */

  }, {
    key: "_dispatchMetadataEvent",
    value: function _dispatchMetadataEvent(segment) {
      this.dispatchEvent({
        src: this,
        type: 'metadata',
        n: segment.n,
        metadata: segment.metadata,
        when: segment.when,
        offset: segment.offset,
        duration: segment.duration
      });
    }
    /**
     * Dispatches an event of type statechange.
     * @emits {statechange}
     * @param  {!Object} state
     *         The new state.
     */

  }, {
    key: "_dispatchStateChangeEvent",
    value: function _dispatchStateChangeEvent(state) {
      this.dispatchEvent({
        src: this,
        type: 'statechange',
        state: state
      });
    }
    /**
     * Dispatches an event of type ended.
     * @emits {ended}
     */

  }, {
    key: "_dispatchEndedEvent",
    value: function _dispatchEndedEvent() {
      this.dispatchEvent({
        src: this,
        type: 'ended'
      });
    }
  }]);

  return DashSourceNode;
}(_core_compound_node__WEBPACK_IMPORTED_MODULE_0__["default"]);



/***/ }),

/***/ "./src/dash/dash-source-node/streams/audio-segment-stream.js":
/*!*******************************************************************!*\
  !*** ./src/dash/dash-source-node/streams/audio-segment-stream.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ AudioSegmentStream)
/* harmony export */ });
/* harmony import */ var _core_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../core/_index */ "./src/core/_index.js");
/* harmony import */ var _segment_stream__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./segment-stream */ "./src/dash/dash-source-node/streams/segment-stream.js");
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }



/**
 * A class to manage a single stream of audio segments, synchronised to an
 * audio context.
 * @ignore
 */

var AudioSegmentStream = /*#__PURE__*/function (_SegmentStream) {
  _inherits(AudioSegmentStream, _SegmentStream);

  var _super = _createSuper(AudioSegmentStream);

  /**
   * Constructs a new {@link AudioSegmentStream}.
   * @param  {!AudioContext} context
   *         The AudioContext that streaming will be synchronised to.
   * @param  {!Object} definition
   *         An object that defines the stream parameters.
   */
  function AudioSegmentStream(context, definition) {
    var _this;

    _classCallCheck(this, AudioSegmentStream);

    _this = _super.call(this, context, new _core_index__WEBPACK_IMPORTED_MODULE_0__.AudioLoader(context), definition); // The primer offset is required because AudioContext.decodeAudioData cannot
    // currently decode audio segments without fully formed headers. This will
    // not be required in a future Web Audio API update.
    // this._primerOffset = 2048 / this._context.sampleRate;
    // HACK - to be resolved defaulting sample rate to 48000 to calculate the
    // primer offset, needs to be resolved.

    _this._primerOffset = 0; // 2048 / 48000;

    _this._isStreaming = false;
    _this._stream.channelCount = definition.channelCount;
    _this._output = _this._context.createChannelSplitter(_this.channelCount);
    return _this;
  }
  /**
   * Gets the ouput AudioNode.
   * @return {AudioNode}
   *         The ouput AudioNode.
   */


  _createClass(AudioSegmentStream, [{
    key: "output",
    get: function get() {
      return this._output;
    }
    /**
     * Returns the number of channels in the stream.
     * @return {Number}
     *         The number of channels in the stream.
     */

  }, {
    key: "channelCount",
    get: function get() {
      return this._stream.channelCount;
    }
    /**
     * Schedules all audio in the buffer for playback and starts streaming of the
     * audio region defined by prime.
     */

  }, {
    key: "_start",
    value: function _start() {
      var _this2 = this;

      // Set as streaming and schedule all audio in the buffer.
      this._isStreaming = true;

      this._buffer.segments.forEach(function (segment) {
        _this2._startSegment(segment);
      });

      _get(_getPrototypeOf(AudioSegmentStream.prototype), "_start", this).call(this);
    }
    /**
     * Stops all audio in the buffer and starts streaming of the audio region
     * defined by prime.
     */

  }, {
    key: "_stop",
    value: function _stop() {
      // Set as no longer streaming then stop all audio in the buffer.
      this._isStreaming = false;

      this._buffer.segments.forEach(function (segment) {
        if (segment && segment.bufferSource) {
          segment.bufferSource.stop();
        }
      });

      _get(_getPrototypeOf(AudioSegmentStream.prototype), "_stop", this).call(this);
    }
    /**
     * Schedules a segment for playback.
     * @param  {!Object} segment
     *         The segment to schedule.
     */

  }, {
    key: "_startSegment",
    value: function _startSegment(segment) {
      if (segment && segment.bufferSource) {
        // Adjust the parameters when, offset and duration for the context time.
        var when = segment.when + this._contextSyncTime;
        var offset = segment.offset + this._primerOffset;
        var duration = segment.duration; // Calculate any lateness in playback.

        var playOffset = this._context.currentTime - when; // If the segment is entirely too late for playback, play for a duration
        // of 0 as all segments in the buffer must be played in order to avoid
        // calling stop on a segment that has not yet been played. Currently there
        // is no way to detect if a segment has been played already. If the
        // segment is only slightly late then play as much as possible. Otherwise;
        // play the entire segment.

        if (playOffset < segment.duration) {
          segment.bufferSource.start(playOffset > 0 ? 0 : when, playOffset > 0 ? offset + playOffset : offset, playOffset > 0 ? duration - playOffset : duration);
        } else {
          segment.bufferSource.start(0, 0, 0);
        }
      }
    }
    /**
     * Constructs a BufferSourceNode from the audio data and adds to a segment
     * in the stream buffer. If the stream is currently streaming then the segment
     * is scheduled for playback on the AudioContext.
     * @param  {!Object} data
     *         The data to add to the segment.
     * @param  {!number} n
     *         The number of the segment in the playback sequence.
     * @return {Object}
     *         The complete segment.
     */

  }, {
    key: "_addDataToSegment",
    value: function _addDataToSegment(data, n) {
      var segment = null;
      var isFound = false;
      var i = 0;

      while (!isFound && i < this._buffer.segments.length) {
        if (this._buffer.segments[i].n === n) {
          segment = this._buffer.segments[i]; // Use the raw audio data to instantiate a bufferSourceNode, and connect
          // to the streams output.

          segment.bufferSource = this._context.createBufferSource();
          segment.bufferSource.buffer = data;
          segment.bufferSource.connect(this._output); // If the stream is currently playing then schedule for playback.

          if (this._isStreaming) {
            this._startSegment(segment);
          }

          isFound = true;
        }

        i++;
      }

      return segment;
    }
  }]);

  return AudioSegmentStream;
}(_segment_stream__WEBPACK_IMPORTED_MODULE_1__["default"]);



/***/ }),

/***/ "./src/dash/dash-source-node/streams/headerless-audio-segment-stream.js":
/*!******************************************************************************!*\
  !*** ./src/dash/dash-source-node/streams/headerless-audio-segment-stream.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ HeaderlessAudioSegmentStream)
/* harmony export */ });
/* harmony import */ var _core_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../core/_index */ "./src/core/_index.js");
/* harmony import */ var _segment_stream__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./segment-stream */ "./src/dash/dash-source-node/streams/segment-stream.js");
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }



/**
 * A class to manage a single stream of headerless audio segments, synchronised
 * to an audio context.
 * @ignore
 */

var HeaderlessAudioSegmentStream = /*#__PURE__*/function (_SegmentStream) {
  _inherits(HeaderlessAudioSegmentStream, _SegmentStream);

  var _super = _createSuper(HeaderlessAudioSegmentStream);

  /**
   * Constructs a new {@link HeaderlessAudioSegmentStream}.
   * @param  {!AudioContext} context
   *         The AudioContext that streaming will be synchronised to.
   * @param  {!Object} definition
   *         An object that defines the stream parameters.
   */
  function HeaderlessAudioSegmentStream(context, definition) {
    var _this;

    _classCallCheck(this, HeaderlessAudioSegmentStream);

    _this = _super.call(this, context, new _core_index__WEBPACK_IMPORTED_MODULE_0__.Loader('arraybuffer'), definition);
    _this._isStreaming = false;
    _this._stream.channelCount = definition.channelCount;
    _this._output = _this._context.createChannelSplitter(_this.channelCount);
    return _this;
  }
  /**
   * Gets the ouput AudioNode.
   * @return {AudioNode}
   *         The ouput AudioNode.
   */


  _createClass(HeaderlessAudioSegmentStream, [{
    key: "output",
    get: function get() {
      return this._output;
    }
    /**
     * Returns the number of channels in the stream.
     * @return {Number}
     *         The number of channels in the stream.
     */

  }, {
    key: "channelCount",
    get: function get() {
      return this._stream.channelCount;
    }
    /**
     * Schedules all audio in the buffer for playback and starts streaming of the
     * audio region defined by prime.
     */

  }, {
    key: "_start",
    value: function _start() {
      var _this2 = this;

      // Set as streaming and schedule all audio in the buffer.
      this._isStreaming = true;

      this._buffer.segments.forEach(function (segment) {
        _this2._startSegment(segment);
      });

      _get(_getPrototypeOf(HeaderlessAudioSegmentStream.prototype), "_start", this).call(this);
    }
    /**
     * Stops all audio in the buffer and starts streaming of the audio region
     * defined by prime.
     */

  }, {
    key: "_stop",
    value: function _stop() {
      // Set as no longer streaming then stop all audio in the buffer.
      this._isStreaming = false;

      this._buffer.segments.forEach(function (segment) {
        if (segment && segment.bufferSource) {
          segment.bufferSource.stop();
        }
      });

      _get(_getPrototypeOf(HeaderlessAudioSegmentStream.prototype), "_stop", this).call(this);
    }
    /**
     * Schedules a single segment for playback.
     * @param  {!Object} segment
     *         The segment to schedule.
     */

  }, {
    key: "_startSegment",
    value: function _startSegment(segment) {
      if (segment && segment.bufferSource) {
        // Adjust the parameters when, offset and duration for the context time.
        var when = segment.when + this._contextSyncTime;
        var offset = segment.offset + (segment.number === this._stream.segmentStart ? 0 : segment.bufferSource.buffer.duration / 2);
        var duration = segment.duration; // Calculate any lateness in playback.

        var playOffset = this._context.currentTime - when; // If the segment is entirely too late for playback, play for a duration
        // of 0 as all segments in the buffer must be played in order to avoid
        // calling stop on a segment that has not yet been played. Currently there
        // is no way to detect if a segment has been played already. If the
        // segment is only slightly late then play as much as possible. Otherwise;
        // play the entire segment.

        if (playOffset < segment.duration) {
          var osWhen = playOffset > 0 ? 0 : when;
          var osOffset = playOffset > 0 ? offset + playOffset : offset;
          var osDuration = playOffset > 0 ? duration - playOffset : duration;
          segment.bufferSource.start(osWhen, osOffset, osDuration);
        } else {
          segment.bufferSource.start(0, 0, 0);
        }
      }
    }
    /*
     * Merges all passed buffers into a single buffer.
     */

  }, {
    key: "_mergeBuffers",
    value: function _mergeBuffers() {
      for (var _len = arguments.length, buffers = new Array(_len), _key = 0; _key < _len; _key++) {
        buffers[_key] = arguments[_key];
      }

      var mergedLength = buffers.reduce(function (length, buffer) {
        return length + buffer.byteLength;
      }, 0);
      var mergedArray = new Uint8Array(mergedLength);
      var currentOffset = 0;
      buffers.forEach(function (buffer) {
        mergedArray.set(new Uint8Array(buffer), currentOffset);
        currentOffset += buffer.byteLength;
      });
      return mergedArray.buffer;
    }
    /**
     * Decodes the segment data and constructs a BufferSourceNode. If the stream
     * is currently streaming then the segment is scheduled for playback on the
     * AudioContext. Streaming audio requires the previous segment in order to
     * decode the current.
     * @param  {!Object} prevSegment
     *         The segment that should be used to decode segment.
     * @param  {!Object} segment
     *         The segment that should be decoded using prevSegment segment.
     */

  }, {
    key: "_mergeBuffersToSegment",
    value: function _mergeBuffersToSegment(prevSegment, segment) {
      var _this3 = this;

      /* eslint-disable no-param-reassign */
      if ((prevSegment && prevSegment.data || segment.n === 0) && segment && segment.data && !segment.isDecoded) {
        segment.isDecoded = true;
        var arrayBuffer = null;

        if (segment.number === this._stream.segmentStart) {
          arrayBuffer = this._mergeBuffers(this._buffer.init, segment.data);
        } else if (segment.n === 0) {
          arrayBuffer = this._mergeBuffers(this._buffer.init, this._buffer.decode, segment.data);
        } else {
          arrayBuffer = this._mergeBuffers(this._buffer.init, prevSegment.data, segment.data);
        }

        this._context.decodeAudioData(arrayBuffer, function (decodedAudio) {
          segment.bufferSource = _this3._context.createBufferSource();
          segment.bufferSource.buffer = decodedAudio;
          segment.bufferSource.connect(_this3._output);

          if (_this3._isStreaming) {
            _this3._startSegment(segment);
          }
        }, function (error) {
          // eslint-disable-next-line no-console
          console.log('Could not decode audio data:', error);
        });
      }
      /* eslint-enable no-param-reassign */

    }
    /**
     * Constructs a BufferSourceNode from the audio data and adds to a segment
     * in the stream buffer. If the stream is currently streaming then the segment
     * is scheduled for playback on the AudioContext.
     * @param  {!Object} data
     *         The data to add to the segment.
     * @param  {!number} n
     *         The number of the segment in the playback sequence.
     * @return {Object}
     *         The complete segment.
     */

  }, {
    key: "_addDataToSegment",
    value: function _addDataToSegment(data, n) {
      var segment = this._buffer.segments.find(function (s) {
        return s.n === n;
      });

      if (segment) {
        // segment.data = this._removeTimestamps(data);
        segment.data = data;

        var prevSegment = this._buffer.segments.find(function (s) {
          return s.n === n - 1;
        });

        var nextSegment = this._buffer.segments.find(function (s) {
          return s.n === n + 1;
        });

        this._mergeBuffersToSegment(prevSegment, segment);

        this._mergeBuffersToSegment(segment, nextSegment);
      }

      return segment;
    }
    /**
     * Overwrites the timestamp data in a raw aac dash segment. This prevents chrome crashine.
     * @param  {!Object} data
     *         The data to modify.
     * @return {Object}
     *         The modified data
     */

  }, {
    key: "_removeTimestamps",
    value: function _removeTimestamps(data) {
      var moddata = new Uint8Array(data);
      moddata[60] = 66;
      moddata[61] = 72;
      moddata[62] = 75;
      moddata[63] = 75;
      return moddata;
    }
    /**
     * Primes the buffer with the initialisation segment, and fills the segment
     * buffer with segment templates and downloads corresponding segments.
     * @return {Promise}
     *         A Promise that resolves when buffer is primed.
     */

  }, {
    key: "_primeBuffer",
    value: function _primeBuffer() {
      var _this4 = this;

      return this._loader.load(this._stream.initUrl).then(function (data) {
        _this4._buffer.init = data;
      }).then(function () {
        var decodeSegment = _this4._getTemplateForNthSegment(-1);

        return decodeSegment.number >= _this4._stream.segmentStart ? _this4._loader.load(decodeSegment.url) : null;
      }).then(function (data) {
        // this._buffer.decode = this._removeTimestamps(data);
        _this4._buffer.decode = data;
      }).then(function () {
        var promises = [];

        var _loop = function _loop(i) {
          var segment = _this4._getTemplateForNthSegment(i);

          _this4._buffer.segments.push(segment); // Only load segments that lay within the streams segment bounds.


          if (segment.number >= _this4._stream.segmentStart && (!_this4._stream.segmentEnd || segment.number <= _this4._stream.segmentEnd)) {
            promises.push(_this4._loader.load(segment.url).then(function (data) {
              _this4._addDataToSegment(data, segment.n);
            }));
          }
        };

        for (var i = 0; i < _this4._buffer.size; i++) {
          _loop(i);
        }

        return Promise.all(promises);
      });
    }
  }]);

  return HeaderlessAudioSegmentStream;
}(_segment_stream__WEBPACK_IMPORTED_MODULE_1__["default"]);



/***/ }),

/***/ "./src/dash/dash-source-node/streams/metadata-segment-stream.js":
/*!**********************************************************************!*\
  !*** ./src/dash/dash-source-node/streams/metadata-segment-stream.js ***!
  \**********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MetadataSegmentStream)
/* harmony export */ });
/* harmony import */ var _core_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../core/_index */ "./src/core/_index.js");
/* harmony import */ var _segment_stream__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./segment-stream */ "./src/dash/dash-source-node/streams/segment-stream.js");
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }



/**
 * A class to manage a single stream of metadata segments, synchronised to an
 * audio context.
 * @ignore
 * @private
 */

var MetadataSegmentStream = /*#__PURE__*/function (_SegmentStream) {
  _inherits(MetadataSegmentStream, _SegmentStream);

  var _super = _createSuper(MetadataSegmentStream);

  /**
   * Constructs a new {@link MetadataSegmentStream}.
   * @param  {!AudioContext} context
   *         The AudioContext that streaming will be synchronised to.
   * @param  {!Object} definition
   *         An object that defines the stream parameters.
   */
  function MetadataSegmentStream(context, definition) {
    var _this;

    _classCallCheck(this, MetadataSegmentStream);

    _this = _super.call(this, context, new _core_index__WEBPACK_IMPORTED_MODULE_0__.Loader('json'), definition);

    _this._metadataCallback = function () {};

    return _this;
  }
  /**
   * Gets the metadata callback function.
   * @return {function(segment: !Object)}
   *         The metadata callback function.
   */


  _createClass(MetadataSegmentStream, [{
    key: "metadataCallback",
    get: function get() {
      return this._metadataCallback;
    }
    /**
     * Sets the metadata callback function.
     * @param  {function(segment: !Object)} callback
     *         The metadata callback function.
     */
    ,
    set: function set(callback) {
      if (!callback || !(callback instanceof Function)) {
        throw new Error('Invalid parameter callback. Must be of type Function.');
      }

      this._metadataCallback = callback;
    }
    /**
     * Adds a data payload to a segment in the stream buffer and calls the
     * metadata callback, passing the segment with metadata attached.
     * @param  {!Object} data
     *         The data to add to the segment.
     * @param  {!number} n
     *         The number of the segment in the playback sequence.
     * @return {Object}
     *         The complete segment.
     */

  }, {
    key: "_addDataToSegment",
    value: function _addDataToSegment(data, n) {
      var _this2 = this;

      var segment = null;
      var isFound = false;
      var i = 0;

      while (!isFound && i < this._buffer.segments.length) {
        if (this._buffer.segments[i].n === n) {
          (function () {
            segment = _this2._buffer.segments[i]; // The bounds in nanoseconds that metadata must fall within.

            var metadataStart = 1e9 * _this2._stream.segmentDuration * (segment.number - _this2._stream.segmentStart);
            var metadataEnd = metadataStart + 1e9 * (segment.offset + segment.duration); // Offset in nanoseconds to convert metadata to context time.

            var metadataOffset = -metadataStart + 1e9 * (segment.when - segment.offset); // Filter metadata to be within bounds and apply context offset.

            segment.metadata = data.filter(function (datum) {
              return datum.timens >= metadataStart && datum.timens < metadataEnd;
            }).map(function (datum) {
              var newMetadata = Object.assign({}, datum);
              newMetadata.timens += metadataOffset;
              return newMetadata;
            });

            _this2._metadataCallback(segment);

            isFound = true;
          })();
        }

        i++;
      }

      return segment;
    }
  }]);

  return MetadataSegmentStream;
}(_segment_stream__WEBPACK_IMPORTED_MODULE_1__["default"]);



/***/ }),

/***/ "./src/dash/dash-source-node/streams/segment-stream.js":
/*!*************************************************************!*\
  !*** ./src/dash/dash-source-node/streams/segment-stream.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ SegmentStream)
/* harmony export */ });
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * A class to manage a single stream of segments, synchronised to an audio
 * context.
 * @ignore
 * @private
 * @abstract
 */
var SegmentStream = /*#__PURE__*/function () {
  /**
   * Constructs a new {@link SegmentStream}.
   * @param  {!AudioContext} context
   *         The AudioContext that streaming will be synchronised to.
   * @param  {!Loader} loader
   *         The loader that will be used to download segment data.
   * @param  {!Object} definition
   *         An object that defines the stream parameters.
   */
  function SegmentStream(context, loader, definition) {
    _classCallCheck(this, SegmentStream);

    this._context = context;
    this._contextSyncTime = 0;
    this._loader = loader;
    this._minBufferSize = 3; // Clone required information form the provided definition.

    this._stream = {};
    this._stream.periodId = definition.periodId;
    this._stream.adaptationSetId = definition.adaptationSetId;
    this._stream.representationId = definition.representationId;
    this._stream.start = definition.start;
    this._stream.duration = definition.duration;
    this._stream.segmentDuration = definition.segmentDuration;
    this._stream.segmentStart = definition.segmentStart;
    this._stream.segmentEnd = definition.segmentStart - 1 + Math.ceil(definition.duration / definition.segmentDuration);
    this._stream.initUrl = definition.initUrl || '';
    this._stream.initUrl = this._stream.initUrl.replace('$RepresentationID$', this._stream.representationId);
    this._stream.templateUrl = definition.templateUrl;
    this._stream.templateUrl = this._stream.templateUrl.replace('$RepresentationID$', this._stream.representationId);

    var templateRegxRes = this._stream.templateUrl.match(/(\$[Nn]umber%*([0-9]*)d*\$)/);

    if (templateRegxRes) {
      this._stream.templateUrl = this._stream.templateUrl.replace(templateRegxRes[1], '$Number');
      this._stream.templateUrlLeadingZeros = templateRegxRes[2] ? parseInt(templateRegxRes[2], 10) : 0;
    } // Instantiate a circular buffer for segments .


    this._buffer = {};
    this._buffer.segments = [];
    this._buffer.frontIndex = 0;
    this._buffer.size = Math.max(Math.ceil(definition.bufferTime / definition.segmentDuration), this._minBufferSize); // Instantiate information describing the playback region.

    this._play = {};
    this._play.initial = 0;
    this._play.offset = 0;
    this._play.duration = 0;
    this._play.loop = false;
    this._play.endedCallback = null;
  }
  /**
   * Primes the stream to play the region defined by the parameters.
   * @param  {?number} [initial=0]
   *         The time into the region playback should start from.
   * @param  {?boolean} [loop=false]
   *         True if playback of the region should loop.
   * @param  {?number} [offset=0]
   *         The time into the performance the region starts.
   * @param  {?number} [duration=definition.duration-offset]
   *         The duration of the region to play.
   * @return {Promise}
   *         A Promise that resolves when the stream is primed.
   */


  _createClass(SegmentStream, [{
    key: "prime",
    value: function prime() {
      var initial = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var loop = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var duration = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : this._stream.duration - offset;

      this._primePlayRegion(initial, loop, offset, duration);

      return this._primeBuffer();
    }
    /**
     * Primes playback paramters that define the play region. Caclulations
     * that are buffered for use in scheduling later during priming/playback.
     * @param  {?number} [initial=0]
     *         The time into the region playback should start from.
     * @param  {?boolean} [loop=false]
     *         True if playback of the region should loop.
     * @param  {?number} [offset=0]
     *         The time into the performance the region starts.
     * @param  {?number} [duration=definition.duration-offset]
     *         The duration of the region to play.
     */

  }, {
    key: "_primePlayRegion",
    value: function _primePlayRegion(initial, loop, offset, duration) {
      // Store information describing the playback region.
      this._play.initial = initial;
      this._play.loop = loop;
      this._play.offset = offset;
      this._play.duration = duration; // Clear the buffer to an initial empty state.

      this._buffer.segments = [];
      this._buffer.frontIndex = 0; // Precalculate useful segment numbers and overlap so that there is no need
      // to repeat calculations in the worker threads that maintain the buffer.
      // TODO: Should this._stream.start be added rather than subtracted?

      var startOffset = this._play.offset - this._stream.start;
      var initialOffset = startOffset + this._play.initial;
      var endOffset = startOffset + this._play.duration;
      this._play.startOverlap = (this._stream.segmentDuration - Math.abs(startOffset) % this._stream.segmentDuration) % this._stream.segmentDuration;
      this._play.initialOverlap = Math.abs(initialOffset) % this._stream.segmentDuration;
      this._play.endOverlap = Math.abs(endOffset) % this._stream.segmentDuration;
      this._play.startSegment = this._stream.segmentStart + Math.floor(startOffset / this._stream.segmentDuration);
      this._play.initialSegment = this._stream.segmentStart + Math.floor(initialOffset / this._stream.segmentDuration);
      this._play.endSegment = this._stream.segmentStart - 1 + Math.ceil(endOffset / this._stream.segmentDuration);
      this._play.segmentsPerLoop = 1 + this._play.endSegment - this._play.startSegment;
    }
    /**
     * Primes the buffer with segment templates and downloads corresponding segments.
     * @return {Promise}
     *         A Promise that resolves when buffer is primed.
     */

  }, {
    key: "_primeBuffer",
    value: function _primeBuffer() {
      var _this = this;

      var promises = [];

      var _loop = function _loop(i) {
        var segment = _this._getTemplateForNthSegment(i);

        _this._buffer.segments.push(segment); // Only load segments that lay within the streams segment bounds.


        if (segment.number >= _this._stream.segmentStart && (!_this._stream.segmentEnd || segment.number <= _this._stream.segmentEnd)) {
          promises.push(_this._loader.load(segment.url).then(function (data) {
            _this._addDataToSegment(data, segment.n);
          }));
        }
      };

      for (var i = 0; i < this._buffer.size; i++) {
        _loop(i);
      }

      return Promise.all(promises);
    }
    /**
     * Starts streaming of the region defined by prime.
     * @param  {?number} [contextSyncTime=0]
     *         The context time to which the stream start should be synchronised.
     * @param  {?function()} [endedCallback=null]
     *         A function that is called when stream playback has naturally ended.
     */

  }, {
    key: "start",
    value: function start() {
      var contextSyncTime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var endedCallback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};
      this._contextSyncTime = contextSyncTime;
      this._play.endedCallback = endedCallback;

      this._start();
    }
    /**
     * Stops streaming of the region defined by prime.
     */

  }, {
    key: "stop",
    value: function stop() {
      this._stop();
    }
    /**
     * Checks if a new segment can be downloaded. If so; attempts to download it.
     */

  }, {
    key: "_manageBuffer",
    value: function _manageBuffer() {
      var _this2 = this;

      // Get the front segment and check to see if it has finished playing.
      var currentSegment = this._buffer.segments[this._buffer.frontIndex];
      var currentSegmentEnd = currentSegment.when + currentSegment.duration;

      var currentTime = this._getCurrentSyncTime();

      if (currentTime >= currentSegmentEnd) {
        if (!this._play.loop && this._play.duration && currentSegment.number >= this._play.endSegment) {
          // Playback has naturally ended.
          this._end();
        } else {
          // Playback must continue. Build the next required segment, add to
          // the buffer, and advance the buffer front.
          var newSegmentNumber = currentSegment.n + this._buffer.size;

          var newSegment = this._getTemplateForNthSegment(newSegmentNumber);

          this._buffer.segments[this._buffer.frontIndex] = newSegment;
          this._buffer.frontIndex++;
          this._buffer.frontIndex = this._buffer.frontIndex % this._buffer.size;

          if (newSegment.number >= this._stream.segmentStart && (!this._stream.segmentEnd || newSegment.number <= this._stream.segmentEnd)) {
            this._loader.load(newSegment.url).then(function (data) {
              _this2._addDataToSegment(data, newSegment.n);
            });
          }
        }
      }
    }
    /**
     * Returns the number of seconds past since the sync point.
     * @return {number}
     *         The number of seconds past since the sync point.
     */

  }, {
    key: "_getCurrentSyncTime",
    value: function _getCurrentSyncTime() {
      return this._context.currentTime - this._contextSyncTime;
    }
    /**
     * Returns a template for a segment. The template constitutes the number in
     * the playback sequence, the segment sequence number, tand he period covered
     * by the segment relative to playback start (defined as segment start time,
     * duration and offset.)
     * @param  {!number} n
     *         The nuber of the segment in the layback sequence requested.
     * @return {Object}
     *         The segment template.
     */

  }, {
    key: "_getTemplateForNthSegment",
    value: function _getTemplateForNthSegment(n) {
      // Calculate the loop position and number of the nth segment.
      var nOffset = n + this._play.initialSegment - this._play.startSegment;
      var loopNumber = this._play.loop && this._play.segmentsPerLoop ? Math.floor(nOffset / this._play.segmentsPerLoop) : 0;
      var loopPosition = this._play.loop && this._play.segmentsPerLoop ? nOffset % this._play.segmentsPerLoop : nOffset; // Calulate the stream segment number and url.

      var number = this._play.startSegment + loopPosition;

      var url = this._stream.templateUrl.replace('$Number', this._padNumberWithZeros(number, this._stream.templateUrlLeadingZeros)); // Construct the default parameters for when, offset and duration that
      // describe the period covered by the segment (w.r.t. context time:)
      // when - when the play should start.
      // offset - where the playback should start.
      // duration - the intended length of the portion to be played.


      var when = -this._play.startOverlap - this._play.initial + loopNumber * this._play.duration + loopPosition * this._stream.segmentDuration;
      var offset = 0;
      var duration = this._stream.segmentDuration; // Trim the start of the first segment of the first loop if required.
      // Otherwise; trim the start of the first loop segment if required.

      if (n === 0) {
        when = 0;
        duration = duration - this._play.initialOverlap;
        offset = offset + this._play.initialOverlap;
      } else if (number === this._play.startSegment) {
        when = when + this._play.startOverlap;
        duration = duration - this._play.startOverlap;
        offset = offset + this._play.startOverlap;
      } // Trim the end of the last loop segment if required.


      if (number === this._play.endSegment) {
        duration = duration - this._play.endOverlap;
      } // Return the template for the segment.


      return {
        n: n,
        number: number,
        url: url,
        when: when,
        offset: offset,
        duration: duration
      };
    }
    /**
     * Returns a string representation of number padded with zeros.
     * @param  {!number} number
     *         The number to pad.
     * @param  {!number} zeros
     *         The number of '0' characters to pad the number.
     * @return {string}
     *         The string representation of the zero padded number.
     */

  }, {
    key: "_padNumberWithZeros",
    value: function _padNumberWithZeros(number, zeros) {
      var str = "".concat(number);

      while (str.length < zeros) {
        str = "0".concat(str);
      }

      return str;
    }
    /**
     * This must be overridden by subclasses. Should add a data payload to a
     * segment in the buffer, performing any pre- or post-processing required.
     * @abstract
     * @example
     * // _addDataToSegment(data, n) {
     * //   let segment = null;
     * //   let isFound = false;
     * //   let i = 0;
     * //
     * //   while (!isFound && i < this._buffer.segments.length) {
     * //     if (this._buffer.segments[i].n === n) {
     * //       segment = this._buffer.segments[i];
     * //       segment.data = data;
     * //       isFound = true;
     * //     }
     * //     i++;
     * //   }
     * //
     * //   return segment;
     * // }
     * @param  {!any} data
     *         The data to add to the segment.
     * @param  {!number} n
     *         The number of the segment in the playback sequence.
     * @return {Object}
     *         The complete segment.
     */

  }, {
    key: "_addDataToSegment",
    value: function _addDataToSegment() {}
    /**
     * Starts streaming of the region defined by prime. This may be overridden by
     * subclasses needing to act before streaming is started.
     */

  }, {
    key: "_start",
    value: function _start() {
      var _this3 = this;

      // Continually maintain the buffer. Checks if a new segment can be
      // downloaded with a frequency relative to the streams segment duration.
      this.manageBufferInterval = setInterval(function () {
        return _this3._manageBuffer();
      }, this._stream.segmentDuration / 4 * 1000);
    }
    /**
     * Stops streaming of the region defined by prime. This may be overridden by
     * subclasses needing to act before streaming is stopped.
     */

  }, {
    key: "_stop",
    value: function _stop() {
      // Stop maintaining the buffer.
      clearInterval(this.manageBufferInterval);
    }
    /**
     * Ends streaming of the region defined by prime. This may be
     * overridden by subclasses needing to act when streaming ends naturally.
     */

  }, {
    key: "_end",
    value: function _end() {
      this._stop();

      this._play.endedCallback();
    }
  }]);

  return SegmentStream;
}();



/***/ }),

/***/ "./src/dash/manifest-loader/manifest-loader.js":
/*!*****************************************************!*\
  !*** ./src/dash/manifest-loader/manifest-loader.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ManifestLoader)
/* harmony export */ });
/* harmony import */ var _core_loaders_loader__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core/loaders/loader */ "./src/core/loaders/loader.js");
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }


/**
 * A class that provides Promise-based, asynchronous DASH Manifest loading.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document
 * @see http://mpeg.chiariglione.org/standards/mpeg-dash
 * @example
 * const manifestLoader = new bbcat.dash.ManifestLoader();
 * const manifestParser = new bbcat.dash.ManifestParser();
 *
 * manifestLoader.load('http://example.org/manifest.mpd').then((doc) => {
 *  const manifest = manifestParser.parse(doc);
 *  // Use manifest.mediaPresentationDuration etc.
 * });
 */

var ManifestLoader = /*#__PURE__*/function (_Loader) {
  _inherits(ManifestLoader, _Loader);

  var _super = _createSuper(ManifestLoader);

  /**
   * Constructs a new {@link ManifestLoader}.
   */
  function ManifestLoader() {
    var _this;

    _classCallCheck(this, ManifestLoader);

    _this = _super.call(this, 'text');
    _this._parser = new DOMParser();
    return _this;
  }
  /**
   * Loads one or more manifest files asynchronously and converts them to
   * documents.
   * @override
   * @param  {!(string|string[])} urls
   *         A single url or list of urls of manifest files to load and convert.
   * @return {Promise}
   *         A Promise that resolves when all manifest files have been loaded
   *         and converted to documents.
   */


  _createClass(ManifestLoader, [{
    key: "load",
    value: function load(urls) {
      return _get(_getPrototypeOf(ManifestLoader.prototype), "load", this).call(this, urls);
    }
    /**
     * Loads and converts one manifest file asynchronously.
     * @private
     * @param  {!string} url
     *         A single url of a manifest file to load and decoded.
     * @return {Promise}
     *         A Promise that resolves when the manifest has been loaded.
     */

  }, {
    key: "_loadOne",
    value: function _loadOne(url) {
      var _this2 = this;

      return _get(_getPrototypeOf(ManifestLoader.prototype), "_loadOne", this).call(this, url).then(function (string) {
        return _this2._parse(string);
      });
    }
    /**
     * Converts one manifest blob to a document.
     * @private
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Document
     * @param  {!string} string
     *         A string blob containing the manifest to be converted.
     * @return {Promise}
     *         A Promise that resolves when the manifest blob has been converted.
     */

  }, {
    key: "_parse",
    value: function _parse(string) {
      var xml = this._parser.parseFromString(string, 'text/xml');

      return Promise.resolve(xml);
    }
  }]);

  return ManifestLoader;
}(_core_loaders_loader__WEBPACK_IMPORTED_MODULE_0__["default"]);



/***/ }),

/***/ "./src/dash/manifest-parser/manifest-parser.js":
/*!*****************************************************!*\
  !*** ./src/dash/manifest-parser/manifest-parser.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ManifestParser)
/* harmony export */ });
/* harmony import */ var _core_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../core/_index */ "./src/core/_index.js");
/* harmony import */ var _mpd_models__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./mpd-models */ "./src/dash/manifest-parser/mpd-models.js");
/* harmony import */ var _mpd_parsers__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./mpd-parsers */ "./src/dash/manifest-parser/mpd-parsers.js");
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }




/**
 * A class to parse DASH Manifest documents, returning a Javascript object
 * representing their contents.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document
 * @see http://mpeg.chiariglione.org/standards/mpeg-dash
 * @extends {DocumentParser}
 * @example
 * const manifestLoader = new bbcat.dash.ManifestLoader();
 * const manifestParser = new bbcat.dash.ManifestParser();
 *
 * manifestLoader.load('http://example.org/manifest.mpd').then((doc) => {
 *  const manifest = manifestParser.parse(doc);
 *  // Use manifest.mediaPresentationDuration etc.
 * });
 */

var ManifestParser = /*#__PURE__*/function (_DocumentParser) {
  _inherits(ManifestParser, _DocumentParser);

  var _super = _createSuper(ManifestParser);

  /**
   * Constructs a new {@link ManifestParser}.
   */
  function ManifestParser() {
    _classCallCheck(this, ManifestParser);

    return _super.call(this, _mpd_models__WEBPACK_IMPORTED_MODULE_1__["default"], _mpd_parsers__WEBPACK_IMPORTED_MODULE_2__["default"]);
  }

  return ManifestParser;
}(_core_index__WEBPACK_IMPORTED_MODULE_0__.DocumentParser);



/***/ }),

/***/ "./src/dash/manifest-parser/mpd-models.js":
/*!************************************************!*\
  !*** ./src/dash/manifest-parser/mpd-models.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// A set of datamodels that represent the constituent components of the
// ISO/IEC 23009 -- Dynamic adaptive streaming over HTTP (DASH) specification.
var MPD = {
  attributes: [{
    name: 'type',
    type: 'string',
    "default": 'static'
  }, {
    name: 'minBufferTime',
    type: 'period'
  }, {
    name: 'mediaPresentationDuration',
    type: 'period'
  }, {
    name: 'maxSegmentDuration',
    type: 'period'
  }, {
    name: 'availabilityStartTime',
    type: 'date'
  }],
  nodes: [{
    name: 'programInformation',
    node: 'ProgramInformation',
    type: 'ProgramInformation',
    mapping: 'one'
  }, {
    name: 'baseURL',
    node: 'BaseURL',
    type: 'string',
    mapping: 'many'
  }, {
    name: 'periods',
    node: 'Period',
    type: 'Period',
    mapping: 'many'
  }]
};
var ProgramInformation = {
  attributes: [{
    name: 'moreInformationURL',
    type: 'string'
  }, {
    name: 'lang',
    type: 'string'
  }],
  nodes: [{
    name: 'title',
    node: 'Title',
    type: 'string',
    mapping: 'one'
  }, {
    name: 'source',
    node: 'Source',
    type: 'string',
    mapping: 'one'
  }, {
    name: 'copyright',
    node: 'Copyright',
    type: 'string',
    mapping: 'one'
  }]
};
var Period = {
  attributes: [{
    name: 'id',
    type: 'integer',
    "default": 0
  }, {
    name: 'duration',
    type: 'period'
  }, {
    name: 'start',
    type: 'period',
    "default": 0
  }],
  nodes: [{
    name: 'baseUrl',
    node: 'BaseUrl',
    type: 'string',
    mapping: 'one'
  }, {
    name: 'adaptationSets',
    node: 'AdaptationSet',
    type: 'AdaptationSet',
    mapping: 'many'
  }]
}; // TODO: Remove value (represents number of audio channels) when
// AudioChannelConfiguration id-value pair is used across all test assets.

var AdaptationSet = {
  attributes: [{
    name: 'id',
    type: 'string',
    "default": ''
  }, {
    name: 'mimeType',
    type: 'string',
    "default": ''
  }, {
    name: 'value',
    type: 'integer'
  }],
  nodes: [{
    name: 'audioChannelConfiguration',
    node: 'AudioChannelConfiguration',
    type: 'AudioChannelConfiguration',
    mapping: 'one'
  }, {
    name: 'segmentTemplate',
    node: 'SegmentTemplate',
    type: 'SegmentTemplate',
    mapping: 'one'
  }, {
    name: 'representations',
    node: 'Representation',
    type: 'Representation',
    mapping: 'many'
  }, {
    name: 'baseURL',
    node: 'BaseURL',
    type: 'string',
    mapping: 'one'
  }]
};
var AudioChannelConfiguration = {
  attributes: [{
    name: 'value',
    type: 'integer',
    "default": 0
  }]
};
var SegmentTemplate = {
  attributes: [{
    name: 'duration',
    type: 'integer',
    "default": 0
  }, {
    name: 'timescale',
    type: 'integer',
    "default": 0
  }, {
    name: 'startNumber',
    type: 'integer',
    "default": 1
  }, {
    name: 'presentationTimeOffset',
    type: 'integer',
    "default": 0
  }, {
    name: 'media',
    type: 'string',
    "default": ''
  }, {
    name: 'initialization',
    type: 'string',
    "default": null
  }]
};
var Representation = {
  attributes: [{
    name: 'id',
    type: 'string',
    "default": ''
  }, {
    name: 'bandwidth',
    type: 'integer'
  }]
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  MPD: MPD,
  ProgramInformation: ProgramInformation,
  Period: Period,
  AdaptationSet: AdaptationSet,
  AudioChannelConfiguration: AudioChannelConfiguration,
  SegmentTemplate: SegmentTemplate,
  Representation: Representation
});

/***/ }),

/***/ "./src/dash/manifest-parser/mpd-parsers.js":
/*!*************************************************!*\
  !*** ./src/dash/manifest-parser/mpd-parsers.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
var SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
var SECONDS_IN_MONTH = 30 * 24 * 60 * 60;
var SECONDS_IN_DAY = 24 * 60 * 60;
var SECONDS_IN_HOUR = 60 * 60;
var SECONDS_IN_MINUTE = 60;

function parseInteger(value) {
  return parseInt(value, 10);
}

function parseDate(value) {
  return value === null || value === undefined ? null : new Date(value);
}

function parsePeriod(value) {
  // Period format: ISO 8601 (https://en.wikipedia.org/wiki/ISO_8601#Durations)
  // Regex to match and tokenize the period string. Human readable breakdown:
  // ^P                         // Prefixed with the identifier P (period.)
  //   (?: (\d+)Y)?             // Optional positive integer followed by Y.
  //   (?: (\d+)M)?             // Optional positive integer followed by M.
  //   (?: (\d+)D)?             // Optional positive integer followed by D.
  // T                          // Seperated by identifier T (time part.)
  //   (?: (\d+)H)?             // Optional positive integer followed by H.
  //   (?: (\d+)M)?             // Optional positive integer followed by M.
  //   (?: (\d+(?: .\d+)?)S)?   // Optional positive float followed by S.
  var regex = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:.\d+)?)S)?/;
  var seconds = null;

  if (regex.test(value)) {
    var match = regex.exec(value);
    seconds = parseInt(match[1] || 0, 10) * SECONDS_IN_YEAR + parseInt(match[2] || 0, 10) * SECONDS_IN_MONTH + parseInt(match[3] || 0, 10) * SECONDS_IN_DAY + parseInt(match[4] || 0, 10) * SECONDS_IN_HOUR + parseInt(match[5] || 0, 10) * SECONDS_IN_MINUTE + parseFloat(match[6] || 0);
  } else {
    seconds = parseInt(value, 10);
  }

  return seconds;
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  integer: parseInteger,
  date: parseDate,
  period: parsePeriod
});

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/bbcat.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "core": () => (/* reexport module object */ _core_index__WEBPACK_IMPORTED_MODULE_0__),
/* harmony export */   "dash": () => (/* reexport module object */ _dash_index__WEBPACK_IMPORTED_MODULE_1__),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _core_index__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./core/_index */ "./src/core/_index.js");
/* harmony import */ var _dash_index__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./dash/_index */ "./src/dash/_index.js");



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  core: _core_index__WEBPACK_IMPORTED_MODULE_0__,
  dash: _dash_index__WEBPACK_IMPORTED_MODULE_1__
});
})();

/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=bbcat.js.map