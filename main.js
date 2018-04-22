const electron = require('electron');
const path = require('path');
const url = require('url');

const { app, BrowserWindow, Menu, ipcMain, clipboard } = electron;
const childproc = require('child_process');
// process.env.NODE_ENV = 'production';

/**
  * @mainWindow used to display the cached clipboard, settings, etc.
  *
  */

let mainWindow = null;

const clipboardCache = []; // TODO: I need a class for this not just an array

let clipBoardMonitor = null;

if (process.platform == 'darwin') { // *nix
    clipBoardMonitor = childproc.spawn('pbcopy');
    // proc.stdin.write(data);
    // proc.stdin.end();
} else { // windows
    clipBoardMonitor = childproc.spawn('clip');
    // stdin.end(util.inspect("content_for_the_clipboard"));
}

// clipBoardMonitor.stdin._writableState.writecb = (data) {
//     ipcMain.send('clip:update', data)
// }

/**
  * implmentation? use a node thread to do the job?
  * the only use of the background thread is to monitor the ClipBoard
  * and listen to @accelerator to recall the mainWindow
  *
  */

let backgroundWindow = null;

let isWorkerRunning = false;

const createMainWindow = () => {
    createBackgroundWindow();
    mainWindow = new BrowserWindow( {
        width : 800,
        height : 600
    } );

    mainWindow.loadURL(url.format({
        pathname : path.join(__dirname, 'index.html'), // should define a protocol for this
        protocol : 'file:',
        slashes : true
    }));

    mainWindow.once('ready-to-show', mainWindow.show);

    mainWindow.on('closed', () => {
        // start background threads
        mainWindow = null;
    });

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);

    Menu.setApplicationMenu(mainMenu);
    console.log('main window created');
}

ipcMain.on('clipboard:update', (e, data) => {
    clipboardCache.push(data);
});

ipcMain.on('kdown', (e, data) => {
    console.log('received');
    console.log(e);
    console.log(data);
});

const createBackgroundWindow = () => {
    backgroundWindow = new BrowserWindow( {
        webPreferences: {
            nodeIntegrationInWorker : true
        },
        width : 800,
        height : 600,
    } );

    backgroundWindow.loadURL(url.format({
        pathname : path.join(__dirname, 'backgroundWindow.html'), // should define a protocol for this
        protocol : 'file:',
        slashes : true
    }));

    backgroundWindow.on('closed', () => {
        // start background threads
        mainWindow = null;
    });

    // backgroundWindow.hide();
    // backgroundWindow.setFullScreen(true);

}

// TODO: export from another file and load here
const mainMenuTemplate = [
    {
        label : 'File',
        submenu : [
            {
                label : 'Load File',
                click() {
                    // load clipboard files (I don't know why this, maybe load from other PCs,
                    // a better solution could be using network connection to sync between PCs)
                    // @TODO: also do it on quit, and load back on startup
                },
                accelerator : process.platform == 'darwin' ? 'Command+O' : 'Ctrl+O'
            },
            {
                label : 'Save File',
                click() {
                    // save the clipboard to local
                    // @TODO: load back old file if exists
                },
                accelerator : process.platform == 'darwin' ? 'Command+S' : 'Ctrl+S'
            },
            {
                label : isWorkerRunning ? 'Stop' : 'Start',
                click() {

                },
                accelerator : process.platform == 'darwin' ? 'Command+R' : 'Ctrl+R'
            }
        ]
    },
    {
        label : 'Dev Tools',
        submenu : [
            {
                label : 'Dev Tools',
                accelerator: process.platform == 'darwin' ? 'Command+Alt+J' : 'Ctrl+Alt+J',
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role : 'reload'
            }
        ]
    }
];

if (process.platform == 'darwin') {
    mainMenuTemplate.unshift( {} );
}

app.on('ready', createMainWindow);

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});

app.on('quit', (err) => {
    console.log('app quits due to: ');
    console.log(err);
})
