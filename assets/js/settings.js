function clearDir(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file, index) {
      let curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) { deleteFolderRecursive(curPath); } else { fs.unlinkSync(curPath); }
    });
  }
};

function clearPl() {
  M.toast({ html: 'Playlist cleared' });
  clearDir(`${root}/images`);
  clearDir(`${root}/full`);
  clearDir(`${root}/youtube`);
  db().run("DROP TABLE music");
  db().run("DROP TABLE status");
  db().run(`CREATE TABLE IF NOT EXISTS status(dataId INTEGER, realId INTEGER, volume INTEGER, loved VARCHAR(5));`);
  db().run(`CREATE TABLE IF NOT EXISTS music(id INTEGER PRIMARY KEY, title VARCHAR(150), bmid VARCHAR(150), category VARCHAR(150), dir VARCHAR(150) , file VARCHAR(999) , icon VARCHAR(150) , full VARCHAR(150) , loved BOOLEAN , videoId VARCHAR(11));`);
  db().run(`INSERT INTO status(dataId,realId,volume,loved) VALUES(0, 0, 0.1, "false");`);
  refresh();
}

function setsSave() {
  db().run("DROP TABLE settings");
  db().run(`CREATE TABLE IF NOT EXISTS settings( notiturn VARCHAR(5),notiloved VARCHAR(5) ,notiadd VARCHAR(5) ,keyplay VARCHAR(99) ,keyrandom VARCHAR(99) ,keylove VARCHAR(99) ,keynext VARCHAR(99) ,keyprev VARCHAR(99) ,keyfocus VARCHAR(99) ,keymini VARCHAR(99) ,keyvolumeup VARCHAR(99) ,keyvolumedown VARCHAR(99) ,keymute VARCHAR(99));`);
  db().run(`INSERT INTO settings(notiturn,notiloved,notiadd,keyplay,keyrandom,keylove,keynext,keyprev,keyfocus,keymini,keyvolumeup,keyvolumedown,keymute) VALUES('${document.getElementById('noti-turn').checked}','${document.getElementById('noti-loved').checked}','${document.getElementById('noti-youtube').checked}','${document.getElementById('key-toggle').value}','${document.getElementById('key-random').value}','${document.getElementById('key-love').value}','${document.getElementById('key-next').value}','${document.getElementById('key-prev').value}','${document.getElementById('key-minioff').value}','${document.getElementById('key-mini').value}','${document.getElementById('key-volup').value}','${document.getElementById('key-voldown').value}','${document.getElementById('key-mute').value}');`);
  remote.app.relaunch();
  remote.app.exit();
}

function setsToggle() {
  document.querySelector(`#settings`).style.display = document.querySelector(`#settings`).style.display == "block" ? "none" : "block";
  setTimeout(() => {
    $("#settings").toggleClass('openmodal');
    $(".menu-left").removeClass('act-menu');
    $(".shadow").hide();
  }, 100)
}

function offKey(el) { document.getElementById(el.getAttribute('dlya')).value = ""; }

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

function loadSettings() {
  if (db().query("select * from settings")[0].notiturn == "true") document.getElementById('noti-turn').checked = true;
  if (db().query("select * from settings")[0].notiloved == "true") document.getElementById('noti-loved').checked = true;
  if (db().query("select * from settings")[0].notiadd == "true") document.getElementById('noti-youtube').checked = true;
  if (db().query("select * from settings")[0].keyplay == "") document.getElementsByClassName('check-key-input')[0].checked = true;
  if (db().query("select * from settings")[0].keynext == "") document.getElementsByClassName('check-key-input')[1].checked = true;
  if (db().query("select * from settings")[0].keyprev == "") document.getElementsByClassName('check-key-input')[2].checked = true;
  if (db().query("select * from settings")[0].keyrandom == "") document.getElementsByClassName('check-key-input')[3].checked = true;
  if (db().query("select * from settings")[0].keyvolumeup == "") document.getElementsByClassName('check-key-input')[4].checked = true;
  if (db().query("select * from settings")[0].keyvolumedown == "") document.getElementsByClassName('check-key-input')[5].checked = true;
  if (db().query("select * from settings")[0].keymute == "") document.getElementsByClassName('check-key-input')[6].checked = true;
  if (db().query("select * from settings")[0].keylove == "") document.getElementsByClassName('check-key-input')[7].checked = true;
  if (db().query("select * from settings")[0].keymini == "") document.getElementsByClassName('check-key-input')[8].checked = true;
  if (db().query("select * from settings")[0].keyfocus == "") document.getElementsByClassName('check-key-input')[9].checked = true;
  document.getElementById('key-toggle').value = db().query("select * from settings")[0].keyplay;
  document.getElementById('key-next').value = db().query("select * from settings")[0].keynext;
  document.getElementById('key-prev').value = db().query("select * from settings")[0].keyprev;
  document.getElementById('key-random').value = db().query("select * from settings")[0].keyrandom;
  document.getElementById('key-volup').value = db().query("select * from settings")[0].keyvolumeup;
  document.getElementById('key-voldown').value = db().query("select * from settings")[0].keyvolumedown;
  document.getElementById('key-mute').value = db().query("select * from settings")[0].keymute;
  document.getElementById('key-love').value = db().query("select * from settings")[0].keylove;
  document.getElementById('key-mini').value = db().query("select * from settings")[0].keymini;
  document.getElementById('key-minioff').value = db().query("select * from settings")[0].keyfocus;
}
