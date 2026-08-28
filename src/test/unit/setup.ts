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
  languages: {
    setTextDocumentLanguage: async (doc: any, languageId: string) => {
      if (doc) {
        doc.languageId = languageId;
      }
      return doc;
    }
  },
  commands: {
    registerCommand: () => ({ dispose: () => {} }),
    executeCommand: async (..._args: any[]): Promise<any> => undefined
  },
  window: {
    registerTreeDataProvider: () => ({ dispose: () => {} }),
    showInformationMessage: async (..._args: any[]): Promise<any> => undefined,
    showWarningMessage: async (..._args: any[]): Promise<any> => undefined,
    showInputBox: async (..._args: any[]): Promise<any> => undefined,
    showQuickPick: async (..._args: any[]): Promise<any> => undefined,
    showTextDocument: async (..._args: any[]): Promise<any> => undefined
  },
  workspace: {
    getConfiguration: (..._args: any[]) => ({
      get: (..._gargs: any[]) => undefined
    }),
    registerTextDocumentContentProvider: () => ({ dispose: () => {} }),
    openTextDocument: async (uri: any): Promise<any> => ({ uri, languageId: 'plaintext' }),
    onDidOpenTextDocument: () => ({ dispose: () => {} })
  },
  Uri: {
    parse: (val: string) => {
      const colonIdx = val.indexOf(':');
      return {
        scheme: colonIdx >= 0 ? val.substring(0, colonIdx) : '',
        path: colonIdx >= 0 ? val.substring(colonIdx + 1) : val,
        toString: () => val
      };
    }
  },
  ViewColumn: {
    Active: -1,
    Beside: -2,
    One: 1,
    Two: 2,
    Three: 3
  }
};

const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string, ...args: any[]) {
  if (id === 'vscode') {
    return mockVscode;
  }
  return originalRequire.apply(this, [id, ...args]);
};
