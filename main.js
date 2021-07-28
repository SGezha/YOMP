const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain: ipc } = require('electron'),
  path = require('path'),
  root = app.getPath('userData'),
  DiscordRPC = require('discord-rpc'),
  iconPath = path.join(__dirname, 'assets/icons/icon.png'),
  db = require('better-sqlite3-helper'),
  fs = require('fs');

let mainWindow,
  notiWindow,
  preloader,
  rpc = new DiscordRPC.Client({ transport: 'ipc' }),
  embedWindow,
  appIcon = null,
  s = { keyplay: `ctrl+Space`, keyrandom: `ctrl+r`, keylove: `ctrl+l`, keynext: `ctrl+Right`, keyprev: `ctrl+Left`, keyfocus: `ctrl+Up`, keymini: `ctrl+Down`, keyvolumeup: `ctrl+=`, keyvolumedown: `ctrl+-`, keymute: `ctrl+-` };

if (fs.existsSync(`${root}/database.db`)) {
  db({ path: `${root}/database.db`, memory: false, readonly: false, fileMustExist: false, migrate: false });
  s = db().query(`SELECT * from settings`)[0];
} else {
  db({ path: `${root}/database.db`, memory: false, readonly: false, fileMustExist: false, migrate: false });
  db().run(`CREATE TABLE IF NOT EXISTS music(id INTEGER PRIMARY KEY, title VARCHAR(150), bmid VARCHAR(150), category VARCHAR(150), dir VARCHAR(150) , file VARCHAR(999) , icon VARCHAR(150) , full VARCHAR(150) , loved BOOLEAN , videoId VARCHAR(11));`);
  db().run(`CREATE TABLE IF NOT EXISTS status(dataId INTEGER, realId INTEGER, volume INTEGER, loved VARCHAR(5));`);
  db().run(`CREATE TABLE IF NOT EXISTS settings( notiturn VARCHAR(5),notiloved VARCHAR(5) ,notiadd VARCHAR(5) ,keyplay VARCHAR(99) ,keyrandom VARCHAR(99) ,keylove VARCHAR(99) ,keynext VARCHAR(99) ,keyprev VARCHAR(99) ,keyfocus VARCHAR(99) ,keymini VARCHAR(99) ,keyvolumeup VARCHAR(99) ,keyvolumedown VARCHAR(99) ,keymute VARCHAR(99));`);
  db().run(`INSERT INTO settings(notiturn,notiloved,notiadd,keyplay,keyrandom,keylove,keynext,keyprev,keyfocus,keymini,keyvolumeup,keyvolumedown,keymute) VALUES('false','false','false','ctrl+Space','ctrl+r','ctrl+l','ctrl+Right','ctrl+Left','ctrl+Up','ctrl+Down','ctrl+=','ctrl+-','ctrl+0');`);
  db().run(`INSERT INTO status(dataId,realId,volume,loved) VALUES(0, 0, 0.1, false);`);
}

