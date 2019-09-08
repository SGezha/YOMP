const fs = require("fs");
if (!fs.existsSync("database.json")) fs.writeFileSync("./database.json", '{"music":[], "settings": [{"theme": "dark"}]}');
if (!fs.existsSync(`./cache`)) fs.mkdirSync(`./cache`);
const { remote, ipcRenderer: ipc } = require('electron'),
	lowdb = require('lowdb'),
	FileSync = require('lowdb/adapters/FileSync'),
	adapter = new FileSync("database.json"),
	db = lowdb(adapter),
	musicMetdata = require('music-metdata'),
	Jimp = require('jimp');

document.getElementById("theme").href = `css/${db.get("settings").value()[0].theme}.css`;
