// ─── electron/main.cjs ────────────────────────────────────────────────────────
// Electron main process — window management, deep links, OAuth
"use strict";

const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");

const PROTOCOL = "betchaknow";
const isDev    = !app.isPackaged;

// ── Single instance lock ──────────────────────────────────────────────────────
// On Windows/Linux, a second launch with the deep-link URL hits here instead of
// firing a new process (since we hold the lock).
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Register betchaknow:// as a URL scheme so the OS redirects OAuth callbacks
// back to this app. In dev mode on Windows the exe path + script path are
// required so the registry entry points at the right process.
if (isDev && process.platform === "win32") {
  app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
    path.resolve(process.argv[1]),
  ]);
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// ── Window ────────────────────────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:     1280,
    height:    820,
    minWidth:  390,
    minHeight: 600,
    backgroundColor: "#08070f",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload:          path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration:  false,
      webSecurity:      true,
    },
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Open any <a target="_blank"> or window.open() links in the system browser,
  // not inside a new Electron window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();

  // macOS: re-create window if the dock icon is clicked with no windows open
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ── Deep-link / OAuth callback ────────────────────────────────────────────────

function handleDeepLink(url) {
  if (!url || !url.startsWith(`${PROTOCOL}://`)) return;
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    mainWindow.webContents.send("oauth-callback", url);
  }
}

// macOS / Linux — deep link fires on the running instance
app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// Windows / Linux — OS launches a second instance; we intercept argv here
app.on("second-instance", (_event, argv) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  const link = argv.find(a => a.startsWith(`${PROTOCOL}://`));
  if (link) handleDeepLink(link);
});

// ── IPC ───────────────────────────────────────────────────────────────────────

// Renderer asks us to open a URL in the system browser (OAuth initiation)
ipcMain.handle("open-external", (_event, url) => shell.openExternal(url));

// Fullscreen / borderless-windowed toggle
ipcMain.handle("set-fullscreen", (_event, value) => {
  if (mainWindow) mainWindow.setFullScreen(value);
});
ipcMain.handle("get-fullscreen", () => mainWindow ? mainWindow.isFullScreen() : false);
