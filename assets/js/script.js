const fs = require("fs");
let root = require('electron').remote.app.getPath('userData').split("\\").join("/");
if (!fs.existsSync(`${root}/database.json`)) fs.writeFileSync(`${root}/database.json`, '{"music":[{"id": 0,"title": "AKINO with bless4 - cross the line","file": "http://osuck.net/AKINO%20with%20bless4%20-%20cross%20the%20line%20.mp3","icon": "http://osuck.net/AKINO%20with%20bless4%20-%20cross%20the%20line%20.jpg","loved": false}], "settings": [{"noti": {"turn": false, "loved": false, "add": false}, "key": { "play": "ctrl+Space", "random": "ctrl+r", "love": "ctrl+l", "next": "ctrl+Right", "prev": "ctrl+Left", "focus": "ctrl+Up", "mini": "ctrl+Down", "volumeup": "ctrl+=", "volumedown": "ctrl+-", "mute": "ctrl+0"}}]}');
if (!fs.existsSync(`${root}/images`)) {
	fs.mkdirSync(`${root}/images`);
	fs.writeFileSync(`${root}/images/cache.json`, '{"data":[]}');
}
if (!fs.existsSync(`${root}/full`)) fs.mkdirSync(`${root}/full`);

const { remote, ipcRenderer: ipc } = require('electron'),
	ipcRenderer = require('electron').ipcRenderer,
	lowdb = require('lowdb'),
	FileSync = require('lowdb/adapters/FileSync'),
	db = lowdb(new FileSync(`${root}/database.json`)),
	cache = lowdb(new FileSync(`${root}/images/cache.json`)),
	NodeID3 = require('node-id3'),
	Jimp = require('jimp'),
	os = require('os');

let musicSelectedId = 0,
	isLoaded = false,
	loaded = 0,
	mini = false,
	fullscreen = 0,
	isLoved = false,
	ping = false;

window.onload = function () {
	start();
	fixmusic();
	AP.plToggle();
	ipcRenderer.send('ready');
	loadSettings();
	checkUpdate(true);
};

ipcRenderer.on("update complete", (event, arg) => {
	notify("Update", `Download update complete :>`);
});

function checkUpdate(auto) {
	let ver = JSON.parse(fs.readFileSync(`${__dirname}/package.json`).toString()).version;
	axios.get(`https://4kc-version.glitch.me/yomp`)
		.then(res => {
			let r = res.data;
			if (ver != r.ver && auto) {
				notify("Update", `New ${r.ver} version available to download, check settings :3`);
			}
			if (ver == r.ver && !auto) {
				notify("Update", `You use latest version :P`);
			}
			if (ver != r.ver && !auto) {
				notify("Update", `New version ${r.ver} started to download c:`);
				let osp = os.platform(),
					arch = os.arch().split("x").join("");
				if (osp.indexOf("win") > -1) osp = "win";
				ipcRenderer.send("update", { url: r[osp + arch], properties: { directory: `${root}/cache`, filename: `update.exe` } });
			}
		})
}

function clearPl() {
	cache.set("data", []).write();
	db.set("music", [{ "id": 0, "title": "AKINO with bless4 - cross the line", "file": "http://osuck.net/AKINO%20with%20bless4%20-%20cross%20the%20line%20.mp3", "icon": "http://osuck.net/AKINO%20with%20bless4%20-%20cross%20the%20line%20.jpg", "loved": false }]).write();
	refresh();
}

function notify(title, body) {
	if (!db.get("settings").value()[0].noti.turn) {
		let icon = "assets/icons/icon.png";
		if (db.get("settings").value()[0].noti.loved && title.toLocaleLowerCase().indexOf("loved") > -1) return;
		if (db.get("settings").value()[0].noti.add && title.toLocaleLowerCase().indexOf("success") > -1) return;
		if (title.toLocaleLowerCase().indexOf("loved") > -1) icon = "assets/icons/notif-icon/i_loved.png";
		if (title.toLocaleLowerCase().indexOf("now") > -1) icon = "assets/icons/notif-icon/i_np.png";
		if (title.toLocaleLowerCase().indexOf("success") > -1) icon = "assets/icons/notif-icon/i_add.png";
		if (title.toLocaleLowerCase().indexOf("error") > -1) icon = "assets/icons/notif-icon/i_error.png";
		if (title.toLocaleLowerCase().indexOf("update") > -1) icon = "assets/icons/notif-icon/i_up.png";
		if (body.length > 60) body = body.substring(0, 57) + "...";
		new Notification(title, { silent: true, silent: true, body: body, icon: icon })
		// ipcRenderer.send("notification", {title: title, body: body})
	}
}

function setsSave() {
	db.set('settings', [{
		noti: { turn: document.getElementById('noti-turn').checked, loved: document.getElementById('noti-loved').checked, add: document.getElementById('noti-youtube').checked },
		key: { play: document.getElementById('key-toggle').value, random: document.getElementById('key-random').value, love: document.getElementById('key-love').value, next: document.getElementById('key-next').value, prev: document.getElementById('key-prev').value, focus: document.getElementById('key-minioff').value, mini: document.getElementById('key-mini').value, volumeup: document.getElementById('key-volup').value, volumedown: document.getElementById('key-voldown').value, mute: document.getElementById('key-mute').value }
	}]).write();
	remote.app.relaunch();
	remote.app.exit();
}

function setsToggle() {
	$("#settings").toggleClass('openmodal');
	$(".menu-left").removeClass('act-menu');
	$(".shadow").hide();
}

function infoToggle() {
	$("#info").toggleClass('openmodal');
	$(".menu-left").removeClass('act-menu');
	$(".shadow").hide();
}

