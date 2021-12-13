"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var CONSTS = require("./consts");

var POLLING = CONSTS.POLLING,
    WEIGHTS = CONSTS.WEIGHTS,
    RANDOM = CONSTS.RANDOM,
    SPECIFY = CONSTS.SPECIFY,
    MINIMUM_CONNECTION = CONSTS.MINIMUM_CONNECTION,
    WEIGHTS_POLLING = CONSTS.WEIGHTS_POLLING,
    WEIGHTS_RANDOM = CONSTS.WEIGHTS_RANDOM,
    WEIGHTS_MINIMUM_CONNECTION = CONSTS.WEIGHTS_MINIMUM_CONNECTION;

var LoadBalancer = /*#__PURE__*/function () {
  function LoadBalancer(options) {
    (0, _classCallCheck2["default"])(this, LoadBalancer);
    this.targets = options.targets;
    this.algorithm = options.algorithm || POLLING;
  }

  (0, _createClass2["default"])(LoadBalancer, [{
    key: "pickOne",
    value: function pickOne() {}
  }, {
    key: "pickMulti",
    value: function pickMulti() {}
  }, {
    key: "delOne",
    value: function delOne() {}
  }, {
    key: "delAll",
    value: function delAll() {}
  }, {
    key: "setAlgorithm",
    value: function setAlgorithm(algorithm) {
      if (algorithm in CONSTS) {
        this.algorithm = algorithm;
      } else {
        throw new Error("Invalid algorithm: ".concat(algorithm, ", pick from ").concat(Object.keys(CONSTS).join('|')));
      }
    }
  }]);
  return LoadBalancer;
}();

module.exports = LoadBalancer;