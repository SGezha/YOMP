const fs = require("fs");
if (!fs.existsSync("database.json")) fs.writeFileSync("./database.json", '{"music":[]}');
if (!fs.existsSync(`./cache`)) fs.mkdirSync(`./cache`);
const { remote, ipcRenderer: ipc } = require('electron'),
    lowdb = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync'),
    adapter = new FileSync("database.json"),
    db = lowdb(adapter),
    NodeID3 = require('node-id3');

let musicSelectedId = 0,
    isLoaded = false,
    loaded = 0,
    basepath = remote.app.getAppPath().split("\\").join("/").split("/reso")[0],
    mini = false,
    fullscreen = 0,
    base = db.get("music").value(),
    ilLoved = false,
    ping = false;


window.onload = function () {
    start();
    fixmusic();
    AP.plToggle();
    document.getElementById('loader').parentNode.removeChild(document.getElementById('loader'));
};

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
    remote.BrowserWindow.getFocusedWindow().minimize();
}

document.onkeydown = function (e) {
    if (e.which === 13) {
        app.search();
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
            if (data.indexOf("errorcode=150") > -1) return toastr.error('Error: Copyright');
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
        remote.BrowserWindow.getFocusedWindow().maximize();
        fullscreen++;
        document.getElementsByClassName("maximize")[0].innerHTML = `<i style="color: white;" class="fas fa-square"></i>`;
    } else {
        remote.BrowserWindow.getFocusedWindow().unmaximize();
        fullscreen = 0;
        document.getElementsByClassName("maximize")[0].innerHTML = `<i style="color: white;" class="far fa-square"></i>`;
    }
}

document.getElementById('search').oninput = function () {
    if (base.length == 0) return;
    if (document.getElementById("pl").classList.length == 2) return;
    let result = [];
    var l = this.value.length;
    if (l > 0) {
        for (var i = 0; i < base.length; i++) {
            let title = base[i].title;
            if (base[i].title[0].length > 1) title = base[i].title[0];
            if (title.toLowerCase().match(this.value.toLowerCase())) {
                result.push(base[i]);
            }
        }
        document.getElementById('pl').parentNode.removeChild(document.getElementById('pl'));
        AP.init({
            playList: result
        });
        loaded = 0;

        document.getElementById("pl").onscroll = function () {
            if (isLoaded == true) return;
            if (loaded == 0) loaded = 80;
            var isElViu = isElementInView($(`[data-track="${loaded - 5}"]`), false);
    
            if (isElViu) {
                isLoaded = true;
                for (let i = loaded; i < loaded + 50; i++) {
                    document.getElementsByClassName('music-el')[i].style.display = "inline-flex";
                }
                setTimeout(() => {
                    isLoaded = false
                }, 500);
                loaded = loaded + 50;
            }
        };

        document.getElementById('pl').classList.remove("hide");
    } else {
        document.getElementById('pl').parentNode.removeChild(document.getElementById('pl'));
        AP.init({
            playList: base
        });

        document.getElementById("pl").onscroll = function () {
            if (isLoaded == true) return;
            if (loaded == 0) loaded = 80;
            var isElViu = isElementInView($(`[data-track="${loaded - 5}"]`), false);
    
            if (isElViu) {
                isLoaded = true;
                for (let i = loaded; i < loaded + 50; i++) {
                    document.getElementsByClassName('music-el')[i].style.display = "inline-flex";
                }
                setTimeout(() => {
                    isLoaded = false
                }, 500);
                loaded = loaded + 50;
            }
        };

        loaded = 0;
        document.getElementById('pl').classList.remove("hide");
    }
}


function random() {
    var mas = shuffle(base);
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
}

function addMusicFolder() {
    let dir = remote.dialog.showOpenDialog({ title: 'Select Music Folder', properties: ['openDirectory'] });
    fs.readdir(dir[0], function (err, items) {
        loadMusic();
        items.forEach((i, ind) => {
            setTimeout(() => {
                if(ind+1 == items.length) loadMusic();
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
                            fs.writeFileSync(`cache/${title}.jpg`, metadata.image.imageBuffer, 'binary');
                            img = encodeURI(`${basepath}/cache/${title}.jpg`);
                        }
                        db.get("music").push({
                            id: id,
                            title: title,
                            icon: img,
                            file: `${dir[0]}/${i}`,
                            loved: false
                        }).write();
                        document.getElementById("loadprogress").innerHTML = `<div class="textload">${title}</div> <span> ${ind + 1}/${items.length}</span>`;
                    }
                }
            }, 500 * ind)
        })
    });
}