function openMenu() {
	if (document.getElementsByClassName('menu-left')[0].className.indexOf('act-menu') == -1) {
		document.getElementsByClassName('menu-left')[0].classList.add('act-menu');
		document.getElementsByClassName('shadow')[0].style.display = "block";
	} else {
		document.getElementsByClassName('menu-left')[0].classList.remove('act-menu');
		document.getElementsByClassName('shadow')[0].style.display = "none";
	}
}

function hidetray() {
	remote.getCurrentWindow().minimize();
}

document.getElementById("search").onchange = function (e) {
	if (document.getElementById('pl').classList.length == 2) {
		app.search();
	} else {
		let base = db.get("music").value();
		if (isLoved) {
			base = [];
			db.get("music").value().forEach(m => {
				if (m.loved == true) base.push(m);
			})
		}
		if (base.length == 0) return;
		if (document.getElementById("pl").classList.length == 2) return;
		let result = [];
		let input = document.getElementById('search');
		var l = input.value.length;
		if (l > 0) {
			for (var i = 0; i < base.length; i++) {
				let title = base[i].title;
				if (Array.isArray(base[i].title)) title = base[i].title[0];
				if (title.toLowerCase().match(input.value.toLowerCase())) {
					result.push(base[i]);
				}
			}
			document.getElementById('pl').parentNode.removeChild(document.getElementById('pl'));
			AP.init({
				playList: result
			});
			loaded = 0;

			document.getElementById('pl').classList.remove("hide");
		} else {
			refresh();
			document.getElementById('pl').classList.remove("hide");
		}
	}
};

function winowClose() {
	window.close();
}

function fixmusic() {
	var masMusic = db.get("music").value();
	masMusic.forEach((m) => {
		if (m.videoId == undefined) return;
		$.get("https://images" + ~~(Math.random() * 33) + "-focus-opensocial.googleusercontent.com/gadgets/proxy?container=none&url=https%3A%2F%2Fwww.youtube.com%2Fget_video_info%3Fvideo_id%3D" + m.videoId, function (data) {
			if (data.indexOf("errorcode=150") > -1) return notify('Error', 'Copyright');
			var data = parse_str(data),
				streams = (data.url_encoded_fmt_stream_map + ',' + data.adaptive_fmts).split(',');
			$.each(streams, function (n, s) {
				var stream = parse_str(s),
					itag = stream.itag * 1,
					quality = false;
				switch (itag) {
					case 139:
						quality = "48kbps";
						break;
					case 140:
						quality = "128kbps";
						break;
					case 141:
						quality = "256kbps";
						break;
				}
				if (quality) {
					db.get("music").find({ videoId: m.videoId }).assign({
						file: stream.url
					}).write();
				}
			});
		});
	})
	document.getElementById('ap').style.transform = "translateY(0px)";
	refresh();
}

function maxsize() {
	if (fullscreen == 0) {
		remote.getCurrentWindow().maximize();
		fullscreen++;
		document.getElementsByClassName("maximize")[0].innerHTML = `<i style="color: var(--text);" class="fas fa-square"></i>`;
	} else {
		remote.getCurrentWindow().unmaximize();
		fullscreen = 0;
		document.getElementsByClassName("maximize")[0].innerHTML = `<i style="color: var(--text);" class="far fa-square"></i>`;
	}
}


function random() {
	var mas = shuffle(db.get("music").value());
	let result = [];
	db.set('music', []).write();
	mas.forEach((m, ind) => {
		let obj = {
			id: ind,
			title: m.title,
			icon: m.icon,
			videoId: m.videoId,
			file: m.file
		}
		result.push(m);
	});
	db.set('music', result).write();
	loaded = 0;
	refresh();

	document.getElementById('pl').classList.remove("hide");
}

function searchbtn() {
	app.search();
	document.getElementById(`app`).style.display = "block";
	document.getElementById('pl').classList.add("hide");
}

async function addMusicFolder() {
	let dir = await remote.dialog.showOpenDialog({ title: 'Select Music Folder', properties: ['openDirectory'] });
	fs.readdir(dir[0], function (err, items) {
		loadMusic();
		items.forEach((i, ind) => {
			setTimeout(() => {
				if (ind + 1 == items.length) loadMusic();
				if (i.toLocaleLowerCase().indexOf(".mp3") > -1) {
					if (db.get("music").find({ file: `${dir[0]}/${i}` }).value() == undefined) {
						var id = 0;
						let metadata = NodeID3.read(`${dir[0]}/${i}`);
						let img = undefined;
						let title = i.toLocaleLowerCase().split(".mp3");
						if (metadata.title != undefined && metadata.artist != undefined) title = `${metadata.artist} - ${metadata.title}`;
						if (db.get("music").value().length != undefined) {
							id = db.get("music").value().length;
						}
						if (metadata.image != undefined && metadata.image.imageBuffer != undefined) {
							fs.writeFileSync(`${root}/images/${title}.jpg`, metadata.image.imageBuffer, 'binary');
							img = encodeURI(`${root}/images/${title}.jpg`);
						}
						db.get("music").push({
							id: id,
							title: title,
							icon: img,
							file: `${dir[0]}/${i}`,
							loved: false
						}).write();
						document.getElementById("load-progress").innerHTML = `<div class="textload">${title}</div> <span> ${ind + 1}/${items.length}</span>`;
					}
				}
			}, 500 * ind)
		})
	});
}

async function addosu() {
	let dir = await remote.dialog.showOpenDialog({ title: 'Select osu!/songs Folder', properties: ['openDirectory'] });
	fs.readdir(dir[0], function (err, items) {
		loadMusic();
		checkDir(0, items, dir[0])
	});
}

