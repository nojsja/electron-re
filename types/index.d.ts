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
}

export as namespace electronReModule;

export = electronReModule
