"use strict";

module.exports = {
  TASK_STATUS: {
    PENDING: 0,
    RUNNING: 1,
    SUCCESS: 2,
    CANCELLED: 3,
    FAILED: -1
  },
  TASK_TYPE: {
    DYNAMIC: 1,
    STATIC: 0
  },
  CODE: {
    SUCCESS: 0,
    FAILED: 1
  },
  CONF: {
    MAX_TASK_RETRY: 5,
    MIN_TASK_LOOP_TIME: 500,
    DEFAULT_LAZYLOAD: true,
    DEFAULT_MAX_THREADS: 50,
    DEFAULT_MAX_TASKS: 100,
    DEFAULT_TASK_RETRY: 0,
    DEFAULT_TASK_LOOP_TIME: 2e3,
    DEFAULT_TASK_TIMEOUT: 60e3
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