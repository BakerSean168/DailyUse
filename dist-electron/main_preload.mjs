"use strict";
const electron = require("electron");
const path = require("node:path");
electron.contextBridge.exposeInMainWorld("shared", {
  ipcRenderer: {
    on(...args) {
      const [channel, listener] = args;
      return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
    },
    off(...args) {
      const [channel, ...omit] = args;
      return electron.ipcRenderer.off(channel, ...omit);
    },
    send(...args) {
      const [channel, ...omit] = args;
      return electron.ipcRenderer.send(channel, ...omit);
    },
    invoke(...args) {
      const [channel, ...omit] = args;
      return electron.ipcRenderer.invoke(channel, ...omit);
    }
  },
  path: {
    join(...args) {
      return path.join(...args);
    },
    basename(...args) {
      return path.basename(...args);
    },
    dirname(...args) {
      return path.dirname(...args);
    },
    extname(...args) {
      return path.extname(...args);
    },
    resolve(...args) {
      return path.resolve(...args);
    }
  }
  // You can expose other APTs you need here.
  // ...
});
