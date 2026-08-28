import Module from 'module';

export const mockVscode = {
  TreeItem: class {
    label: string;
    collapsibleState: number;
    command?: any;
    contextValue?: string;
    constructor(label: string, collapsibleState: number) {
      this.label = label;
      this.collapsibleState = collapsibleState;
    }
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2
  },
  EventEmitter: class {
    private listeners: ((data: any) => void)[] = [];
    event = (listener: (data: any) => void) => {
      this.listeners.push(listener);
    };
    fire(data?: any) {
      this.listeners.forEach((fn) => fn(data));
    }
  },
  commands: {
    registerCommand: () => ({ dispose: () => {} })
  },
  window: {
    showInformationMessage: async (..._args: any[]): Promise<any> => undefined,
    showWarningMessage: async (..._args: any[]): Promise<any> => undefined,
    showInputBox: async (..._args: any[]): Promise<any> => undefined,
    showQuickPick: async (..._args: any[]): Promise<any> => undefined
  },
  workspace: {
    getConfiguration: (..._args: any[]) => ({
      get: (..._gargs: any[]) => undefined
    })
  }
};

const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string, ...args: any[]) {
  if (id === 'vscode') {
    return mockVscode;
  }
  return originalRequire.apply(this, [id, ...args]);
};
