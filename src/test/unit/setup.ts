import Module from 'node:module';

export const mockVscode = {
  FileType: {
    Unknown: 0,
    File: 1,
    Directory: 2,
    SymbolicLink: 64
  },
  FilePermission: {
    Readonly: 1
  },
  FileSystemError: class FileSystemError extends Error {
    public code: string;
    constructor(message: string, code = '') {
      super(message);
      this.code = code;
    }
    static FileNotFound(_uri?: unknown) {
      return new FileSystemError('FileNotFound', 'FileNotFound');
    }
    static NoPermissions(message?: string) {
      return new FileSystemError(message || 'NoPermissions', 'NoPermissions');
    }
    static Unavailable(message?: string) {
      return new FileSystemError(message || 'Unavailable', 'Unavailable');
    }
  },
  Disposable: class {
    constructor(private call: () => void) {}
    dispose() {
      this.call?.();
    }
  },
  TreeItem: class {
    label: string;
    collapsibleState: number;
    id?: string;
    iconPath?: unknown;
    description?: string | boolean;
    resourceUri?: unknown;
    tooltip?: unknown;
    command?: unknown;
    contextValue?: string;
    constructor(label: string, collapsibleState: number) {
      this.label = label;
      this.collapsibleState = collapsibleState;
    }
  },
  ThemeIcon: class {
    constructor(public id: string, public color?: unknown) {}
  },
  MarkdownString: class {
    private str = '';
    appendMarkdown(s: string) {
      this.str += s;
      return this;
    }
    toString() {
      return this.str;
    }
  },
  TreeItemCollapsibleState: {
    None: 0,
    Collapsed: 1,
    Expanded: 2
  },
  EventEmitter: class {
    private listeners: ((data: unknown) => void)[] = [];
    event = (listener: (data: unknown) => void) => {
      this.listeners.push(listener);
    };
    fire(data?: unknown) {
      for (const fn of this.listeners) {
        fn(data);
      }
    }
  },
  languages: {
    setTextDocumentLanguage: async (doc: { languageId?: string }, languageId: string) => {
      if (doc) {
        doc.languageId = languageId;
      }
      return doc;
    }
  },
  commands: {
    registerCommand: () => ({ dispose: () => {} }),
    executeCommand: async (..._args: unknown[]): Promise<unknown> => undefined
  },
  window: {
    createTreeView: (_viewId: string, options?: { treeDataProvider?: unknown }) => ({
      treeDataProvider: options?.treeDataProvider,
      dispose: () => {}
    }),
    registerTreeDataProvider: () => ({ dispose: () => {} }),
    showInformationMessage: async (..._args: unknown[]): Promise<unknown> => undefined,
    showWarningMessage: async (..._args: unknown[]): Promise<unknown> => undefined,
    showInputBox: async (..._args: unknown[]): Promise<unknown> => undefined,
    showQuickPick: async (..._args: unknown[]): Promise<unknown> => undefined,
    showTextDocument: async (..._args: unknown[]): Promise<unknown> => undefined
  },
  workspace: {
    getConfiguration: (..._args: unknown[]) => ({
      get: (..._gargs: unknown[]) => undefined
    }),
    registerFileSystemProvider: () => ({ dispose: () => {} }),
    registerTextDocumentContentProvider: () => ({ dispose: () => {} }),
    openTextDocument: async (uri: unknown): Promise<unknown> => ({ uri, languageId: 'plaintext' }),
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
    },
    from: ({ scheme, path }: { scheme?: string; path?: string }) => ({
      scheme: scheme || '',
      path: path || '',
      toString: () => `${scheme || ''}:${path || ''}`
    })
  },
  ViewColumn: {
    Active: -1,
    Beside: -2,
    One: 1,
    Two: 2,
    Three: 3
  }
};

const originalRequire = (Module.prototype as unknown as { require: (id: string, ...args: unknown[]) => unknown }).require;
(Module.prototype as unknown as { require: (id: string, ...args: unknown[]) => unknown }).require = function (id: string, ...args: unknown[]) {
  if (id === 'vscode') {
    return mockVscode;
  }
  return originalRequire.apply(this, [id, ...args]);
};
