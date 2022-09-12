module.exports = {
  TASK_STATUS: {
    PENDING: 0,
    RUNNING: 1,
    SUCCESS: 2,
    CANCELLED: 3,
    FAILED: -1,
  },
  THREAD_STATUS: {
    IDLE: 0,
    WORKING: 1,
    STOPPED: 2,
  },
  THREAD_TYPE: {
    EVAL: 1,
    EXEC: 2,
  },
};