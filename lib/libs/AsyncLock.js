"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
  * @name AsyncLock
  * @description
  *   Use it in child processes, mutex lock logic.
  *   First create SharedArrayBuffer in main process and transfer it to all child processes to control the lock.
  */
var AsyncLock = /*#__PURE__*/function () {
  function AsyncLock(sab) {
    (0, _classCallCheck2["default"])(this, AsyncLock);
    this.sab = sab; // data like this: const sab = new SharedArrayBuffer(16);

    this.i32a = new Int32Array(sab);
  }

  (0, _createClass2["default"])(AsyncLock, [{
    key: "lock",
    value: function lock() {
      while (true) {
        var oldValue = Atomics.compareExchange(this.i32a, AsyncLock.INDEX, AsyncLock.UNLOCKED, // old
        AsyncLock.LOCKED // new
        );

        if (oldValue == AsyncLock.UNLOCKED) {
          // success
          return;
        }

        Atomics.wait( // wait
        this.i32a, AsyncLock.INDEX, AsyncLock.LOCKED // expect
        );
      }
    }
  }, {
    key: "unlock",
    value: function unlock() {
      var oldValue = Atomics.compareExchange(this.i32a, AsyncLock.INDEX, AsyncLock.LOCKED, AsyncLock.UNLOCKED);

      if (oldValue != AsyncLock.LOCKED) {
        // failed
        throw new Error('Tried to unlock while not holding the mutex');
      }

      Atomics.notify(this.i32a, AsyncLock.INDEX, 1);
    }
    /**
      * executeLocked [async function to acquired the lock and execute callback]
      * @param  {Function} callback [callback function]
      */

  }, {
    key: "executeAfterLocked",
    value: function executeAfterLocked(callback) {
      var _this = this;

      var tryGetLock = /*#__PURE__*/function () {
        var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
          var oldValue, result;
          return _regenerator["default"].wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (!true) {
                    _context.next = 11;
                    break;
                  }

                  oldValue = Atomics.compareExchange(_this.i32a, AsyncLock.INDEX, AsyncLock.UNLOCKED, AsyncLock.LOCKED);

                  if (!(oldValue == AsyncLock.UNLOCKED)) {
                    _context.next = 6;
                    break;
                  }

                  // success
                  callback();

                  _this.unlock();

                  return _context.abrupt("return");

                case 6:
                  result = Atomics.waitAsync( // wait
                  _this.i32a, AsyncLock.INDEX, AsyncLock.LOCKED);
                  _context.next = 9;
                  return result.value;

                case 9:
                  _context.next = 0;
                  break;

                case 11:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee);
        }));

        return function tryGetLock() {
          return _ref.apply(this, arguments);
        };
      }();

      tryGetLock();
    }
  }]);
  return AsyncLock;
}();

AsyncLock.INDEX = 0;
AsyncLock.UNLOCKED = 0;
AsyncLock.LOCKED = 1;