function addosu() {
    let dir = remote.dialog.showOpenDialog({ title: 'Select osu!/songs Folder', properties: ['openDirectory'] });
    fs.readdir(dir[0], function (err, items) {
        loadMusic();
        items.forEach((i, ind) => {
            if (i.indexOf(".") == -1) {
                setTimeout(() => {
                    if(ind+1 == items.length) loadMusic();
                    fs.readdir(`${dir[0]}/${i}`, function (err, files) {
                        let obj = {};
                        obj.img = undefined;
                        files.forEach(f => {
                            if (f.indexOf(".osu") > -1) {
                                obj.title = f.split("[")[0];
                                if (obj.title.indexOf("(") > -1) obj.title = obj.title.substring(0, obj.title.indexOf("("));
                            }
                            if (f.indexOf(".mp3") > -1) {
                                obj.file = `${dir[0]}/${i}/${f}`;
                            }
                            if (f.indexOf(".jpg") > -1 || f.indexOf(".png") > -1) {
                                obj.img = encodeURI(`${dir[0]}/${i}/${f}`.split("\\").join("/"));
                            }
                        })
                        if (obj.title != undefined && obj.file != undefined) {
                            document.getElementById("loadprogress").innerHTML = `<div class="textload">${obj.title}</div> <span> ${ind + 1}/${items.length}</span>`;
                            if (db.get("music").find({ file: obj.file }).value() == undefined) {
                                var id = 0;
                                if (db.get("music").value().length != undefined) {
                                    id = db.get("music").value().length;
                                }
                                db.get("music").push({
                                    id: id,
                                    title: obj.title,
                                    file: `${obj.file}`,
                                    icon: obj.img,
                                    loved: false
                                }).write();
                            }
                        }
                    })
                }, 300 * ind)
            }
        })
    });
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
            var tpl = `<li class="music-el" {hide} real-id="{real-id}" data-track="{count}"> <div class="music-id">{id}</div> <div class="music-icon" style="background: url('{icon}'); background-size: cover; background-position: center;"></div> ` + '<div class="pl-number">' + '<div class="pl-count">' + '{type}' + '</div>' + '<div class="pl-playing">' + '<div class="eq">' + '<div class="eq-bar"></div>' + '<div class="eq-bar"></div>' + '<div class="eq-bar"></div>' + '</div>' + '</div>' + '</div>' + '<div class="pl-title">{title}</div>' + '{fav}' + '<button class="pl-remove">' + '<svg class="pl-del" style="cursor:pointer;" fill="#000000" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">' + '<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>' + '<path d="M0 0h24v24H0z" fill="none"/>' + '</svg>' + '</button>' + '</li>';
            playList.forEach(function (item, i) {
                let fav = `<i onclick="love('${item.title}', this);" style="color: white;" class="fas fa-heart fav"></i>`;
                if (db.get("music").find({ title: item.title }).value().loved == true) fav = `<i onclick="love('${item.title}', this);" style="color: #e91e63;" class="fas fa-heart fav"></i>`;
                let type = '<svg fill="#000000" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">' + '<path d="M0 0h24v24H0z" fill="none"/>' + '<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>' + '</svg>';
                if (item.file.indexOf("osu") > -1) type = `<img style="width: 20px; hegiht: 20px; transform: scale(1.2);" src="icons/osu.svg">`;
                if (item.videoId != undefined) type = `<i style="transform: scale(1.2);" class="fab fa-youtube"></i>`;
                if (i < 80) {
                    html.push(tpl.replace('{real-id}', item.id).replace('{fav}', fav).replace('{count}', i).replace('{id}', `${i + 1}/${playList.length}`).replace('{type}', type).replace('{icon}', item.icon).replace('{hide}', '').replace('{title}', item.title).replace('{icon}', item.icon));
                } else {
                    html.push(tpl.replace('{real-id}', item.id).replace('{fav}', fav).replace('{count}', i).replace('{id}', `${i + 1}/${playList.length}`).replace('{type}', type).replace('{title}', item.title).replace('{hide}', 'style="display: none;"').replace('{icon}', item.icon).replace('{icon}', item.icon));
                }
            });
            pl = create('div', {
                'className': 'pl-container hide',
                'id': 'pl',
                'innerHTML': !isEmptyList() ? '<ul class="pl-list">' + html.join('') + '</ul>' : '<div class="pl-empty">PlayList is empty</div>'
            });
            player.parentNode.insertBefore(pl, player.nextSibling);
            plLi = pl.querySelectorAll('li');
            pl.addEventListener('click', listHandler, false);
        }

        function listHandler(evt) {
            evt.preventDefault();
            if (evt.target.className === 'pl-title') {
                var current = parseInt(evt.target.parentNode.getAttribute('data-track'), 10);
                index = current;
                audio.readyState = 0;
                plActive();
                play();
                setTimeout(() => {
                    play();
                }, 300)
            } else {
                var target = evt.target;
                while (target.className !== pl.className) {
                    if (target.className === 'pl-remove' || target.className === 'pl-del') {
                        var id = 0;
                        var isDel = parseInt(target.parentNode.getAttribute('data-track'), 10);
                        playList.splice(isDel, 1);
                        db.get("music").remove({ id: parseInt(target.parentNode.getAttribute('real-id'), 10) }).write();
                        target.parentNode.parentNode.removeChild(target.parentNode);
                        plLi = pl.querySelectorAll('li');
                        [].forEach.call(plLi, function (el, i) {
                            el.setAttribute('data-track', i);
                        });
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
            var current = index;
            for (var i = 0, len = plLi.length; len > i; i++) {
                plLi[i].classList.remove('pl-current');
            }
            plLi[current].classList.add('pl-current');
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
            document.getElementById('now-bg').style.background = `url('${playList[index].icon}') center center / cover no-repeat`;
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
            if(mini == true && ping > 1) ping = 5;
            play();
        }

        function next() {
            index = index + 1;
            if(mini == true && ping > 1) ping = 5;
            play();
        }

        function random() {
            index = getRandomInt(0, db.get("music").value().length);
            if(mini == true && ping > 1) ping = 5;
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
                index = (index === playList.length - 1) ? 0 : index + 1;
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
                document.getElementsByClassName('ap-volume-container')[0].style.background = '#2b2b2b';
            } else {
                document.getElementsByClassName('ap-volume')[0].style.height = "120px";
                document.getElementsByClassName('ap-volume')[0].style.visibility = "visible";
                document.getElementsByClassName('ap-volume-container')[0].style.background = '#2b2b2b';
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
                document.getElementsByClassName('ap-volume-container')[0].style.background = '#2b2b2b';
            } else {
                document.getElementsByClassName('ap-volume')[0].style.height = "120px";
                document.getElementsByClassName('ap-volume')[0].style.visibility = "visible";
                document.getElementsByClassName('ap-volume-container')[0].style.background = '#2b2b2b';
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
            volumeDown: volumeDown
        };
    })();

    window.AP = AudioPlayer;
}

