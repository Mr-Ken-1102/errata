/**
 * Electron main process. Boots the Errata server (Bun binary sidecar), opens a window
 * pointed at it, and wires auto-updates. In development, set ERRATA_DEV_URL (e.g.
 * http://localhost:7739) to skip the sidecar and load a running `bun run dev` server.
 */
import { app, BrowserWindow, dialog, shell } from 'electron'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { startSidecar, type SidecarHandle } from './sidecar'
import { setupUpdater } from './updater'

// Stable identity for the curated Mr-Ken-1102 distribution. Keep this unchanged after v1.0.
const CURATED_APP_ID = 'io.github.mrken1102.errata'

/**
 * Isolate this curated distribution from upstream/fork desktop installs that also use the
 * human-facing product name "Errata". Configure these paths before Electron creates sessions
 * or windows so stories, Chromium state and updater preferences cannot collide with another
 * distribution's userData directory.
 */
function configureCuratedDesktopIdentity() {
  const userData = join(app.getPath('appData'), 'Mr-Ken-1102', 'Errata')
  const sessionData = join(userData, 'session')
  mkdirSync(userData, { recursive: true })
  mkdirSync(sessionData, { recursive: true })
  app.setPath('userData', userData)
  app.setPath('sessionData', sessionData)
  if (process.platform === 'win32') app.setAppUserModelId(CURATED_APP_ID)
}

configureCuratedDesktopIdentity()

// Warm parchment so the first paint is not a white flash. Matches the bookish palette.
const BACKGROUND_COLOR = '#efe7d6'

let mainWindow: BrowserWindow | null = null
let sidecar: SidecarHandle | null = null
let quitting = false

function resolvePreloadPath(): string {
  const candidates = [
    join(app.getAppPath(), 'preload.cjs'),
    join(process.cwd(), 'dist-electron', 'preload.cjs'),
  ]
  return candidates.find((path) => existsSync(path)) ?? candidates[0]
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 720,
    minHeight: 560,
    backgroundColor: BACKGROUND_COLOR,
    title: 'Errata',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: resolvePreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.once('ready-to-show', () => win.show())

  // Open external links in the user's browser; keep navigation inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.webContents.on('will-navigate', (event, url) => {
    const current = win.webContents.getURL()
    if (current && new URL(url).origin !== new URL(current).origin) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  return win
}

async function boot() {
  const devUrl = process.env.ERRATA_DEV_URL
  let url: string

  if (devUrl) {
    url = devUrl
  } else {
    sidecar = await startSidecar({
      onUnexpectedExit: (code) => {
        if (quitting) return
        dialog.showErrorBox(
          'Errata server stopped',
          `The Errata background server exited unexpectedly (code ${code ?? 'unknown'}). The app will now close.`,
        )
        app.quit()
      },
    })
    url = `http://127.0.0.1:${sidecar.port}`
  }

  mainWindow = createWindow()
  setupUpdater(mainWindow)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  await mainWindow.loadURL(url)
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(boot).catch((err) => {
    dialog.showErrorBox('Errata failed to start', err instanceof Error ? err.message : String(err))
    app.quit()
  })

  app.on('activate', () => {
    // macOS: re-create a window when the dock icon is clicked and none are open.
    if (mainWindow === null && app.isReady()) boot().catch(() => {})
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('before-quit', () => {
    quitting = true
    sidecar?.stop()
    sidecar = null
  })
}