app.setAppUserModelId("YOMP");
function createWindow() {
  preloader = new BrowserWindow({
    show: true, transparent: true, frame: false, width: 250, height: 300, minWidth: 250, icon: "icon.png"
  });
  preloader.loadFile('preloader.html');

  mainWindow = new BrowserWindow({
    show: false, transparent: true, frame: false, width: 1000, height: 700, minWidth: 400, icon: "icon.png", webPreferences: { nodeIntegration: true }
  });
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  mainWindow.on('minimize', function (event) {
    mainWindow.minimize();
  });

  let webContents = mainWindow.webContents;
  webContents.on('did-finish-load', () => {
    webContents.setZoomFactor(1);
    webContents.setVisualZoomLevelLimits(1, 1);
    webContents.setLayoutZoomLevelLimits(0, 0);
  });

  mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options, additionalFeatures) => {
    event.preventDefault();
    Object.assign(options, {
      modal: true,
      parent: mainWindow,
      frame: true,
      width: 600,
      height: 480
    })
    event.newGuest = new BrowserWindow(options)
    event.newGuest.loadURL(url);
  })

  appIcon = new Tray(iconPath);
  var contextMenu = Menu.buildFromTemplate([
    { label: 'Play/Pause', click: function () { mainWindow.webContents.executeJavaScript(`AP.playToggle();`); } },
    { label: 'Mini mode', click: function () { mainWindow.webContents.executeJavaScript(`miniPlayer();`); } },
    { label: 'Random', click: function () { mainWindow.webContents.executeJavaScript(`AP.random();`); } },
    { label: 'Next track', click: function () { mainWindow.webContents.executeJavaScript(`AP.next();`); } },
    { label: 'Prev track', click: function () { mainWindow.webContents.executeJavaScript(`AP.prev();`); } },
    {
      label: 'Quit', click: function () {
        mainWindow.close(); 
        if (embedWindow) embedWindow.close();
        if(embedWindow) embedWindow = null;
      }
    }
  ]);
  appIcon.setToolTip('YT music player');
  appIcon.on('click', () => {
    if (mainWindow.isFocused()) {
      mainWindow.hide();
    } else {
      mainWindow.webContents.executeJavaScript("miniPlayerOff();");
      mainWindow.show();
    }
  });
  appIcon.setContextMenu(contextMenu);

  if (s.keyplay != "") globalShortcut.register(s.keyplay, () => { mainWindow.webContents.executeJavaScript(`AP.playToggle();`); });
  if (s.keynext != "") globalShortcut.register(s.keynext, () => { mainWindow.webContents.executeJavaScript(`AP.next();`); });
  if (s.keyvolumedown != "") globalShortcut.register(s.keyvolumedown, () => { mainWindow.webContents.executeJavaScript(`AP.volumeDown()`); });
  if (s.keyvolumeup != "") globalShortcut.register(s.keyvolumeup, () => { mainWindow.webContents.executeJavaScript(`AP.volumeUp()`); });
  if (s.keyrandom != "") globalShortcut.register(s.keyrandom, () => { mainWindow.webContents.executeJavaScript(`AP.random();`); });
  if (s.keymute != "") globalShortcut.register(s.keymute, () => { mainWindow.webContents.executeJavaScript(`AP.mute();`); });
  if (s.keylove != "") globalShortcut.register(s.keylove, () => { mainWindow.webContents.executeJavaScript(`lovethis();`); });
  if (s.keyprev != "") globalShortcut.register(s.keyprev, () => { mainWindow.webContents.executeJavaScript(`AP.prev();`); });
  if (s.keymini != "") globalShortcut.register(s.keymini, () => { mainWindow.show(); mainWindow.webContents.executeJavaScript('miniPlayer();'); });
  if (s.keyfocus != "") globalShortcut.register(s.keyfocus, () => { mainWindow.show(); mainWindow.webContents.executeJavaScript(`miniPlayerOff();`); });
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

ipc.on("ready", (event, arg) => {
  if (preloader) preloader.close();
  preloader = null;
  mainWindow.show();
});

let notifTimer;

