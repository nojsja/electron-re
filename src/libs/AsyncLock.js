/**
  * @name AsyncLock
  * @description
  *   Use it in child processes, mutex lock logic.
  *   First create SharedArrayBuffer in main process and transfer it to all child processes to control the lock.
  */

class AsyncLock {
  static INDEX = 0;
  static UNLOCKED = 0;
  static LOCKED = 1;

  constructor(sab) {
    this.sab = sab; // data like this: const sab = new SharedArrayBuffer(16);
    this.i32a = new Int32Array(sab);
  }

  lock() {
    while (true) {
      const oldValue = Atomics.compareExchange(
        this.i32a, AsyncLock.INDEX,
        AsyncLock.UNLOCKED, // old
        AsyncLock.LOCKED // new
      );
      if (oldValue == AsyncLock.UNLOCKED) { // success
        return;
      }
      Atomics.wait( // wait
        this.i32a,
        AsyncLock.INDEX,
        AsyncLock.LOCKED // expect
      );
    }
  }

  unlock() {
    const oldValue = Atomics.compareExchange(
      this.i32a, AsyncLock.INDEX,
      AsyncLock.LOCKED,
      AsyncLock.UNLOCKED
    );
    if (oldValue != AsyncLock.LOCKED) { // failed
      throw new Error('Tried to unlock while not holding the mutex');
    }
    Atomics.notify(this.i32a, AsyncLock.INDEX, 1);
  }

  /**
    * executeLocked [async function to acquired the lock and execute callback]
    * @param  {Function} callback [callback function]
    */
  executeAfterLocked(callback) {

    const tryGetLock = async () => {
      while (true) {
        const oldValue = Atomics.compareExchange(
          this.i32a,
          AsyncLock.INDEX,
          AsyncLock.UNLOCKED,
          AsyncLock.LOCKED
        );
        if (oldValue == AsyncLock.UNLOCKED) { // success
          callback();
          this.unlock();
          return;
        }
        const result = Atomics.waitAsync( // wait
          this.i32a,
          AsyncLock.INDEX,
          AsyncLock.LOCKED
        );
        await result.value;
      }
    }

    tryGetLock();
  }
}