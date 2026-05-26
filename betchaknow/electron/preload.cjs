// ─── electron/preload.cjs ─────────────────────────────────────────────────────
// Runs in the renderer context but with Node access.
// Exposes a minimal, typed API surface to the renderer via contextBridge —
// nothing else from Node/Electron is accessible in the page.
"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  /** True when running inside Electron (always). */
  isElectron: true,

  /**
   * Open a URL in the OS default browser (used for OAuth sign-in).
   * @param {string} url
   */
  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  /**
   * Register a callback that fires when the OS sends an OAuth deep link
   * back to the app (betchaknow://oauth?code=...).
   * @param {(url: string) => void} cb
   */
  onOAuthCallback: (cb) =>
    ipcRenderer.on("oauth-callback", (_event, url) => cb(url)),

  setFullscreen: (value) => ipcRenderer.invoke("set-fullscreen", value),
  getFullscreen: ()      => ipcRenderer.invoke("get-fullscreen"),
});