function checkDir(ind, mas, dir) {
	let i = mas[ind];
	if (ind + 1 == mas.length) return loadMusic();
	if (cache.get("data").find({ id: `${dir}/${i}` }).value() == undefined) {
		cache.get("data").push({ id: `${dir}/${i}` }).write();
		if (i.indexOf(".") == -1) {
			fs.readdir(`${dir}/${i}`, function (err, files) {
				let obj = {};
				obj.img = undefined;
				if (files) {
					files.forEach(f => {
						if (f.indexOf(".osu") > -1) {
							obj.title = f.split("[")[0];
							if (obj.title.indexOf("(") > -1) obj.title = obj.title.substring(0, obj.title.indexOf("("));
						}
						if (f.indexOf(".mp3") > -1) {
							obj.file = `${dir}/${i}/${f}`;
						}
						if (f.indexOf(".jpg") > -1 || f.indexOf(".png") > -1) {
							obj.img = `${dir}/${i}/${f}`;
						}
					})
					if (obj.title != undefined && obj.file != undefined && obj.img != undefined) {
						Jimp.read(obj.img)
							.then(lenna => {
								document.getElementById("load-progress").innerHTML = `<div class="textload">${obj.title}</div> <span> ${ind + 1}/${mas.length}</span>`;
								if (db.get("music").find({ file: obj.file }).value() == undefined) {
									var id = 0;
									if (db.get("music").value().length != undefined) {
										id = db.get("music").value().length;
									}
									db.get("music").push({
										id: id,
										title: obj.title,
										file: `${obj.file}`,
										icon: `${root}/images/${obj.title}.jpg`,
										full: obj.img,
										loved: false
									}).write();
									checkDir(ind + 1, mas, dir);
									return lenna
										.quality(80)
										.cover(500, 60, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE)
										.write(`${root}/images/${obj.title}.jpg`);
								} else {
									checkDir(ind + 1, mas, dir);
								}
							})
							.catch(err => {
								console.error(err);
								checkDir(ind + 1, mas, dir);
							});
					} else {
						checkDir(ind + 1, mas, dir);
					}
				} else {
					checkDir(ind + 1, mas, dir);
				}
			})
		} else {
			checkDir(ind + 1, mas, dir);
		}
	} else { checkDir(ind + 1, mas, dir); }
}

async function exportLoved() {
	let dir = await remote.dialog.showOpenDialog({ title: 'Select osu!/songs Folder', properties: ['openDirectory'] });
	let exportLoved = [];
	db.get("music").value().forEach(m => {
		if (m.loved) exportLoved.push(m);
	});
	if(dir[0]) {
		loadMusic();
		exportProces(0, exportLoved, dir);
	}
}

async function exportAll() {
	let dir = await remote.dialog.showOpenDialog({ title: 'Select osu!/songs Folder', properties: ['openDirectory'] });
	if(dir[0]) {
		loadMusic();
		exportProces(0, db.get("music").value(), dir);
	}
}

ipcRenderer.on("download complete", (event, arg) => {
	exportProces(arg.id + 1, arg.mas, arg.dir);
});

function exportProces(id, mas, dir) {
	if (id == mas.length) return loadMusic();
	let e = mas[id];
	if (e.videoId) {
		document.getElementById("load-progress").innerHTML = `<div class="textload">${e.title}</div> <span> ${id + 1}/${mas.length}</span>`;
		ipcRenderer.send("download", { url: e.file, properties: { directory: dir[0], filename: `${e.title}.mp3` }, id: id, mas: mas, dir: dir });
	} else {
		document.getElementById("load-progress").innerHTML = `<div class="textload">${e.title}</div> <span> ${id + 1}/${mas.length}</span>`;
		fs.copyFile(e.file, `${dir[0]}/${e.title}.mp3`, (err) => {
			if (err) throw err;
			if (e.full) {
				Jimp.read(e.full)
					.then(lenna => {
						lenna.quality(80).cover(128, 128, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE).write(`${root}/full/${e.title}.jpg`);
						let metadata = {
							title: e.title.split(" - ")[1],
							artist: e.title.split(" - ")[0],
							APIC: `${root}/full/${e.title}.jpg`
						}
						NodeID3.update(metadata, `${dir[0]}/${e.title}.mp3`, function (err, buffer) {
							exportProces(id + 1, mas, dir);
						})
					})
					.catch(err => {
						console.error(err);
						exportProces(id + 1, mas, dir);
					});
			} else {
				exportProces(id + 1, mas, dir);
			}
		});
	}
}

function offKey(el) {
	document.getElementById(el.getAttribute('dlya')).value = "";
}

for (let i = 0; i < document.getElementsByClassName('input-keys').length; i++) {
	document.getElementsByClassName('input-keys')[i].onkeyup = function (evt) {
		document.getElementsByClassName('check-key-input')[i].checked = false;
		if (evt.keyCode == 16) return;
		if (evt.key == "ArrowUp") {
			document.getElementsByClassName('input-keys')[i].value = "ctrl+Up";
		} else if (evt.key == "ArrowDown") {
			document.getElementsByClassName('input-keys')[i].value = "ctrl+Down";
		} else if (evt.key == "ArrowLeft") {
			document.getElementsByClassName('input-keys')[i].value = "ctrl+Left";
		} else if (evt.key == "ArrowRight") {
			document.getElementsByClassName('input-keys')[i].value = "ctrl+Right";
		} else if (evt.keyCode == 32) {
			document.getElementsByClassName('input-keys')[i].value = "ctrl+Space";
		} else {
			document.getElementsByClassName('input-keys')[i].value = "ctrl+" + evt.key;
		}
	}
}

