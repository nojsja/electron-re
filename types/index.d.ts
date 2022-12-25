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
    )
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

  export class Task {}

  export class Thread {}

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

  export interface ExecArgs {
    execString?: string;
    execPath?: string;
  }

  export interface WorkerOptions {
    transferList?: Transferable[];
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

  class ThreadPool {
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
    static generateNewThread: (options:  WorkerOptions & ExecArgs) => Thread
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
    )

    isFull: Boolean
    threadLength: Number
    taskLength: Number
    private idleThread: Thread
    protected queue: (payload: any, options?: {
      execFunction?: Function;
      execString?: String;
      execPath?: String;
      taskRetry?: Number;
      transferList?: Transferable[];
      taskTimeout?: Number;
    }) => void
    protected exec: (payload: any, options?: {
      execFunction?: Function;
      execString?: String;
      execPath?: String;
      taskRetry?: Number;
      transferList?: Transferable[];
      taskTimeout?: Number;
    }) => Promise<{ data: any; error: null | Error }>
    protected setExecPath: (execPath: String) => ThreadPool
    protected setExecString: (execString: String) => ThreadPool
    protected setExecFunction: (execFunction: Function) => ThreadPool
    protected fillPoolWithIdleThreads: () => ThreadPool
    public wipeTaskQueue: () => ThreadPool
    public wipeThreadPool: () => ThreadPool
    public setMaxThreads: (maxThreads: Number) => ThreadPool
    public setMaxTasks: (maxTasks: Number) => ThreadPool
    public setTaskLoopTime: (taskLoopTime: Number) => ThreadPool
    public setTaskRetry: (taskRetry: Number) => ThreadPool
    public setTransferList: (transferList: Transferable) => ThreadPool
  }

  class Excutor {
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
    })

    public setTaskRetry: (taskRetry: Number) => Excutor;
    public setTransferList: (transferList: Transferable[]) => Excutor;
    public setTaskTimeout: (taskTimeout: Number) => Excutor;
  }

  class StaticExcutor extends Excutor {
    constructor(parentPool: StaticThreadPool, options: StaticExcutorOptions): void

    public exec: (payload: any) => Promise<{ data: any; error: null | Error }>
  }

  class DynamicExcutor extends Excutor {
    constructor(parentPool: DynamicThreadPool, options: DynamicExcutorOptions): void

    public setExecPath: (execPath: String) => DynamicExcutor
    public setExecString: (execString: String) => DynamicExcutor
    public setExecFunction: (execFunction: Function) => DynamicExcutor
    public exec: (payload: any) => Promise<{ data: any; error: null | Error }>
  }

  export class StaticThreadPool extends ThreadPool {
    constructor(
      options: ThreadPoolOptions,
      threadOptions?: WorkerOptions
    )

    public fillPoolWithIdleThreads: () => ThreadPool
    public createExecutor: (options?: StaticExcutorOptions) => StaticExcutor
    public queue: (payload: any, options?: {
      taskRetry?: Number;
      transferList?: Transferable[];
      taskTimeout?: Number;
    }) => void
    public exec: (payload: any, options?: {
      taskRetry?: Number;
      transferList?: Transferable[];
      taskTimeout?: Number;
    }) => Promise<{ data: any; error: null | Error }>
  }

  export class DynamicThreadPool extends ThreadPool {
    constructor(
      options?: Omit<ThreadPoolOptions, 'execFunction' | 'execPath' | 'execString'>,
      threadOptions?: WorkerOptions
    )

    public createExecutor: (options?: DynamicExcutorOptions) => DynamicExcutor
    public setExecPath: (execPath: String) => ThreadPool
    public setExecString: (execString: String) => ThreadPool
    public setExecFunction: (execFunction: Function) => ThreadPool
    public queue: (payload: any, options?: {
      execFunction?: Function;
      execString?: String;
      execPath?: String;
      taskRetry?: Number;
      transferList?: Transferable[];
      taskTimeout?: Number;
    }) => void
    public exec: (payload: any, options?: {
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
