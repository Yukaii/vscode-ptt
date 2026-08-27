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
    showInformationMessage: async () => undefined,
    showWarningMessage: async () => undefined,
    showInputBox: async () => undefined,
    showQuickPick: async () => undefined
  },
  workspace: {
    getConfiguration: () => ({
      get: () => undefined
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