function start() {
	var AudioPlayer = (function () {
		var player = document.getElementById('ap'),
			playBtn, prevBtn, nextBtn, plBtn, repeatBtn, volumeBtn, progressBar, preloadBar, curTime, durTime, trackTitle, audio, index = 0,
			playList, volumeBar, volumeLength, repeating = false,
			seeking = false,
			rightClick = false,
			apActive = false,
			pl, plLi, settings = {
				volume: 0.1,
				autoPlay: false,
				notification: true,
				playList: []
			};

		function init(options) {
			settings = extend(settings, options);
			playList = settings.playList;
			renderPL();
			if (!('classList' in document.documentElement)) {
				return false;
			}
			if (apActive || player === null) {
				return;
			}
			playBtn = player.querySelector('.ap-toggle-btn');
			prevBtn = player.querySelector('.ap-prev-btn');
			nextBtn = player.querySelector('.ap-next-btn');
			repeatBtn = player.querySelector('.ap-repeat-btn');
			volumeBtn = player.querySelector('.ap-volume-btn');
			plBtn = document.querySelector('.ap-playlist-btn');
			curTime = player.querySelector('.ap-time--current');
			durTime = player.querySelector('.ap-time--duration');
			trackTitle = player.querySelector('.ap-title');
			progressBar = player.querySelector('.ap-bar');
			preloadBar = player.querySelector('.ap-preload-bar');
			volumeBar = player.querySelector('.ap-volume-bar');
			playBtn.addEventListener('click', playToggle, false);
			volumeBtn.addEventListener('click', volumeToggle, false);
			repeatBtn.addEventListener('click', repeatToggle, false);
			progressBar.parentNode.parentNode.addEventListener('mousedown', handlerBar, false);
			progressBar.parentNode.parentNode.addEventListener('mousemove', seek, false);
			document.documentElement.addEventListener('mouseup', seekingFalse, false);
			volumeBar.parentNode.parentNode.addEventListener('mousedown', handlerVol, false);
			volumeBar.parentNode.parentNode.addEventListener('mousemove', setVolume);
			document.documentElement.addEventListener('mouseup', seekingFalse, false);
			prevBtn.addEventListener('click', prev, false);
			nextBtn.addEventListener('click', next, false);
			apActive = true;
			plBtn.addEventListener('click', plToggle, false);
			audio = new Audio();
			audio.volume = settings.volume;
			if (isEmptyList()) {
				empty();
				return;
			}
			audio.src = playList[index].file;
			audio.preload = 'auto';
			trackTitle.innerHTML = playList[index].title;
			ipc.send("rpc", {
				status: "playing",
				title: playList[index].title
			});
			volumeBar.style.height = audio.volume * 100 + '%';
			volumeLength = volumeBar.css('height');
			audio.addEventListener('error', error, false);
			audio.addEventListener('timeupdate', update, false);
			audio.addEventListener('ended', doEnd, false);
			if (settings.autoPlay) {
				audio.play();
				playBtn.classList.add('playing');
				plLi[index].classList.add('pl-current');
			}
		}

		function renderPL() {
			var html = [];
			playList.forEach(function (item, i) {
				let fav = `<i onclick="love(${item.id}, this);" class="fas fa-heart owo"></i>`;
				if (db.get("music").find({ title: item.title }).value().loved == true) fav = `<i onclick="love(${item.id}, this);" class="fas fa-heart owo fav"></i>`;
				let type = '<svg fill="#fff" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">' + '<path d="M0 0h24v24H0z" fill="none"/>' + '<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>' + '</svg>';
				if (item.file.indexOf("osu") > -1) type = `<img class="pl-img" src="assets/icons/osu.svg">`;
				if (item.videoId != undefined) type = `<i class="fab fa-youtube"></i>`;
				if (i < 80) {
					html.push(`<li class="music-el" real-id="${item.id}" data-track="${i}"><div class="pog" real-id="${item.id}" data-track="${i}"><div class="left"><div class="pl-number"><div class="pl-count">${type}</div><div class="pl-playing"><i class="fas fa-play"></i></div></div></div><div class="center" real-id="${item.id}" data-track="${i}"><div class="pl-title">${item.title}</div></div><div class="right" real-id="${item.id}" data-track="${i}"><div class="music-id">${i + 1}/${playList.length}</div>${fav}<i class="fas fa-trash pl-remove pl-del"></i></div><div class="music-background" style="background: url('${item.icon}') center center / cover;"></div></div></li>`);
				} else {
					html.push(`<li class="music-el" style="display: none" real-id="${item.id}" data-track="${i}"><div class="pog" real-id="${item.id}" data-track="${i}"><div class="left"><div class="pl-number"><div class="pl-count">${type}</div><div class="pl-playing"><i class="fas fa-play"></i></div></div></div><div class="center" real-id="${item.id}" data-track="${i}"><div class="pl-title">${item.title}</div></div><div class="right" real-id="${item.id}" data-track="${i}"><div class="music-id">${i + 1}/${playList.length}</div>${fav}<i class="fas fa-trash pl-remove pl-del"></i></div><div class="music-background" style="background: url('${item.icon}') center center / cover;"></div></div></li>`);
				}
			});
			pl = create('div', {
				'className': 'pl-container hide',
				'id': 'pl',
				'innerHTML': !isEmptyList() ? '<ul class="pl-list">' + html.join('') + '</ul>' : '<div class="pl-empty"><img src="https://image.flaticon.com/icons/svg/1679/1679882.svg" class="emss" /><span>PlayList is empty</span></div>'
			});
			document.getElementById('app').parentNode.insertBefore(pl, document.getElementById('app').nextSibling);
			plLi = pl.querySelectorAll('li');
			pl.addEventListener('click', listHandler, false);
		}

		function listHandler(evt) {
			evt.preventDefault();
			let aw = evt.target.className;
			if (aw == 'pl-title') {
				let current = parseInt(evt.target.parentNode.getAttribute('data-track'), 10);
				index = current;
				audio.readyState = 0;
				plActive();
				play();
			} else {
				let target = evt.target;
				if (target.className === 'fas fa-heart owo' || target.className === 'fas fa-heart owo fav' || target.className == 'right') return;
				while (target.className !== pl.className) {
					if (target.className === 'pl-remove' || target.className === 'pl-del' || target.className === 'right') {
						db.get("music").remove({ id: parseInt(target.parentNode.getAttribute('real-id'), 10) }).write();
						if (!isLoved) { refresh(); } else { openloved(); }
						document.getElementById('pl').classList.remove('hide');
						if (!audio.paused) {
							if (isDel === index) {
								play();
							}
						} else {
							if (isEmptyList()) {
								empty();
							} else {
								audio.src = playList[index].file;
								document.title = trackTitle.innerHTML = playList[index].title;
								progressBar.style.width = 0;
							}
						}
						if (isDel < index) {
							index--;
						}
						return;
					}
					target = target.parentNode;
				}
			}
		}

		function plActive() {
			if (audio.paused) {
				plLi[index].classList.remove('pl-current');
				return;
			}
			for (var i = 0, len = plLi.length; len > i; i++) {
				plLi[i].classList.remove('pl-current');
			}
			plLi[index].classList.add('pl-current');
		}

		function error() {
			!isEmptyList() && next();
		}

		function play() {
			index = (index > playList.length - 1) ? 0 : index;
			if (index < 0) index = playList.length - 1;
			if (isEmptyList()) {
				empty();
				return;
			}
			audio.src = playList[index].file;
			audio.preload = 'auto';
			document.title = trackTitle.innerHTML = playList[index].title;
			audio.play();
			playBtn.classList.add('playing');
			plActive();
			ipc.send("rpc", {
				status: "playing",
				title: playList[index].title
			});
		}

		function prev() {
			index = index - 1;
			if (mini == true && ping > 1) {
				document.getElementById('hide-progres').style.width = `100%`;
				ping = 5;
			}
			let title = document.getElementsByClassName('pl-title')[index].innerHTML;
			notify(`Now playing`, title)
			play();
		}

		function next() {
			index = index + 1;
			if (mini == true && ping > 1) {
				document.getElementById('hide-progres').style.width = `100%`;
				ping = 5;
			}
			let title = document.getElementsByClassName('pl-title')[index].innerHTML;
			notify(`Now playing`, title)
			play();
		}

		function random() {
			index = getRandomInt(0, db.get("music").value().length);
			if (mini == true && ping > 1) {
				document.getElementById('hide-progres').style.width = `100%`;
				ping = 5;
			}
			let title = document.getElementsByClassName('pl-title')[index].innerHTML;
			notify(`Now playing`, title)
			play();
		}

		function isEmptyList() {
			return playList.length === 0;
		}

		function empty() {
			audio.pause();
			audio.src = '';
			trackTitle.innerHTML = 'queue is empty';
			curTime.innerHTML = '--';
			durTime.innerHTML = '--';
			progressBar.style.width = 0;
			preloadBar.style.width = 0;
			playBtn.classList.remove('playing');
			pl.innerHTML = '<div class="pl-empty">PlayList is empty</div>';
		}


		function playToggle() {
			if (isEmptyList()) {
				return;
			}
			if (audio.paused) {
				audio.play();
				playBtn.classList.add('playing');
				ipc.send("rpc", {
					status: "playing",
					title: playList[index].title
				});
			} else {
				audio.pause();
				playBtn.classList.remove('playing');
				ipc.send("rpc", {
					status: "paused",
					title: playList[index].title
				});
			}
			plActive();
		}

		function volumeToggle() {
			if (audio.muted) {
				if (parseInt(volumeLength, 10) === 0) {
					volumeBar.style.height = '100%';
					audio.volume = 1;
				} else {
					volumeBar.style.height = volumeLength;
				}
				audio.muted = false;
				this.classList.remove('muted');
			} else {
				audio.muted = true;
				volumeBar.style.height = 0;
				this.classList.add('muted');
			}
		}

		function repeatToggle() {
			var repeat = this.classList;
			if (repeat.contains('ap-active')) {
				repeating = false;
				repeat.remove('ap-active');
			} else {
				repeating = true;
				repeat.add('ap-active');
			}
		}

		function plToggle() {
			document.getElementById('ap').classList.toggle('ap-active');
			pl.classList.toggle('hide');
		}

		function update() {
			if (audio.readyState === 0) return;
			var barlength = Math.round(audio.currentTime * (100 / audio.duration));
			progressBar.style.width = barlength + '%';
			var curMins = Math.floor(audio.currentTime / 60),
				curSecs = Math.floor(audio.currentTime - curMins * 60),
				mins = Math.floor(audio.duration / 60),
				secs = Math.floor(audio.duration - mins * 60);
			(curSecs < 10) && (curSecs = '0' + curSecs);
			(secs < 10) && (secs = '0' + secs);
			curTime.innerHTML = curMins + ':' + curSecs;
			durTime.innerHTML = mins + ':' + secs;
			var buffered = audio.buffered;
			if (buffered.length) {
				var loaded = Math.round(100 * buffered.end(0) / audio.duration);
				preloadBar.style.width = loaded + '%';
			}
		}

		function doEnd() {
			if (index === playList.length - 1) {
				if (!repeating) {
					audio.pause();
					plActive();
					playBtn.classList.remove('playing');
					return;
				} else {
					index = 0;
					play();
				}
			} else {
				if (!repeating) index = (index === playList.length - 1) ? 0 : index + 1;
				let title = document.getElementsByClassName('pl-title')[index].innerHTML;
				notify(`Now playing`, title)
				play();
			}
		}

		function moveBar(evt, el, dir) {
			var value;
			if (dir === 'horizontal') {
				value = Math.round((evt.clientX - el.offset().left) * 100 / el.parentNode.offsetWidth);
				el.style.width = value + '%';
				return value;
			} else {
				var offset = el.offset().top + el.offsetHeight;
				value = Math.round((offset - evt.clientY));
				if (value > 100) value = 100;
				if (value < 0) value = 0;
				volumeBar.style.height = value + '%';
				return value;
			}
		}

		function volumeUp(value) {
			if (mini == true) {
				miniPlayer();
				document.getElementsByClassName('ap-volume')[0].style.height = "120px";
				document.getElementsByClassName('ap-volume')[0].style.visibility = "visible";
				document.getElementsByClassName('ap-volume-container')[0].style.background = 'var(--block)';
			} else {
				document.getElementsByClassName('ap-volume')[0].style.height = "120px";
				document.getElementsByClassName('ap-volume')[0].style.visibility = "visible";
				document.getElementsByClassName('ap-volume-container')[0].style.background = 'var(--block)';
				setTimeout(() => {
					if (document.getElementsByClassName('ap-volume')[0].style.height == "120px") {
						document.getElementsByClassName('ap-volume')[0].style.height = null;
						document.getElementsByClassName('ap-volume')[0].style.visibility = null;
						document.getElementsByClassName('ap-volume-container')[0].style.background = null;
					}
				}, 3000)
			}
			value = audio.volume * 100 + 2;
			if (value > 100) value = 100;
			if (value < 0) value = 0;
			volumeBar.style.height = value + '%';
			audio.volume = Number(value / 100);
		}

		function volumeDown(value) {
			if (mini == true) {
				miniPlayer();
				document.getElementsByClassName('ap-volume')[0].style.height = "120px";
				document.getElementsByClassName('ap-volume')[0].style.visibility = "visible";
				document.getElementsByClassName('ap-volume-container')[0].style.background = 'var(--block)';
			} else {
				document.getElementsByClassName('ap-volume')[0].style.height = "120px";
				document.getElementsByClassName('ap-volume')[0].style.visibility = "visible";
				document.getElementsByClassName('ap-volume-container')[0].style.background = 'var(--block)';
				setTimeout(() => {
					if (document.getElementsByClassName('ap-volume')[0].style.height == "120px") {
						document.getElementsByClassName('ap-volume')[0].style.height = null;
						document.getElementsByClassName('ap-volume')[0].style.visibility = null;
						document.getElementsByClassName('ap-volume-container')[0].style.background = null;
					}
				}, 3000)
			}
			value = audio.volume * 100 - 2;
			if (value > 100) value = 100;
			if (value < 0) value = 0;
			volumeBar.style.height = value + '%';
			audio.volume = Number(value / 100);
		}

		function handlerBar(evt) {
			document.getElementsByClassName('ap-bar')[0].classList.add("no-anim");
			setTimeout(() => {
				document.getElementsByClassName('ap-bar')[0].classList.remove("no-anim");
			}, 300)
			rightClick = (evt.which === 3) ? true : false;
			seeking = true;
			seek(evt);
		}

		function handlerVol(evt) {
			rightClick = (evt.which === 3) ? true : false;
			seeking = true;
			setVolume(evt);
		}

		function seek(evt) {
			if (seeking && rightClick === false && audio.readyState !== 0) {
				var value = moveBar(evt, progressBar, 'horizontal');
				audio.currentTime = audio.duration * (value / 100);
			}
		}

		function seekingFalse() {
			seeking = false;
		}

		function setVolume(evt) {
			volumeLength = volumeBar.css('height');
			if (seeking && rightClick === false) {
				var value = moveBar(evt, volumeBar.parentNode, 'vertical') / 100;
				if (value <= 0) {
					audio.volume = 0;
					volumeBtn.classList.add('muted');
				} else {
					if (audio.muted) audio.muted = false;
					audio.volume = value;
					volumeBtn.classList.remove('muted');
				}
			}
		}

		function destroy() {
			if (!apActive) return;
			playBtn.removeEventListener('click', playToggle, false);
			volumeBtn.removeEventListener('click', volumeToggle, false);
			repeatBtn.removeEventListener('click', repeatToggle, false);
			plBtn.removeEventListener('click', plToggle, false);
			progressBar.parentNode.parentNode.removeEventListener('mousedown', handlerBar, false);
			progressBar.parentNode.parentNode.removeEventListener('mousemove', seek, false);
			document.documentElement.removeEventListener('mouseup', seekingFalse, false);
			volumeBar.parentNode.parentNode.removeEventListener('mousedown', handlerVol, false);
			volumeBar.parentNode.parentNode.removeEventListener('mousemove', setVolume);
			document.documentElement.removeEventListener('mouseup', seekingFalse, false);
			prevBtn.removeEventListener('click', prev, false);
			nextBtn.removeEventListener('click', next, false);
			audio.removeEventListener('error', error, false);
			audio.removeEventListener('timeupdate', update, false);
			audio.removeEventListener('ended', doEnd, false);
			player.parentNode.removeChild(player);
			pl.removeEventListener('click', listHandler, false);
			pl.parentNode.removeChild(pl);
			audio.pause();
			apActive = false;
		}

		function extend(defaults, options) {
			for (var name in options) {
				if (defaults.hasOwnProperty(name)) {
					defaults[name] = options[name];
				}
			}
			return defaults;
		}

		function create(el, attr) {
			var element = document.createElement(el);
			if (attr) {
				for (var name in attr) {
					if (element[name] !== undefined) {
						element[name] = attr[name];
					}
				}
			}
			return element;
		}
		Element.prototype.offset = function () {
			var el = this.getBoundingClientRect(),
				scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
				scrollTop = window.pageYOffset || document.documentElement.scrollTop;
			return {
				top: el.top + scrollTop,
				left: el.left + scrollLeft
			};
		};
		Element.prototype.css = function (attr) {
			if (typeof attr === 'string') {
				return getComputedStyle(this, '')[attr];
			} else if (typeof attr === 'object') {
				for (var name in attr) {
					if (this.style[name] !== undefined) {
						this.style[name] = attr[name];
					}
				}
			}
		};

		return {
			init: init,
			destroy: destroy,
			playToggle: playToggle,
			plToggle: plToggle,
			next: next,
			prev: prev,
			random: random,
			plActive: plActive,
			mute: volumeToggle,
			volumeUp: volumeUp,
			volumeDown: volumeDown,
		};
	})();

	window.AP = AudioPlayer;
}