function refresh() {
    AP.init({
        playList: db.get("music").value()
    });

    document.getElementById("pl").onscroll = function () {
        if (isLoaded == true) return;
        if (loaded == 0) loaded = 80;
        var isElViu = isElementInView($(`[data-track="${loaded - 5}"]`), false);

        if (isElViu) {
            isLoaded = true;
            for (let i = loaded; i < loaded + 50; i++) {
                document.getElementsByClassName('music-el')[i].style.display = "inline-flex";
            }
            setTimeout(() => {
                isLoaded = false
            }, 500);
            loaded = loaded + 50;
        }
    };
    
    loaded = 0;
    ilLoved = false;
    if (document.getElementsByClassName("pl-container")[1] != undefined) {
        document.getElementsByClassName("pl-container")[1].parentNode.removeChild(document.getElementsByClassName("pl-container")[1]);
    }
}

function youtube(vid, title, icon) {
    if (db.get("music").find({ videoId: vid }).value() != undefined) return toastr.error('Song already in playlist :3');
    $.get("https://images" + ~~(Math.random() * 33) + "-focus-opensocial.googleusercontent.com/gadgets/proxy?container=none&url=https%3A%2F%2Fwww.youtube.com%2Fget_video_info%3Fvideo_id%3D" + vid, function (data) {
        if (data.indexOf("errorcode=150") > -1) return toastr.error('Error: Copyright');
        var data = parse_str(data),
            streams = (data.url_encoded_fmt_stream_map + ',' + data.adaptive_fmts).split(',');
        if (data.url_encoded_fmt_stream_map == "") return toastr.error('Error: Copyright or NOT FOUND');
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
                toastr.clear();
                toastr.success(`${title} added to playlist :3`);
                refresh();
                axios.get(stream.url).catch(er => {
                    toastr.error(`${title} cant find mp3 file :c`);
                    db.get("music").remove({ id: id }).write();
                    refresh();
                })
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
    love(document.getElementsByClassName('pl-current')[0].innerHTML.split(`<div class="pl-title">`)[1].split(`<`)[0], document.getElementsByClassName('fav')[document.getElementsByClassName('pl-current')[0].getAttribute('data-track')]);
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
    if (document.getElementById('ap').style.transform == "translateY(180px)") document.getElementById('ap').style.transform = "translateY(0px)";
    document.getElementById('pl').style.display = "none";
    document.getElementById('app').style.display = "none";
    document.getElementsByClassName('ui-titlebar')[0].style.display = "none";
    document.getElementById('prog').style.background = "transparent";
    document.getElementsByClassName('pl-container')[0].style.background = "transparent";
    remote.BrowserWindow.getFocusedWindow().setSize(screen.availWidth, 180);
    remote.BrowserWindow.getFocusedWindow().setPosition(0, screen.availHeight - 180);
    remote.BrowserWindow.getFocusedWindow().setSkipTaskbar(true);
    remote.BrowserWindow.getFocusedWindow().focus();
    mini = true;
    ping = 5;
}

setInterval(() => {
    if (ping != false) {
        if(ping == 1 && mini == true) {
            if (!$('#ap').is(':hover') && document.getElementById('ap').style.transform != "translateY(180px)") {
                document.getElementsByClassName('ap-volume')[0].style.height = null;
                document.getElementsByClassName('ap-volume')[0].style.visibility = null;
                document.getElementsByClassName('ap-volume-container')[0].style.background = null;
                setTimeout(() => {
                    document.getElementById('ap').style.transform = `translateY(180px)`;
                    setTimeout(() => { remote.BrowserWindow.getFocusedWindow().hide(); }, 310);
                }, 310)
                ping = false;
            } else { miniPlayer(); }
        } else {if(mini == true) { ping--; }}
    };
}, 1000)

function miniPlayerOff() {
    if (document.getElementById('ap').style.transform == "translateY(180px)") document.getElementById('ap').style.transform = `translateY(0px)`;
    remote.BrowserWindow.getFocusedWindow().focus();
    document.getElementById('pl').style.display = "flex";
    document.getElementById('prog').style.background = "#1B1B1B";
    document.getElementsByClassName('pl-container')[0].style.background = "#1B1B1B";
    document.getElementById('app').style.display = "block";
    document.getElementsByClassName('ui-titlebar')[0].style.display = "flex";
    remote.BrowserWindow.getFocusedWindow().setSize(1000, 700);
    remote.BrowserWindow.getFocusedWindow().center();
    remote.BrowserWindow.getFocusedWindow().setSkipTaskbar(false);
    mini = false;
}

function love(i, el) {
    if (db.get("music").find({ title: i }).value().loved == true) {
        db.get("music").find({ title: i }).assign({ loved: false }).write();
        el.style.color = "white";
        toastr.error(`${i} remove from loved :c`);
        if (ilLoved == true) openloved();
    } else {
        toastr.success(`${i} added to loved :3`);
        el.style.color = "#e91e63";
        db.get("music").find({ title: i }).assign({ loved: true }).write();
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
    if(document.getElementById('loadmusic').style.display == "" || document.getElementById('loadmusic').style.display == "none") {
        document.getElementsByClassName('menu-left')[0].classList.remove('act-menu');
        document.getElementsByClassName('shadow')[0].style.display = "none";
        document.getElementById('pl').style.display = "none";
        document.getElementById('app').style.display = "none";
        document.getElementById('ap').style.display = "none";
        document.getElementById('loadmusic').style.display = "block";
        document.getElementsByClassName('maximize')[0].style.opacity = "0";
        document.getElementsByClassName('minimize')[0].style.opacity = "0";
        remote.BrowserWindow.getFocusedWindow().setSize(500, 70);
        remote.BrowserWindow.getFocusedWindow().center();
    } else {
        refresh();
        document.getElementById('pl').style.display = "flex";
        document.getElementById('app').style.display = "block";
        document.getElementById('ap').style.display = "block";
        document.getElementById('loadmusic').style.display = "none";
        document.getElementsByClassName('maximize')[0].style.opacity = "1";
        document.getElementsByClassName('minimize')[0].style.opacity = "1";
        remote.BrowserWindow.getFocusedWindow().setSize(1000, 700);
        remote.BrowserWindow.getFocusedWindow().center();
        document.getElementById('pl').classList.remove("hide");
    }
}

function openloved() {
    ilLoved = true;
    let lovedMas = [];

    db.get("music").value().forEach(l => {
        if (l.loved == true) lovedMas.push(l);
    })

    AP.init({
        playList: lovedMas
    });

    loaded = 0;
    document.getElementById('pl').classList.remove("hide");

    document.getElementById("pl").onscroll = function () {
        if (isLoaded == true) return;
        if (loaded == 0) loaded = 80;
        var isElViu = isElementInView($(`[data-track="${loaded - 5}"]`), false);

        if (isElViu) {
            isLoaded = true;
            for (let i = loaded; i < loaded + 50; i++) {
                document.getElementsByClassName('music-el')[i].style.display = "inline-flex";
            }
            setTimeout(() => {
                isLoaded = false
            }, 500);
            loaded = loaded + 50;
        }
    };

    if (document.getElementsByClassName("pl-container")[1] != undefined) {
        document.getElementsByClassName("pl-container")[1].parentNode.removeChild(document.getElementsByClassName("pl-container")[1]);
    }
}