declare module 'electron-re' {
  export interface MessageChannel {
    invoke: (name: string, channel: 'string', args: unknown) => Promise<any>
    handle: (channel: string, promiseFunc: () => void) => void
    send: (name: string, channel: string, args: unknown) => void
    sendTo: (id: number, channel: string, args: unknown) => void
    on: (channel: string, func: () => void)  => void
    once: (channel: string, func: () => void)  => void
    registry: (name: string, id: number, pid: number)  => void
  }
  
  export interface BrowserService {
    openDevTools: () => void
    connected: (callback?: () => void) => void
  }
  
  export interface ChildProcessPool {
    send: (taskName: string, params: unknown, givenId: number) => Promise<any>
    sendToAll: (taskName: string, params: unknown) => void
    kill: (id?: number) => void
    setMaxInstanceLimit: (count: number) => void
  }
  
  export interface ProcessHost {
    registry: (taskName: string, processor: () => void) => void
    unregistry: (taskName: string) => void
    disconnect: () => void
    exit: () => void
  }

  export interface ProcessManager {
    pipe: (pinstance: any) => void
    listen: (pids: number[], mark: string, url?: string) => void
    unlisten: (pids: number[]) => void
    openDevTools: (pid: number) => void
    killProcess: (pid: number) => void
    setIntervalTime: (time: number) => void
    openWindow: (env: 'prod' | 'dev' | undefined) => void
  }
}