document.getElementsByClassName("container")[0].onscroll = function () {
	if (isLoaded == true) return;
	if (loaded == 0) loaded = 80;
	var isElViu = isElementInView($(`li[data-track="${loaded - 5}"]`), false);

	if (isElViu) {
		isLoaded = true;
		for (let i = loaded; i < loaded + 50; i++) {
			if (document.getElementsByClassName('music-el')[i]) document.getElementsByClassName('music-el')[i].style.display = "inline-block";
		}
		setTimeout(() => {
			isLoaded = false
		}, 500);
		loaded = loaded + 50;
	}
};

function refresh() {
	AP.init({
		playList: db.get("music").value()
	});

	loaded = 0;
	isLoved = false;
	if (document.getElementsByClassName("pl-container")[1] != undefined) {
		document.getElementsByClassName("pl-container")[1].parentNode.removeChild(document.getElementsByClassName("pl-container")[1]);
	}
}

function youtube(vid, title, icon) {
	if (db.get("music").find({ videoId: vid }).value() != undefined) return notify('Error', 'Song already in playlist :3');
	$.get("https://images" + ~~(Math.random() * 33) + "-focus-opensocial.googleusercontent.com/gadgets/proxy?container=none&url=https%3A%2F%2Fwww.youtube.com%2Fget_video_info%3Fvideo_id%3D" + vid, function (data) {
		if (data.indexOf("errorcode=150") > -1) return notify('Error', 'Copyright');
		var data = parse_str(data),
			streams = (data.url_encoded_fmt_stream_map + ',' + data.adaptive_fmts).split(',');
		if (data.url_encoded_fmt_stream_map == "") return notify('Error', 'Copyright or NOT FOUND');
		$.each(streams, function (n, s) {
			var stream = parse_str(s),
				itag = stream.itag * 1,
				quality = false;
			switch (itag) {
				case 139:
					quality = "48kbps";
					break;
				case 140:
					quality = "128kbps";
					break;
				case 141:
					quality = "256kbps";
					break;
			}
			if (quality) {
				var id = 0;
				if (db.get("music").value().length != undefined) {
					id = db.get("music").value().length;
				}
				db.get("music").push({
					id: id,
					icon: icon,
					title: title,
					file: stream.url,
					videoId: vid,
					loved: false
				}).write();
				let succses = true;
				axios.get(stream.url).catch(er => {
					succses = false;
					notify('Error', `${title} cant find mp3 file :c`);
					db.get("music").remove({ id: id }).write();
				})
				setTimeout(() => {
					if (succses) {
						notify('Success', `${title} added to playlist :3`);
					}
				}, 1000)
			}
		});
	})
}

