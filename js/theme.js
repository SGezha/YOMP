const fs = require("fs");
if (!fs.existsSync("database.json")) fs.writeFileSync("./database.json", '{"music":[], "settings": [{"theme": "dark", "key": { "play": "CommandOrControl+Space", "random": "CommandOrControl+r", "love": "CommandOrControl+l", "next": "CommandOrControl+Right", "prev": "CommandOrControl+Left", "focus": "CommandOrControl+Up", "mini": "CommandOrControl+Down", "volumeup": "CommandOrControl+=", "volumedown": "CommandOrControl+-", "mute": "CommandOrControl+-"}}]}');
if (!fs.existsSync(`./cache`)) {
	fs.mkdirSync(`./cache`);
	fs.writeFileSync("./cache/cache.json", '{"data":[]}');
}
const { remote, ipcRenderer: ipc } = require('electron'),
	lowdb = require('lowdb'),
	FileSync = require('lowdb/adapters/FileSync'),
	db = lowdb(new FileSync("database.json")),
	cache = lowdb(new FileSync("./cache/cache.json")),
	NodeID3 = require('node-id3'),
	Jimp = require('jimp');

document.getElementById("theme").href = `css/${db.get("settings").value()[0].theme}.css`;