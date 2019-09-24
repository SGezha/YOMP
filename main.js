const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain: ipc } = require('electron'),
	ipcMain = require('electron').ipcMain,
	path = require('path'),
	root = app.getPath('userData'),
	DiscordRPC = require('discord-rpc'),
	iconPath = path.join(__dirname, 'assets/icons/icon.png'),
	db = require('better-sqlite3-helper'),
	fs = require('fs'),
	{ download } = require("electron-dl"),
	rpc = new DiscordRPC.Client({ transport: 'ipc' }),
	child = require('child_process').execFile;

let mainWindow,
	notiWindow,
	preloader,
	appIcon = null,
	s = { keyplay: `ctrl+Space`, keyrandom: `ctrl+r`, keylove: `ctrl+l`, keynext: `ctrl+Right`, keyprev: `ctrl+Left`, keyfocus: `ctrl+Up`, keymini: `ctrl+Down`, keyvolumeup: `ctrl+=`, keyvolumedown: `ctrl+-`, keymute: `ctrl+-` };

if (fs.existsSync(`${root}/database.db`)) {
	db({path: `${root}/database.db`, memory: false, readonly: false, fileMustExist: false, migrate: false});
	s = db().query(`SELECT * from settings`)[0];
} else {
	db({path: `${root}/database.db`, memory: false, readonly: false, fileMustExist: false, migrate: false});
  db().run(`CREATE TABLE IF NOT EXISTS music(id INTEGER PRIMARY KEY, title VARCHAR(150), dir VARCHAR(150) , file VARCHAR(999) , icon VARCHAR(150) , full VARCHAR(150) , loved BOOLEAN , videoId VARCHAR(11));`);
  db().run(`CREATE TABLE IF NOT EXISTS status(dataId INTEGER, realId INTEGER);`);
  db().run(`CREATE TABLE IF NOT EXISTS settings( notiturn VARCHAR(5),notiloved VARCHAR(5) ,notiadd VARCHAR(5) ,keyplay VARCHAR(99) ,keyrandom VARCHAR(99) ,keylove VARCHAR(99) ,keynext VARCHAR(99) ,keyprev VARCHAR(99) ,keyfocus VARCHAR(99) ,keymini VARCHAR(99) ,keyvolumeup VARCHAR(99) ,keyvolumedown VARCHAR(99) ,keymute VARCHAR(99));`);
	db().run(`INSERT INTO settings(notiturn,notiloved,notiadd,keyplay,keyrandom,keylove,keynext,keyprev,keyfocus,keymini,keyvolumeup,keyvolumedown,keymute) VALUES('false','false','false','ctrl+Space','ctrl+r','ctrl+l','ctrl+Right','ctrl+Left','ctrl+Up','ctrl+Down','ctrl+=','ctrl+-','ctrl+0');`);
	db().run(`INSERT INTO status(dataId,realId) VALUES(0, 0);`);
}

app.setAppUserModelId("YOMP");
function createWindow() {
	preloader = new BrowserWindow({
		show: true, backgroundColor: "#1b1b1b", frame: false, width: 250, height: 300, minWidth: 250, icon: "icon.png"
	});
	preloader.loadFile('preloader.html');

	mainWindow = new BrowserWindow({
		show: false, backgroundColor: "#1b1b1b", frame: false, width: 1000, height: 700, minWidth: 500, icon: "icon.png", webPreferences: { nodeIntegration: true }
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
	})

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

ipcMain.on("youtube", (event, arg, obj) => {
	download(BrowserWindow.getFocusedWindow(), arg.url, arg.properties)
	.then(dl => {
		mainWindow.webContents.send("ytcomplete", arg.obj);
	})
	.catch(er => {
		mainWindow.webContents.send("yterror", arg.obj);
	})
});

ipcMain.on("update", (event, arg) => {
	download(BrowserWindow.getFocusedWindow(), arg.url, arg.properties)
		.then(dl => {
			mainWindow.webContents.send("update complete");
			child(arg.properties.directory + "/update.exe", function (err, data) {
				if (err) { console.error(err); return; }
				if (mainWindow) mainWindow.close();
				mainWindow = null;
			});
		});
})

ipcMain.on("ready", (event, arg) => {
	if (preloader) preloader.close();
	preloader = null;
	mainWindow.show();
});

// ipcMain.on("notification", (event, arg) => {
//   fs.writeFileSync('notify.html', `<style>body{color: white;}</style><h1>${arg.title}</h1> <p>${arg.body}</p>`)
//   if(!notiWindow) {
//     var mainScreen = require('electron').screen.getPrimaryDisplay().workAreaSize;
//     notiWindow = new BrowserWindow({
//       alwaysOnTop: true, x: mainScreen.width-370, y: mainScreen.height-130, transparent: true, frame: false, width: 360, height: 120, webPreferences: { nodeIntegration: true }
//     });
//     notiWindow.loadFile('notify.html');
//   } else {
//     notiWindow.loadFile('notify.html');
//   }
// })

function createActivity(data) {
	let act = {};
	if (data.status == "playing") {
		act = { details: "Listen music", state: data.title, largeImageKey: "icon", largeImageText: "YOMP", smallImageKey: "play", smallImageText: "Playing" };
	} else if (data.status == "paused") {
		act = { details: "Paused", state: data.title, largeImageKey: "icon", largeImageText: "YOMP", smallImageKey: "stop", smallImageText: "Paused" };
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