function parse_str(str) {
	return str.split('&').reduce(function (params, param) {
		var paramSplit = param.split('=').map(function (value) {
			return decodeURIComponent(value.replace('+', ' '));
		});
		params[paramSplit[0]] = paramSplit[1];
		return params;
	}, {});
}

function lovethis() {
	love(parseInt(document.getElementsByClassName('pl-current')[0].getAttribute('real-id'), 10), document.getElementsByClassName('owo')[document.getElementsByClassName('pl-current')[0].getAttribute('data-track')]);
}

function getRandomInt(min, max) { return Math.round(Math.random() * (max - min)) + min; };

function shuffle(arr) {
	var j, temp;
	for (var i = arr.length - 1; i > 0; i--) {
		j = Math.floor(Math.random() * (i + 1));
		temp = arr[j];
		arr[j] = arr[i];
		arr[i] = temp;
	}
	return arr;
}

function miniPlayer() {
	if (document.getElementById('ap').style.transform == "translateY(180px)") {
		document.getElementById('hide-progres').style.display = "none";
		document.getElementById('ap').style.transform = "translateY(0px)";
		document.getElementById('hide-progres').style.width = `100%`;
		document.getElementById('hide-progres').style.display = "block";
	} else {
		document.getElementById('hide-progres').style.display = "block";
	}
	document.getElementById('pl').style.display = "none";
	document.getElementsByClassName('center')[0].style.display = "none";
	document.getElementsByClassName('top')[0].style.display = "none";
	document.getElementsByClassName('main')[0].style.background = "transparent";
	document.getElementsByClassName('bottom')[0].style.position = "absolute";
	document.getElementsByClassName('bottom')[0].style.bottom = "0";
	remote.getCurrentWindow().setSize(screen.availWidth, 55);
	remote.getCurrentWindow().setPosition(0, screen.availHeight - 55);
	remote.getCurrentWindow().setSkipTaskbar(true);
	remote.getCurrentWindow().focus();
	mini = true;
	ping = 5;
}

