declare module electronReModule {

  export class BrowserService {
    constructor(
      name: string,
      path: string,
      options?: Electron.BrowserWindowConstructorOptions & {
        dev: boolean
      }
    ): void
    openDevTools: () => void
    connected: (callback?: () => void) => void
  }

  export class MessageChannel {
    static invoke: (name: string, channel: string, args: unknown) => Promise<any>
    static handle: (channel: string, promiseFunc: (event, args: { action: string, params: any }) => Promise<unknown>) => void
    static send: (name: string, channel: string, args: unknown) => void
    static sendTo: (id: number, channel: string, args: unknown) => void
    static on: (channel: string, func: () => void)  => void
    static once: (channel: string, func: () => void)  => void
    static registry: (name: string, id: number, pid: number)  => void
  }

  export class ChildProcessPool {
    constructor(
      params: {
        path: string,
        max: number,
        cwd?: string,
        env?: { [key: string]: string },
        weights?: number[], // weights of processes, the length is equal to max
        strategy?: string,
        lifecycle?: { // lifecycle of processes
          expect?: number, // default timeout 10 minutes
          internal?: number // default loop interval 30 seconds
        }
      }
    ): void
    send: (taskName: string, params?: unknown, givenId?: number) => Promise<any>
    sendToAll: (taskName: string, params?: unknown) => void
    kill: (id?: number) => void
    setMaxInstanceLimit: (count: number) => void
  }

  export class LoadBalancer {
    static ALGORITHM: {
      POLLING: 'POLLING', // 轮询
      WEIGHTS: 'WEIGHTS', // 权重
      RANDOM: 'RANDOM', // 随机
      SPECIFY: 'SPECIFY', // 声明绑定
      WEIGHTS_POLLING: 'WEIGHTS_POLLING', // 权重轮询
      WEIGHTS_RANDOM: 'WEIGHTS_RANDOM', // 权重随机
      MINIMUM_CONNECTION: 'MINIMUM_CONNECTION', // 最小连接数
      WEIGHTS_MINIMUM_CONNECTION: 'WEIGHTS_MINIMUM_CONNECTION', // 权重最小连接数
    }
  }

  export class ProcessHost {
    static registry: (taskName: string, processor: () => Promise<any>) => void
    static unregistry: (taskName: string) => void
    static disconnect: () => void
    static exit: () => void
  }

  export class ProcessManager {
    static pipe: (pinstance: any) => void
    static listen: (pids: number[], mark: string, url?: string) => void
    static unlisten: (pids: number[]) => void
    static openDevTools: (pid: number) => void
    static killProcess: (pid: number) => void
    static setIntervalTime: (time: number) => void
    static openWindow: (env: 'prod' | 'dev' | void) => void
  }

  export class Task {
    
  }

  export class Thread {

  }

  export interface ThreadPoolOptions {
    execFunction?: Function;
    execPath?: String;
    execString?: String;
    lazyLoad?: Boolean;
    maxThreads?: Number;
    maxTasks?: Number;
    taskRetry?: Number;
    taskTimeout?: Number;
    taskLoopTime?: Number;
  }

  export interface ExcutorOptions {
    taskTimeout?: Number;
    transferList?: Transferable[];
    taskRetry?: Number;
  }

  export interface StaticExcutorOptions extends ExcutorOptions {}
  export interface DynamicExcutorOptions extends ExcutorOptions {
    execFunction?: Function;
    execPath?: String;
    execString?: String;
  }

  export class ThreadPool {
    static defaultOptions: {
      lazyLoad?: Boolean;
      maxThreads?: Number;
      maxTasks?: Number;
      taskRetry?: Number;
      taskLoopTime?: Number;
      taskTimeout?: Number;
    }
    static maxTaskRetry: Number
    static minTaskLoopTime: Number
    static generateNewThread: (options:  WorkerOptions) => Thread
    static generateNewTask: (payload: any, options: {
      execPath?: String;
      execString?: String;
      taskRetry?: Number;
      transferList?: Transferable[];
      taskTimeout?: Number;
    }) => Task

    constructor(
      options: ThreadPoolOptions,
      threadOptions: WorkerOptions
    ): void

    isFull: Boolean
    threadLength: Number
    taskLength: Number
    idleThread: Thread
    exec: (payload: any, options: {
      execFunction?: Function;
      execString?: String;
      execPath?: String;
      taskRetry?: Number;
      transferList?: Transferable[];
      taskTimeout?: Number;
    }) => Promise<{ data: any; error: null | Error }>
    wipeTaskQueue: () => ThreadPool
    wipeThreadPool: () => ThreadPool
    setMaxThreads: (maxThreads: Number) => ThreadPool
    setMaxTasks: (maxTasks: Number) => ThreadPool
    setTaskLoopTime: (taskLoopTime: Number) => ThreadPool
    setTaskRetry: (taskRetry: Number) => ThreadPool
    setTransferList: (transferList: Transferable) => ThreadPool
    setExecPath: (execPath: String) => ThreadPool
    setExecString: (execString: String) => ThreadPool
    setExecFunction: (execFunction: Function) => ThreadPool
    fillPoolWithIdleThreads: () => ThreadPool
  }

  export class Excutor {
    static paramsCheck: (options: { taskRetry: Number; taskTimeout: Number; }) => void
    static defaultOptions:  {
      taskRetry: Number;
      taskTimeout: Number;
    }
    static maxTaskRetry: Number;

    constructor(options: {
      taskTimeout: Number;
      transferList: Transferable[];
      taskRetry: Number;
    }): void

    setTaskRetry: (taskRetry: Number) => Excutor;
    setTransferList: (transferList: Transferable[]) => Excutor;
    setTaskTimeout: (taskTimeout: Number) => Excutor;
  }

  export class StaticExcutor extends Excutor {
    constructor(parentPool: StaticThreadPool, options: StaticExcutorOptions): void

    exec: (payload: any) => Promise<{ data: any; error: null | Error }>
  }

  export class DynamicExcutor extends Excutor {
    constructor(parentPool: DynamicThreadPool, options: DynamicExcutorOptions): void

    setExecPath: (execPath: String) => DynamicExcutor
    setExecString: (execString: String) => DynamicExcutor
    setExecFunction: (execFunction: Function) => DynamicExcutor
    exec: (payload: any) => Promise<{ data: any; error: null | Error }>
  }

  export class StaticThreadPool extends ThreadPool {
    constructor(
      options: ThreadPoolOptions,
      threadOptions?: WorkerOptions
    ): void

    createExecutor: (options: StaticExcutorOptions) => StaticExcutor
    exec: (payload: any, options: {
      taskRetry?: Number;
      transferList?: Transferable[];
      taskTimeout?: Number;
    }) => Promise<{ data: any; error: null | Error }>
  }

  export class DynamicThreadPool extends ThreadPool {
    constructor(
      options?: Omit<ThreadPoolOptions, 'execFunction' | 'execPath' | 'execString'>,
      threadOptions?: WorkerOptions
    ): void

    createExecutor: (options: DynamicExcutorOptions) => DynamicExcutor
    exec: (payload: any, options: {
      taskRetry?: Number;
      transferList?: Transferable[];
      taskTimeout?: Number;
      execFunction?: Function;
      execString?: String;
      execPath?: String;
    }) => Promise<{ data: any; error: null | Error }>
  }
}

export as namespace electronReModule;

export = electronReModule
