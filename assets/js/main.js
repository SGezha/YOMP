const { shell, remote, ipcRenderer: ipc } = require('electron'),
  root = remote.app.getPath('userData').split("\\").join("/"),
  db = require('better-sqlite3-helper'),
  fs = require("fs"),
  child = require('child_process').exec,
  NodeID3 = require('node-id3'),
  os = require('os');

if (!fs.existsSync(`${root}/images`)) fs.mkdirSync(`${root}/images`);
if (!fs.existsSync(`${root}/youtube`)) fs.mkdirSync(`${root}/youtube`);
if (!fs.existsSync(`${root}/full`)) fs.mkdirSync(`${root}/full`);

console.log(root);

db({ path: `${root}/database.db`, memory: false, readonly: false, fileMustExist: false, migrate: false });

let loaded = 0,
  musicStatus = {},
  mini = false,
  fullscreen = 0,
  isLoved = false,
  youtubeRadio = false,
  ytQuery = [],
  radioPlayer,
  first = true,
  ping = false;

window.onload = function () {
  start();
  ipc.send('ready');
  loadSettings();
  checkUpdate(true);
  if (db().query("SELECT * from status")[0].loved == "false") { refresh(); } else { openloved(); }
  discordUpdate();
  app.ver = JSON.parse(fs.readFileSync(`${__dirname}/package.json`).toString()).version;
  $('.collapsible').collapsible();
};