setInterval(() => {
	if (ping != false) {
		if (!$('#ap').is(':hover') && document.getElementById('ap').style.transform != "translateY(180px)") {
			if (ping == 1 && mini == true) {
				document.getElementsByClassName('ap-volume')[0].style.height = null;
				document.getElementsByClassName('ap-volume')[0].style.visibility = null;
				document.getElementsByClassName('ap-volume-container')[0].style.background = null;
				document.getElementById('ap').style.transform = `translateY(180px)`;
				remote.getCurrentWindow().hide();
				ping = false;
			} else {
				if (mini == true) {
					ping--;
					document.getElementById('hide-progres').style.width = `${((ping - 1) * 2) * 10}%`;
				}
			}
		}
	};
}, 1000)

function miniPlayerOff() {
	if (document.getElementById('ap').style.transform == "translateY(180px)") document.getElementById('ap').style.transform = `translateY(0px)`;
	remote.getCurrentWindow().focus();
	document.getElementById('pl').style.display = "block";
	document.getElementById('hide-progres').style.display = "none";
	document.getElementsByClassName('center')[0].style.display = null;
	document.getElementsByClassName('top')[0].style.display = "flex";
	document.getElementsByClassName('main')[0].style.background = "var(--bg)";
	document.getElementsByClassName('bottom')[0].style.position = null;
	document.getElementsByClassName('bottom')[0].style.bottom = null;
	remote.getCurrentWindow().setSize(1000, 700);
	remote.getCurrentWindow().center();
	remote.getCurrentWindow().setSkipTaskbar(false);
	mini = false;
}

