const {app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain: ipc} = require('electron');
var path = require('path');
const DiscordRPC = require('discord-rpc');
let mainWindow;
let appIcon = null;
const iconPath = path.join(__dirname, 'icon.png');

const rpc = new DiscordRPC.Client({transport: 'ipc'});

function createWindow () {
  mainWindow = new BrowserWindow({frame: false, width: 
    800, height: 630, minWidth: 300, minHeight: 100, icon: "icon.png"});
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  mainWindow.on('minimize', function (event) {
        mainWindow.minimize();
    });

    appIcon = new Tray(iconPath);
    var contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Play/Pause',
        click: function() {
          mainWindow.webContents.executeJavaScript(`AP.playToggle(); AP.plToggle();`);
        }
      },
      { 
        label: 'Random',
        click: function() {
          mainWindow.webContents.executeJavaScript(`AP.random();`);
        }
      },
      { 
        label: 'Next track',
        click: function() {
          mainWindow.webContents.executeJavaScript(`AP.next();`);
        }
      },
      { 
        label: 'Prev track',
        click: function() {
          mainWindow.webContents.executeJavaScript(`AP.prev();`);
        }
      },
      { 
        label: 'Quit',
        click: function() {
            mainWindow.close();
        }
      }
    ]);
    appIcon.setToolTip('YT music player');
    appIcon.on('click', () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });
    mainWindow.on('show', () => {
        appIcon.setHighlightMode('always');
    });
    mainWindow.on('hide', () => {
        appIcon.setHighlightMode('never');
    });  
    appIcon.setContextMenu(contextMenu);

    globalShortcut.register('CommandOrControl+Space', () => {
      mainWindow.webContents.executeJavaScript(`AP.playToggle(); plActive();`);
    });

    globalShortcut.register('CommandOrControl+Right', () => {
      mainWindow.webContents.executeJavaScript(`AP.next();`);
    });

    globalShortcut.register('CommandOrControl+Up', () => {
      mainWindow.webContents.executeJavaScript(`AP.random();`);
    });

    globalShortcut.register('CommandOrControl+Left', () => {
      mainWindow.webContents.executeJavaScript(`AP.prev();`);
    });
}
app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

function createActivity(data) {
  let act = {};
  if(data.status == "playing") {
    act = {
      details: "Listen music",
      state: data.title,
      largeImageKey: "icon",
      largeImageText: "YTMusicPlayer",
      smallImageKey: "play",
      smallImageText: "Playing"
    };
  } else if(data.status == "paused") {
    act = {
      details: "Paused",
      state: data.title,
      largeImageKey: "icon",
      largeImageText: "YTMusicPlayer",
      smallImageKey: "stop",
      smallImageText: "Paused"
    };
  }
  mainWindow.webContents.executeJavaScript(``);
  return act;
}

rpc.login({clientId: "555381698192474133"}).catch(console.error);

ipc.on("rpc", (event, data) => {
  mainWindow.webContents.executeJavaScript(``);
  let activity = createActivity(data);
  rpc.setActivity(activity).then((data) => {
    mainWindow.webContents.executeJavaScript(``);
  }).catch((err) => {
    mainWindow.webContents.executeJavaScript(`console.log('${err}')`);
  });
});

ipc.on("kek", (a) => {
  app.exit(0);
});