function start() {
  var AudioPlayer = (function () {
    var player = document.getElementById('ap'),
      playBtn, prevBtn, nextBtn, plBtn, repeatBtn, volumeBtn, progressBar, preloadBar, curTime, durTime, trackTitle, audio, index = 0,
      playList, volumeBar, volumeLength, repeating = false, random = false, seeking = false, rightClick = false, apActive = false,
      pl = document.querySelector("#pl"), settings = { volume: db().query("SELECT * from status")[0].volume ? db().query("SELECT * from status")[0].volume : 0.1, autoPlay: false, notification: true, playList: [] };

    function init(options) {
      for (let i = 0; i < document.querySelectorAll(".music-el").length; i++) {
        if (document.querySelectorAll(".music-el")[i]) document.querySelectorAll(".music-el")[i].classList.remove('pl-current');
      }
      settings = extend(settings, options);
      playList = settings.playList;
      renderPL();
      youtubeRadio = false;
      if (!('classList' in document.documentElement)) return false;
      if (apActive || player === null) return;
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
      document.querySelector(".randomToggle").addEventListener('click', randomToggle, false);
      progressBar.parentNode.parentNode.addEventListener('mousedown', handlerBar, false);
      progressBar.parentNode.parentNode.addEventListener('mousemove', seek, false);
      document.documentElement.addEventListener('mouseup', seekingFalse, false);
      volumeBar.parentNode.parentNode.addEventListener('mousedown', handlerVol, false);
      volumeBar.parentNode.parentNode.addEventListener('mousemove', setVolume);
      document.documentElement.addEventListener('mouseup', seekingFalse, false);
      prevBtn.addEventListener('click', prev, false);
      nextBtn.addEventListener('click', next, false);
      audio = new Audio();
      audio.volume = settings.volume;
      if (isEmptyList()) {
        empty();
        return;
      } else {
        apActive = true;
        audio.src = playList[index].file;
        audio.preload = 'auto';
        volumeBar.style.height = audio.volume * 100 + '%';
        volumeLength = volumeBar.css('height');
        audio.addEventListener('error', error, false);
        audio.addEventListener('timeupdate', update, false);
        audio.addEventListener('ended', doEnd, false);
      }
    }

    function renderPL() {
      var html = [];
      playList.reverse().forEach(function (item, i) {
        item.fav = `<i onclick="love(${item.id}, this);" class="fas fa-heart owo"></i>`;
        if (item.loved == true) item.fav = `<i onclick="love(${item.id}, this);" class="fas fa-heart owo fav"></i>`;
        item.type = '<svg fill="#fff" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">' + '<path d="M0 0h24v24H0z" fill="none"/>' + '<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>' + '</svg>';
        if (item.file.indexOf("osu") > -1) item.type = `<img class="pl-img" src="assets/icons/osu.svg">`;
        if (item.videoId != undefined) item.type = `<i class="fab fa-youtube"></i>`;
        item.dataId = i;
        if (i < 80) {
          item.hide = true;
          html.push(item);
        } else {
          item.hide = false;
          html.push(item);
        }
      });
      app.playlist = html;
      setTimeout(() => {
        for (let i = 0; i < document.querySelectorAll('.music-el').length; i++) {
          document.querySelector("#pl").addEventListener('click', listHandler, false);
          let need = document.querySelectorAll(".pl-title")[i].innerHTML;
          if (need == app.status.title) {
            document.querySelectorAll(".music-el")[i].classList.add('pl-current');
            AP.setIndex(i);
          }
        }
        if (first && db().query("SELECT * from status")[0].dataId != 0) {
          first = false;
          index = db().query("SELECT * from status")[0].dataId;
          audio.src = playList[index].file;
          audio.preload = 'auto';
          app.status.title = playList[index].title;
        }
      }, 500)
    }

    document.getElementsByClassName("container")[0].onscroll = function () {
      if (loaded == 0) loaded = 80;
      if (this.scrollTop > this.scrollHeight - this.clientHeight - 100) {
        for (let i = loaded; i < loaded + 50; i++) {
          if (app.playlist[i] && app.playlist[i].hide == false) app.playlist[i].hide = true;
        }
        for (let i = 0; i < document.querySelectorAll('.music-el').length; i++) {
          document.querySelector("#pl").addEventListener('click', listHandler, false);
        }
        setTimeout(() => {
          // document.querySelector(`.pl-container`).innerHTML += ` <iframe data-aa="1254797" src="https://acceptable.a-ads.com/1254797" scrolling="no" style="border-radius: 10px; border:0px; margin: 0px 5px; padding:0; width: 100%; height: 60px; overflow:hidden" allowtransparency="true"></iframe>`;
        }, 500);
        loaded = loaded + 50;
      }
    };

    function listHandler(evt) {
      youtubeRadio = false;
      evt.preventDefault();
      let aw = evt.target.className;
      if (aw == 'pl-title') {
        let current = parseInt(evt.target.parentNode.getAttribute('data-track'), 10);
        index = current;
        parseInt(evt.target.parentNode.getAttribute('real-id'), 10);
        audio.readyState = 0;
        plActive();
        play();
      } else {
        let target = evt.target;
        if (target.className === 'fas fa-heart owo' || target.className === 'fas fa-heart owo fav' || target.className == 'right') return;
        while (target.className !== pl.className) {
          if (target.className === 'pl-remove' || target.className === 'pl-del' || target.className === 'right') {
            M.toast({ html: `<i style="margin-right: 10px;" class="fas fa-trash"></i> <span>${db().query("SELECT * from music WHERE id=" + parseInt(target.parentNode.getAttribute('real-id'), 10))[0].title}</span>` });
            db().run(`DELETE from music where id=${parseInt(target.parentNode.getAttribute('real-id'), 10)}`);
            if (!isLoved) { refresh(); } else { openloved(); };
            let isDel = parseInt(target.parentNode.getAttribute('data-track'), 10);
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
        if (document.querySelector(".pl-current")) document.querySelectorAll('.music-el')[index].classList.remove('pl-current');
        return;
      }
      for (var i = 0, len = document.querySelectorAll('.music-el').length; len > i; i++) {
        document.querySelectorAll('.music-el')[i].classList.remove('pl-current');
      }
      if(document.querySelectorAll('.music-el')[index]) document.querySelectorAll('.music-el')[index].classList.add('pl-current');
    }

    function error() {
      !isEmptyList() && next();
    }

    function play() {
      index = (index > playList.length - 1) ? 0 : index;
      index;
      if (index < 0) index = playList.length - 1;
      if (isEmptyList()) {
        empty();
        return;
      }
      audio.src = playList[index].file;
      audio.preload = 'auto';
      document.title = app.status.title = playList[index].title;
      audio.play();
      playBtn.classList.add('playing');
      plActive();
    }

    function prev() {
      youtubeRadio = false;
      if (random) return randomTrack();
      index = index - 1;
      if (mini == true && ping > 1) {
        document.getElementById('hide-progres').style.width = `100%`;
        ping = 5;
      }
      notify(`Now playing`, app.playlist[index].title)
      play();
    }

    function next() {
      youtubeRadio = false;
      if (random) return randomTrack();
      index = index + 1;
      if (mini == true && ping > 1) {
        document.getElementById('hide-progres').style.width = `100%`;
        ping = 5;
      }
      notify(`Now playing`, app.playlist[index].title)
      play();
    }

    function randomTrack() {
      youtubeRadio = false;
      index = getRandomInt(0, app.playlist.length);
      if (mini == true && ping > 1) {
        document.getElementById('hide-progres').style.width = `100%`;
        ping = 5;
      }
      notify(`Now playing`, app.playlist[index].title)
      play();
    }

    function isEmptyList() {
      return playList.length === 0;
    }

    function empty() {
      audio.pause();
      audio.src = '';
      app.status.title = 'Playlist is empty';
      app.status.progress = ``;
      // pl.innerHTML = '<div class="pl-empty"><img src="https://image.flaticon.com/icons/svg/1679/1679882.svg" class="emss" /> PlayList is empty</div>';
    }


    function playToggle() {
      if (isEmptyList()) return;
      if (youtubeRadio) {
        radioPlayer.getPlayerState() === YT.PlayerState.PLAYING || radioPlayer.getPlayerState() === YT.PlayerState.BUFFERING ? radioPlayer.pauseVideo() : radioPlayer.playVideo();
        return;
      };
      if (audio.paused) {
        audio.play();
        playBtn.classList.add('playing');
      } else {
        audio.pause();
        playBtn.classList.remove('playing');
      }
      plActive();
    }

    function volumeToggle() {
      if (audio.muted) {
        if (parseInt(volumeLength, 10) === 0) {
          volumeBar.style.height = '100%';
          audio.volume = 1;
        } else { volumeBar.style.height = volumeLength; };
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

    function randomToggle() {
      var randomel = document.querySelector(".randomToggle").classList;
      if (randomel.contains('ap-active')) {
        random = false;
        document.querySelector(".randomToggle").classList.remove('ap-active');
      } else {
        random = true;
        document.querySelector(".randomToggle").classList.add('ap-active');
      }
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
      app.status.progress = `${curMins}:${curSecs}/${mins}:${secs}`;
      var buffered = audio.buffered;
      if (buffered.length) {
        var loaded = Math.round(100 * buffered.end(0) / audio.duration);
        preloadBar.style.width = loaded + '%';
      }
      musicStatus.progress = barlength;
      musicStatus.curTime = `${curMins}:${curSecs}`;
      musicStatus.durTime = `${mins}:${secs}`;
    }

    function doEnd() {
      if (random) return randomTrack();
      if (index == playList.length - 1) {
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
        let title = app.playlist[index].title;
        notify(`Now playing`, title);
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

    function setIndex(value) {
      index = value;
    }

    function getIndex() {
      return index;
    }

    function setVolume(evt) {
      volumeLength = volumeBar.css('height');
      if (seeking && rightClick === false) {
        musicStatus.volume = moveBar(evt, volumeBar.parentNode, 'vertical') / 100;
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

    function radio(id) {
      if (!id) {
        $(".menu-left").removeClass('act-menu');
        $(".shadow").hide();
        document.querySelector(".radio-choise").style.display = "flex";
        setTimeout(() => { document.querySelector(".radio-choise").classList.toggle("active"); }, 100)
        return;
      }
      id = id.split(`v=`)[1];
      document.querySelector(".radio-choise").classList.toggle("active");
      setTimeout(() => { document.querySelector(".radio-choise").style.display = "none"; }, 100)
      if (!audio.paused) {
        audio.pause();
        playBtn.classList.remove('playing');
      }
      plActive();
      axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&&id=${id}&key=AIzaSyBBFxx0yqaUfX8V17A4M8UcAiOx-eKXYcs`)
        .then(res => {
          app.status.title = res.data.items[0].snippet.title;
          app.status.progress = `<i class="fas red fa-broadcast-tower"></i>`;
        })
      youtubeRadio = true;
      document.querySelector(".ap--play").style.display = "none";
      document.querySelector(".ap--pause").style.display = "none";
      document.querySelector(".ap-progress-container").style.display = "none";
      if (!document.getElementById("youtube-player")) {
        var e = document.getElementById("youtube-audio"),
          t = document.createElement("img");
        t.setAttribute("id", "youtube-icon"), t.style.cssText = "cursor:pointer;cursor:hand", e.appendChild(t);
        var a = document.createElement("div");
        a.setAttribute("id", "youtube-player"), e.appendChild(a);
        var o = function (e) {
          var a = e ? "IDzX9gL.png" : "quyUPXN.png";
          t.setAttribute("src", "https://i.imgur.com/" + a)
        };
        e.onclick = function () {
          radioPlayer.getPlayerState() === YT.PlayerState.PLAYING || radioPlayer.getPlayerState() === YT.PlayerState.BUFFERING ? (radioPlayer.pauseVideo(), o(!1)) : (radioPlayer.playVideo(), o(!0))
        };
        radioPlayer = new YT.Player("youtube-player", {
          height: "0",
          width: "0",
          videoId: id,
          playerVars: {
            autoplay: 1,
            loop: 1
          },
          events: {
            onReady: function (ee) {
              setInterval(() => {
                if (!youtubeRadio && e.style.display != "none") {
                  e.style.display = "none";
                  app.status.progress = "";
                  document.querySelector(".ap--play").style.display = null;
                  document.querySelector(".ap--pause").style.display = null;
                  document.querySelector(".ap-progress-container").style.display = null;
                  radioPlayer.pauseVideo();
                }
                radioPlayer.setVolume(parseFloat(audio.volume) * 100);
              }, 100)
              radioPlayer.setPlaybackQuality("small"), o(radioPlayer.getPlayerState() !== YT.PlayerState.CUED)
            },
            onStateChange: function (e) {
              e.data === YT.PlayerState.ENDED && o(!1)
            }
          }
        })
      } else {
        document.getElementById("youtube-audio").style.display = null;
        radioPlayer.loadVideoById(id);
        radioPlayer.playVideo();
      }
    }

    function destroy() {
      if (!apActive) return;
      playBtn.removeEventListener('click', playToggle, false);
      volumeBtn.removeEventListener('click', volumeToggle, false);
      repeatBtn.removeEventListener('click', repeatToggle, false);
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

    return { getIndex: getIndex, radio: radio, setIndex: setIndex, listHandler: listHandler, init: init, destroy: destroy, playToggle: playToggle, next: next, prev: prev, random: randomTrack, plActive: plActive, mute: volumeToggle, volumeUp: volumeUp, volumeDown: volumeDown };
  })();
  window.AP = AudioPlayer;
}

function refresh() {
  document.querySelector(`.container`).scrollTo(0, 0);
  AP.init({
    playList: db().query("SELECT * from music")
  });

  if (document.querySelector('#youtube').style.display != "none") {
    document.querySelector('#youtube').style.display = "none";
    document.querySelector('#pl').classList.remove("hide");
  }
  loaded = 0;
  isLoved = false;
}

function lovethis() {
  if(document.getElementsByClassName('pl-current')[0]) {
    love(parseInt(document.getElementsByClassName('pl-current')[0].getAttribute('real-id'), 10), document.getElementsByClassName('owo')[document.getElementsByClassName('pl-current')[0].getAttribute('data-track')]);
  } else {
    love(app.playlist.filter(y => y.dataId == AP.getIndex())[0].id);
  }
}

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

function love(id, el) {
  let track = db().query(`SELECT * from music where id=${id}`)[0];
  if (track.loved == true) {
    db().run(`UPDATE music SET loved=false WHERE id=${id};`);
    if(el) el.classList.remove("fav");
    notify('Removed from loved :c', `${track.title}`);
    if (isLoved == true) openloved();
  } else {
    notify('Added to loved :3', `${track.title}`);
    if(el) el.classList.add("fav");
    db().run(`UPDATE music SET loved=true WHERE id=${id};`);
  }
}

function openloved() {
  document.querySelector(`.container`).scrollTo(0, 0);
  isLoved = true;
  let lovedMas = [];

  db().query("SELECT * from music").forEach(l => {
    if (l.loved == true) lovedMas.push(l);
  })

  AP.init({
    playList: lovedMas
  });

  loaded = 0;

  if (document.querySelector('#youtube').style.display != "none") {
    document.querySelector('#youtube').style.display = "none";
    document.querySelector('#pl').classList.remove("hide");
  }
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

function winowClose() {
  db().run(`UPDATE status set dataId='${AP.getIndex()}', volume='${musicStatus.volume ? musicStatus.volume : 0.1}', loved='${isLoved ? "true" : "false"}'`);
  window.close();
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

function getRandomInt(min, max) { return Math.round(Math.random() * (max - min)) + min; };

$(document).on('click', 'a[href^="http"]', function (event) {
  event.preventDefault();
  shell.openExternal(this.href);
});
