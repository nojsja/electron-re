declare module electronReModule {
  export interface electronRe {
    MessageChannel: {
      invoke: (name: string, channel: string, args: unknown) => Promise<any>
      handle: (channel: string, promiseFunc: (event, args: { action: string, params: any }) => Promise<unknown>) => void
      send: (name: string, channel: string, args: unknown) => void
      sendTo: (id: number, channel: string, args: unknown) => void
      on: (channel: string, func: () => void)  => void
      once: (channel: string, func: () => void)  => void
      registry: (name: string, id: number, pid: number)  => void
    }
    
    BrowserService: {
      openDevTools: () => void
      connected: (callback?: () => void) => void
    }
    
    ChildProcessPool: {
      send: (taskName: string, params: unknown, givenId: number) => Promise<any>
      sendToAll: (taskName: string, params: unknown) => void
      kill: (id?: number) => void
      setMaxInstanceLimit: (count: number) => void
    }
    
    ProcessHost: {
      registry: (taskName: string, processor: () => Promise<any>) => void
      unregistry: (taskName: string) => void
      disconnect: () => void
      exit: () => void
    }
  
    ProcessManager: {
      pipe: (pinstance: any) => void
      listen: (pids: number[], mark: string, url?: string) => void
      unlisten: (pids: number[]) => void
      openDevTools: (pid: number) => void
      killProcess: (pid: number) => void
      setIntervalTime: (time: number) => void
      openWindow: (env: 'prod' | 'dev' | undefined) => void
    }
  }
}

declare const ere: electronReModule.electronRe;

export = ere;