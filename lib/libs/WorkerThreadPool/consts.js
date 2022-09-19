"use strict";

module.exports = {
  TASK_STATUS: {
    PENDING: 0,
    RUNNING: 1,
    SUCCESS: 2,
    CANCELLED: 3,
    FAILED: -1
  },
  CODE: {
    SUCCESS: 0,
    FAILED: 1
  },
  THREAD_STATUS: {
    IDLE: 0,
    WORKING: 1,
    DEAD: -1
  },
  THREAD_TYPE: {
    EVAL: 1,
    EXEC: 2
  }
};