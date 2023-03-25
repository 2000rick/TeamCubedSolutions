const { app, BrowserWindow, ipcMain } = require('electron')
const prompt = require('electron-prompt');
const { homedir } = require('os');
const path = require('path')

const registerIPC = () => {
  ipcMain.handle("log", (_) => {
    if (process.platform === 'darwin' || process.platform === "linux") {
      return `${homedir()}/Documents/`;
    } else {
      return `${homedir()}\\Documents\\`;
    }
  });
  ipcMain.handle("manifest", (_) => {
    if (process.platform === 'darwin' || process.platform === "linux") {
      return `${homedir()}/Desktop/`;
    } else {
      return `${homedir()}\\Desktop\\`;
    }
  });
  ipcMain.handle("delimiter", (_) => {
    if (process.platform === 'darwin' || process.platform === "linux") {
      return "/";
    } else {
      return "\\";
    }
  })
  ipcMain.handle("prompt", (_, promptOptions) => {
    return prompt(promptOptions);
  });
}

const createWindow = () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true,
        contextIsolation: false
      }
    })
    win.maximize();
    win.loadFile('index.html')
}

app.whenReady().then(() => {
    registerIPC();
    createWindow()
})

// https://www.electronjs.org/docs/latest/tutorial/quick-start
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
})
