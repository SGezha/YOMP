const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain: ipc } = require('electron'),
  ipcMain = require('electron').ipcMain,
  path = require('path'),
  root = app.getPath('userData'),
  DiscordRPC = require('discord-rpc'),
  iconPath = path.join(__dirname, 'assets/icons/icon.png'),
  fs = require('fs'),
  {download} = require("electron-dl"),
  rpc = new DiscordRPC.Client({ transport: 'ipc' });

let mainWindow,
  appIcon = null,
  s = { theme: "dark", key: { play: `ctrl+Space`, random: `ctrl+r`, love: `ctrl+l`, next: `ctrl+Right`, prev: `ctrl+Left`, focus: `ctrl+Up`, mini: `ctrl+Down`, volumeup: `ctrl+=`, volumedown: `ctrl+-`, mute: `ctrl+-` } };

if (fs.existsSync(`${root}/database.json`)) s = JSON.parse(fs.readFileSync(`${root}/database.json`).toString()).settings[0];

app.setAppUserModelId("YOMP");
function createWindow() {
  mainWindow = new BrowserWindow({
    transparent: true, frame: false, width: 1000, height: 700, minWidth: 500, icon: "icon.png", webPreferences: { nodeIntegration: true }
  });
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  mainWindow.on('minimize', function (event) {
    mainWindow.minimize();
  });

  appIcon = new Tray(iconPath);
  var contextMenu = Menu.buildFromTemplate([
    { label: 'Play/Pause', click: function () { mainWindow.webContents.executeJavaScript(`AP.playToggle();`); } },
    { label: 'Random', click: function () { mainWindow.webContents.executeJavaScript(`AP.random();`); } },
    { label: 'Next track', click: function () { mainWindow.webContents.executeJavaScript(`AP.next();`); } },
    { label: 'Prev track', click: function () { mainWindow.webContents.executeJavaScript(`AP.prev();`); } },
    { label: 'Quit', click: function () { mainWindow.close(); } }
  ]);
  appIcon.setToolTip('YT music player');
  appIcon.on('click', () => {
    mainWindow.webContents.executeJavaScript("miniPlayerOff();");
    mainWindow.show();
  });
  mainWindow.on('show', () => {
    appIcon.setHighlightMode('always');
  });
  mainWindow.on('hide', () => {
    appIcon.setHighlightMode('never');
  });
  appIcon.setContextMenu(contextMenu);

  globalShortcut.register(s.key.play, () => {
    mainWindow.webContents.executeJavaScript(`AP.playToggle();`);
  });

  globalShortcut.register(s.key.next, () => {
    mainWindow.webContents.executeJavaScript(`AP.next();`);
  });

  globalShortcut.register(s.key.volumedown, () => {
    mainWindow.show();
    mainWindow.webContents.executeJavaScript(`AP.volumeDown()`);
  });

  globalShortcut.register(s.key.volumeup, () => {
    mainWindow.show();
    mainWindow.webContents.executeJavaScript(`AP.volumeUp()`);
  });

  globalShortcut.register(s.key.random, () => {
    mainWindow.webContents.executeJavaScript(`AP.random();`);
  });

  globalShortcut.register(s.key.mute, () => {
    mainWindow.webContents.executeJavaScript(`AP.mute();`);
  });

  globalShortcut.register(s.key.love, () => {
    mainWindow.webContents.executeJavaScript(`lovethis();`);
  });

  globalShortcut.register(s.key.prev, () => {
    mainWindow.webContents.executeJavaScript(`AP.prev();`);
  });

  globalShortcut.register(s.key.mini, () => {
    mainWindow.show();
    mainWindow.webContents.executeJavaScript('miniPlayer();');
  });

  globalShortcut.register(s.key.focus, () => {
    mainWindow.show();
    mainWindow.webContents.executeJavaScript(`miniPlayerOff();`);
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


ipcMain.on("download", (event, arg) => {
  download(BrowserWindow.getFocusedWindow(), arg.url, arg.properties)
  .then(dl => {
    mainWindow.webContents.send("download complete", {id: arg.id, mas: arg.mas, dir: arg.dir})
  });
});

function createActivity(data) {
  let act = {};
  if (data.status == "playing") {
    act = { details: "Listen music", state: data.title, largeImageKey: "icon", largeImageText: "YOMP", smallImageKey: "play", smallImageText: "Playing" };
  } else if (data.status == "paused") {
    act = { details: "Paused", state: data.title, largeImageKey: "icon", largeImageText: "YOMP", smallImageKey: "stop", smallImageText: "Paused"};
  }
  mainWindow.webContents.executeJavaScript(``);
  return act;
}

rpc.login({ clientId: "555381698192474133" }).catch(console.error);

ipc.on("rpc", (event, data) => {
  mainWindow.webContents.executeJavaScript(``);
  let activity = createActivity(data);
  rpc.setActivity(activity).then((data) => {
    mainWindow.webContents.executeJavaScript(``);
  }).catch((err) => { mainWindow.webContents.executeJavaScript(`console.log('${err}')`); });
});

ipc.on("kek", (a) => {
  app.exit(0);
});

