const { app, BrowserWindow } = require('electron')
const path = require('path')
// const dialog = require('electron').dialog;
// var fs = require('fs');
// const homeDir = require('os').homedir();
// var FastPriorityQueue = require('fastpriorityqueue');

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
  
    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()
})

// https://www.electronjs.org/docs/latest/tutorial/quick-start
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
})

/*
    problem.ToUnload.push([1, 2]); //Case 1 unload only

    problem.ToLoad.push(new Container("Bat", 431)); //Case 2 load only

    case 3: load & unload
    problem.ToUnload.push([1, 2]);
    problem.ToLoad.push(new Container("Bat", 532));
    problem.ToLoad.push(new Container("Rat", 6317));

    case 4: load & unload
    problem.ToUnload.push([7,5]);
    problem.ToLoad.push(new Container("Nat", 2543));

    case 5: load & unload
    problem.ToUnload.push([1,4]);
    problem.ToUnload.push([1,5]);
    problem.ToLoad.push(new Container("Nat", 153));
    problem.ToLoad.push(new Container("Rat", 2321));
*/
