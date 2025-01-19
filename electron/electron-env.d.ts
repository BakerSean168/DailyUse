/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`

declare global {
  interface Window {
    electron: import('./electron-api').ElectronAPI;
  }
}

interface Window {
  ipcRenderer: import('electron').IpcRenderer
}

interface File {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: File[];
  expanded?: boolean;
}

interface TreeNode {
  title: string;
  key: string;
  fileType: string,
  children?: TreeNode[];
  isLeaf?: boolean;
}

interface ElectronAPI {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  deleteFileOrFolder: (path: string, isDirectory: boolean) => Promise<void>;
  selectFolder: () => Promise<{ folderPath: string; files: File[] } | null>;
  selectFile: () => Promise<string | null>;
  createFolder: (currentPath: string) => Promise<string | null>;
  createFile: (currentPath: string, content: string) => Promise<string | null>;
  getRootDir(): Promise<{ folderTreeData: any[]; directoryPath: string } | null>;
  renameFileOrFolder: (oldPath: string, newPath: string) => Promise<boolean>
  readClipboard: () => Promise<string>;
  writeClipboard: (text: string) => Promise<void>;
  readClipboardFiles: () => Promise<string[]>;
  writeClipboardFiles: (filePaths: string[]) => Promise<void>;
  ipcRenderer: {
    send: (channel: string, data: any) => void;
    on: (channel: string, func: (...args: any[]) => void) => void;
  };
  path: {
    join: (...args: string[]) => string;
    dirname: (p: string) => string;
    basename: (p: string) => string;
  }
  refreshFolder: (path: string) => Promise<{ folderTreeData: TreeNode[]; directoryPath: string }>;
  windowControl: (command: string) => void;
}

interface Window {
  electron: ElectronAPI;
}