ipc.on("notification", (event, arg) => {
  let html = `<!DOCTYPE html><html lang="en"><head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <meta http-equiv="X-UA-Compatible" content="ie=edge"> <title>YOMP</title> <link rel="stylesheet" href="assets/icons/fontawsome/css/all.min.css"> <style>@font-face{font-family: Torus; font-weight: 400; src: url(../fonts/torus/39F3E3_2_0.eot); src: url(../fonts/torus/39F3E3_2_0.eot?#iefix) format("embedded-opentype"), url(../fonts/torus/39F3E3_2_0.woff2) format("woff2"), url(../fonts/torus/39F3E3_2_0.woff) format("woff"), url(../fonts/torus/39F3E3_2_0.ttf) format("truetype");}:root{--bg: #1b1b1b; --block: #2b2b2b; --block-hover: #3b3b3b; --line: #565656; --btn: rgb(190, 190, 190); --btn-hover: #3e3e3e; --text: #fff; --ap-acive: rgba(0, 0, 0, .1); --pl-lead: #333;}::-webkit-scrollbar{width: 6px;}*::selection, .menu::selection, i::selection{background: transparent !important;}input::selection, .pl-title::selection, .ap-title::selection{background: #DA4453 !important;}html, body{font-family: 'Torus', sans-serif !important; font-size: 20px; color: var(--text); background: none; overflow: hidden; /* background: var(--bg); */ -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility;}.notification{opacity: 0; display: flex; /* justify-content: center; */ align-items: center; overflow: hidden; width: 300px; height: 80px; background: linear-gradient(rgba(0, 0, 0, .8), rgba(0, 0, 0, .8)), url('{{img}}') center center / cover; position: absolute; top: 10px; left: 10px; border-radius: 7px; transform: translateX(-300px); transition: ease 0.5s;}img.notification-img{position: absolute; display: none;}.noti-artist{margin: 0px; overflow: hidden; font-size: 16px; height: 80px; line-height: 20px; text-align: center; padding: 10px; display: flex; justify-content: center; align-items: center;}h5{display: flex; overflow: unset; width: 50px; margin: 10px; padding: 0; height: 100%; align-items: center;}</style></head><body> <div class="notification"> <h5>Now playing</h5> <h1 class="noti-artist mast__text">{{title}}</h1> </div><script>window.onload=()=>{document.querySelector(".notification").style.transform='translateX(0)'; document.querySelector(".notification").style.opacity='0.8'; setTimeout(()=>{document.querySelector(".notification").style.transform='translateX(-400px)';}, 2000)}</script></body></html>`;
  if(arg.body == undefined || arg.img == undefined) return;
  fs.writeFileSync(`${root}/notification.html`, html.split("{{title}}").join(arg.body.toString()).split("{{img}}").join(arg.img.toString()))
  if (!notiWindow) {
    var mainScreen = require('electron').screen.getPrimaryDisplay().workAreaSize;
    notiWindow = new BrowserWindow({
      alwaysOnTop: true, focusable: false, resizable: false, x: 0, y: 0, transparent: true, frame: false, width: 360, height: 120, webPreferences: { nodeIntegration: true }
    });
    notiWindow.setIgnoreMouseEvents(true)
    notiWindow.loadFile(`${root}/notification.html`);
    clearTimeout(notifTimer);
    notifTimer = setTimeout(() => {
      if (notiWindow) notiWindow.close();
      notiWindow = null;
    }, 3000)
  } else {
    notiWindow.loadFile(`${root}/notification.html`);
    clearTimeout(notifTimer);
    notifTimer = setTimeout(() => {
      if (notiWindow) notiWindow.close();
      notiWindow = null;
    }, 3000)
  }
})

ipc.on("embed", (event, arg) => {
  if (!embedWindow) {
    var mainScreen = require('electron').screen.getPrimaryDisplay().workAreaSize;
    embedWindow = new BrowserWindow({
      x: mainScreen.width - 365, y: mainScreen.height - 210, transparent: true, frame: false, width: 355, height: 200, webPreferences: { nodeIntegration: true }
    });
    embedWindow.loadFile('embed.html');

    embedWindow.on('closed', function(){
        embedWindow = null;
        mainWindow.webContents.executeJavaScript("AP.videoOff();");
    });
  } else {
    if (embedWindow) embedWindow.close();
    if (embedWindow) embedWindow = null;
    mainWindow.webContents.executeJavaScript("AP.videoOff();");
  }
})

function createActivity(data) {
  let act = {};
  appIcon.setToolTip(data.title);
  if (data.title == "") {
    act = { details: "Idle", state: "Chill", largeImageKey: "icon", largeImageText: "YOMP", smallImageKey: "stop", smallImageText: "┬┴┬┴┤( ͡° ͜ʖ├┬┴┬┴" };
    return act;
  }
  if (data.status == "playing") {
    act = { details: "Listen music", state: data.title, largeImageKey: "icon", largeImageText: "YOMP", smallImageKey: "play", smallImageText: data.progress };
  } else if (data.status == "paused") {
    act = { details: "Paused", state: data.title, largeImageKey: "icon", largeImageText: "YOMP", smallImageKey: "stop", smallImageText: data.progress };
  }
  return act;
}

DiscordLogin();
function DiscordLogin() {
  rpc = new DiscordRPC.Client({ transport: 'ipc' });
  rpc.login({ clientId: "555381698192474133" }).catch(er => {
    console.log('Reconnect to Discord!');
    setTimeout(() => {
      DiscordLogin();
    }, 5000)
  });
}

ipc.on("rpc", (event, data) => {
  if (!data) return;
  mainWindow.webContents.executeJavaScript(``);
  let activity = createActivity(data);
  rpc.setActivity(activity).then((data) => {
    // mainWindow.webContents.executeJavaScript(`console.log('${JSON.stringify(data)}');`);
  }).catch((err) => { });
});

ipc.on("kek", (a) => {
  app.exit(0);
});