function love(id, el) {
	let track = db.get("music").find({ id: id }).value();
	if (track.loved == true) {
		db.get("music").find({ id: id }).assign({ loved: false }).write();
		el.classList.remove("fav");
		notify('Removed from loved :c', `${track.title}`);
		if (isLoved == true) openloved();
	} else {
		notify('Added to loved :3', `${track.title}`);
		el.classList.add("fav");
		db.get("music").find({ id: id }).assign({ loved: true }).write();
	}
}

function isElementInView(element, fullyInView) {
	var pageTop = $(window).scrollTop();
	var pageBottom = pageTop + $(window).height();
	var elementTop = $(element).offset().top;
	var elementBottom = elementTop + $(element).height();

	if (fullyInView === true) {
		return ((pageTop < elementTop) && (pageBottom > elementBottom));
	} else {
		return ((elementTop <= pageBottom) && (elementBottom >= pageTop));
	}
}

function loadMusic() {
	if (document.getElementById('load-music').style.display == "" || document.getElementById('load-music').style.display == "none") {
		document.getElementsByClassName('menu-left')[0].classList.remove('act-menu');
		document.getElementsByClassName('shadow')[0].style.display = "none";
		document.getElementById('pl').style.display = "none";
		document.getElementById('app').style.display = "none";
		document.getElementById('ap').style.display = "none";
		document.getElementById("settings").classList.remove("openSettings");
		document.getElementById('load-music').style.display = "block";
		document.getElementById('yomp').style.background = "var(--bg)";
		document.getElementsByClassName('main')[0].style.height = "35px";
		document.getElementsByClassName('maximize')[0].style.opacity = "0";
		document.getElementsByClassName('minimize')[0].style.opacity = "0";
		remote.getCurrentWindow().setSize(500, 91);
		remote.getCurrentWindow().center();
	} else {
		refresh();
		remote.getCurrentWindow().focus();
		document.getElementById('pl').style.display = null;
		document.getElementById('app').style.display = null;
		document.getElementById('ap').style.display = null;
		document.getElementById('load-music').style.display = null;
		document.getElementById('yomp').style.background = null;
		document.getElementsByClassName('main')[0].style.height = null;
		document.getElementsByClassName('maximize')[0].style.opacity = null;
		document.getElementsByClassName('minimize')[0].style.opacity = null;
		remote.getCurrentWindow().setSize(1000, 700);
		remote.getCurrentWindow().center();
		document.getElementById('pl').classList.remove("hide");
	}
}

function openloved() {
	isLoved = true;
	let lovedMas = [];

	db.get("music").value().forEach(l => {
		if (l.loved == true) lovedMas.push(l);
	})

	AP.init({
		playList: lovedMas
	});

	loaded = 0;
	document.getElementById('pl').classList.remove("hide");

	if (document.getElementsByClassName("pl-container")[1] != undefined) {
		document.getElementsByClassName("pl-container")[1].parentNode.removeChild(document.getElementsByClassName("pl-container")[1]);
	}
}

function loadSettings() {
	//settings
	if (db.get("settings").value()[0].noti.turn) document.getElementById('noti-turn').checked = true;
	if (db.get("settings").value()[0].noti.loved) document.getElementById('noti-loved').checked = true;
	if (db.get("settings").value()[0].noti.add) document.getElementById('noti-youtube').checked = true;
	if (db.get("settings").value()[0].key.play == "") document.getElementsByClassName('check-key-input')[0].checked = true;
	if (db.get("settings").value()[0].key.next == "") document.getElementsByClassName('check-key-input')[1].checked = true;
	if (db.get("settings").value()[0].key.prev == "") document.getElementsByClassName('check-key-input')[2].checked = true;
	if (db.get("settings").value()[0].key.random == "") document.getElementsByClassName('check-key-input')[3].checked = true;
	if (db.get("settings").value()[0].key.volumeup == "") document.getElementsByClassName('check-key-input')[4].checked = true;
	if (db.get("settings").value()[0].key.volumedown == "") document.getElementsByClassName('check-key-input')[5].checked = true;
	if (db.get("settings").value()[0].key.mute == "") document.getElementsByClassName('check-key-input')[6].checked = true;
	if (db.get("settings").value()[0].key.love == "") document.getElementsByClassName('check-key-input')[7].checked = true;
	if (db.get("settings").value()[0].key.mini == "") document.getElementsByClassName('check-key-input')[8].checked = true;
	if (db.get("settings").value()[0].key.focus == "") document.getElementsByClassName('check-key-input')[9].checked = true;
	document.getElementById('key-toggle').value = db.get("settings").value()[0].key.play;
	document.getElementById('key-next').value = db.get("settings").value()[0].key.next;
	document.getElementById('key-prev').value = db.get("settings").value()[0].key.prev;
	document.getElementById('key-random').value = db.get("settings").value()[0].key.random;
	document.getElementById('key-volup').value = db.get("settings").value()[0].key.volumeup;
	document.getElementById('key-voldown').value = db.get("settings").value()[0].key.volumedown;
	document.getElementById('key-mute').value = db.get("settings").value()[0].key.mute;
	document.getElementById('key-love').value = db.get("settings").value()[0].key.love;
	document.getElementById('key-mini').value = db.get("settings").value()[0].key.mini;
	document.getElementById('key-minioff').value = db.get("settings").value()[0].key.focus;
}