"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var CONSTS = require("./consts");

var Scheduler = require("./scheduler");

var RANDOM = CONSTS.RANDOM,
    POLLING = CONSTS.POLLING,
    WEIGHTS = CONSTS.WEIGHTS,
    SPECIFY = CONSTS.SPECIFY,
    WEIGHTS_RANDOM = CONSTS.WEIGHTS_RANDOM,
    WEIGHTS_POLLING = CONSTS.WEIGHTS_POLLING,
    MINIMUM_CONNECTION = CONSTS.MINIMUM_CONNECTION,
    WEIGHTS_MINIMUM_CONNECTION = CONSTS.WEIGHTS_MINIMUM_CONNECTION;
/* Load Balance Instance */

var LoadBalancer =
/**
  * @param  {Object} options [ options object ]
  * @param  {Array } options.targets [ targets for load balancing calculation: [{id: 1, weight: 1}, {id: 2, weight: 2}] ]
  * @param  {String} options.algorithm [ strategies for load balancing calculation : RANDOM | POLLING | WEIGHTS | SPECIFY | WEIGHTS_RANDOM | WEIGHTS_POLLING | MINIMUM_CONNECTION | WEIGHTS_MINIMUM_CONNECTION]
  */
function LoadBalancer(options) {
  var _this = this;

  (0, _classCallCheck2["default"])(this, LoadBalancer);

  this.memorizedParams = function () {
    var _ref;

    return _ref = {}, (0, _defineProperty2["default"])(_ref, RANDOM, function () {
      return [];
    }), (0, _defineProperty2["default"])(_ref, POLLING, function () {
      return [_this.params.currentIndex, _this.params];
    }), (0, _defineProperty2["default"])(_ref, WEIGHTS, function () {
      return [_this.params.weightTotal, _this.params];
    }), (0, _defineProperty2["default"])(_ref, SPECIFY, function (id) {
      return [id];
    }), (0, _defineProperty2["default"])(_ref, WEIGHTS_RANDOM, function () {
      return [_this.params.weightTotal];
    }), (0, _defineProperty2["default"])(_ref, WEIGHTS_POLLING, function () {
      return [_this.params.weightIndex, _this.params.weightTotal, _this.params];
    }), (0, _defineProperty2["default"])(_ref, MINIMUM_CONNECTION, function () {
      return [_this.params.connectionsMap];
    }), (0, _defineProperty2["default"])(_ref, WEIGHTS_MINIMUM_CONNECTION, function () {
      return [_this.params.weightIndex, _this.params.weightTotal, _this.params.connectionsMap, _this.params];
    }), _ref;
  };

  this.pickOne = function () {
    var _this$memoParams;

    return _this.scheduler.calculate(_this.targets, (_this$memoParams = _this.memoParams)[_this.algorithm].apply(_this$memoParams, arguments));
  };

  this.pickMulti = function () {
    var count = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;

    for (var _len = arguments.length, params = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      params[_key - 1] = arguments[_key];
    }

    return new Array(count).fill().map(function () {
      return _this.pickOne.apply(_this, params);
    });
  };

  this.calculateWeightIndex = function () {
    _this.weightTotal = _this.targets.reduce(function (total, cur) {
      return total + (cur.weight || 0);
    }, 0);

    if (_this.params.weightIndex > _this.weightTotal) {
      _this.params.weightIndex = _this.weightTotal;
    }
  };

  this.calculateIndex = function () {
    if (_this.params.currentIndex >= _this.targets.length) {
      _this.params.currentIndex = ths.params.currentIndex - 1 >= 0 ? _this.params.currentIndex - 1 : 0;
    }
  };

  this.clean = function (id) {
    if (id) {
      delete _this.params.connectionsMap[id];
      delete _this.params.cpuOccupancyMap[id];
    } else {
      _this.params = {
        currentIndex: 0,
        connectionsMap: {},
        cpuOccupancyMap: {}
      };
    }
  };

  this.add = function (task) {
    _this.targets.push(task);

    if (_this.targets.find(function (target) {
      return target.id === task.id;
    })) {
      return console.warn("Add Operation: the task ".concat(task.id, " already exists."));
    }

    _this.targets.push(task);
  };

  this.del = function (target) {
    var found = false;

    for (var i = 0; i < _this.targets.length; i++) {
      if (array[i].id === target.id) {
        _this.targets.splice(i, 1);

        _this.clean(target.id);

        _this.calculateIndex();

        found = true;
        break;
      }
    }

    if (found) {
      _this.calculateWeightIndex();
    } else {
      console.warn("Del Operation: the task ".concat(target.id, " is not found."));
    }
  };

  this.wipe = function () {
    _this.targets = [];

    _this.calculateWeightIndex();

    _this.clean();
  };

  this.updateParams = function (object) {
    Object.entries(object).map(function (_ref2) {
      var _ref3 = (0, _slicedToArray2["default"])(_ref2, 2),
          key = _ref3[0],
          value = _ref3[1];

      if (key in _this.params) {
        _this.params[key] = value;
      }
    });
  };

  this.setTargets = function (targets) {
    var targetsMap = targets.reduce(function (total, cur) {
      total[cur.id] = 1;
      return total;
    }, {});

    _this.targets.forEach(function (target) {
      if (!(target.id in targetsMap)) {
        _this.clean(target.id);

        _this.calculateIndex();
      }
    });

    _this.targets = targets;

    _this.calculateWeightIndex();
  };

  this.setAlgorithm = function (algorithm) {
    if (algorithm in CONSTS) {
      _this.algorithm = algorithm;

      _this.scheduler.setAlgorithm(_this.algorithm);
    } else {
      throw new Error("Invalid algorithm: ".concat(algorithm, ", pick from ").concat(Object.keys(CONSTS).join('|')));
    }
  };

  this.targets = options.targets;
  this.algorithm = options.algorithm || POLLING;
  this.params = {
    // data for algorithm
    currentIndex: 0,
    // index
    weightIndex: 0,
    // index for weight alogrithm
    weightTotal: 0,
    // total weight
    connectionsMap: {},
    // connections of each target
    cpuOccupancyMap: {} // cpu occupancy of each target

  };
  this.scheduler = new Scheduler(this.algorithm);
  this.memoParams = this.memorizedParams();
}
/* params formatter */
;

module.exports = Object.assign(LoadBalancer, {
  ALGORITHM: CONSTS
});