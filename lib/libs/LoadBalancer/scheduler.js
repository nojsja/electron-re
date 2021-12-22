"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var CONSTS = require("./consts");

var algorithm = require('./algorithm');

var POLLING = CONSTS.POLLING;
/* Scheduler for LoadBalancer  */

var Scheduler = /*#__PURE__*/function () {
  function Scheduler(_algorithm) {
    var _this = this;

    (0, _classCallCheck2["default"])(this, Scheduler);

    this.setAlgorithm = function (algorithm) {
      if (algorithm in CONSTS) {
        _this.algorithm = algorithm;
      } else {
        throw new Error("Invalid algorithm: ".concat(algorithm, ", pick from ").concat(Object.keys(CONSTS).join('|')));
      }
    };

    this.algorithm = _algorithm || POLLING;
  }
  /* pick one task from task list based on algorithm and params */


  (0, _createClass2["default"])(Scheduler, [{
    key: "calculate",
    value: function calculate(tasks, params) {
      var results = algorithm[this.algorithm].apply(algorithm, [tasks].concat((0, _toConsumableArray2["default"])(params)));
      return results;
    }
    /* change algorithm strategy */

  }]);
  return Scheduler;
}();

module.exports = Scheduler;