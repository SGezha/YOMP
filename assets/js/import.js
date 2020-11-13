const mm = require('music-metadata');
async function addMusicFolder() {
  let dir = await remote.dialog.showOpenDialog({ title: 'Select Music Folder', properties: ['openDirectory'] });
  if (!dir.filePaths[0]) return;
  fs.readdir(dir.filePaths[0], function (err, items) {
    loadMusic();
    items.forEach((i, ind) => {
      setTimeout(() => {
        if (ind + 1 == items.length) loadMusic();
        if (i.toLocaleLowerCase().indexOf(".mp3") > -1) {
          let fiph = `${dir.filePaths[0]}/${i}`.split("\\").join("/");
          if (db().query(`SELECT * from music where file='${fiph}'`).length == 0) {
            // let metadata = NodeID3.read(`${dir.filePaths[0]}/${i}`);
            mm.parseFile(`${dir.filePaths[0]}/${i}`)
              .then(metadata => {
                metadata = metadata.common;
                console.log(metadata)
                let obj = {
                  title: i.split(".mp3").join(""),
                  file: fiph,
                  loved: "false"
                };
                obj.title = obj.title.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "");
                if (metadata.picture) {
                  fs.writeFileSync(`${root}/images/${obj.title}.jpg`, metadata.picture[0].data, 'binary');
                  obj.icon = encodeURI(`${root}/images/${obj.title}.jpg`);
                }
                db().insert('music', obj);
                document.getElementById("load-progress").innerHTML = `<div class="textload">${obj.title}</div> <span> ${ind + 1}/${items.length}</span>`;
              })
              .catch(err => {
                console.error(err.message);
              });            
          } else {
            document.getElementById("load-progress").innerHTML = `<div class="textload">${i.toLocaleLowerCase().split(".mp3")}</div> <span> ${ind + 1}/${items.length}</span>`;
          }
        }
      }, 500 * ind)
    })
  });
}

async function addosu() {
  let dir = await remote.dialog.showOpenDialog({ title: 'Select osu!/songs Folder', properties: ['openDirectory'] });
  if (!dir.filePaths[0]) return;
  fs.readdir(dir.filePaths[0], function (err, items) {
    checkDir(0, items, dir.filePaths[0]);
    notify("Success", "Start importing osu! songs, plz wait :)")
  });
}

function checkDir(ind, mas, dir) {
  if (ind + 1 == mas.length) {
    refresh();
    app.osuimport = `Import osu! songs`;
    notify("Success", "Importing osu! songs completed :3")
  } else {
    let i = mas[ind].split("~").join("").split("'").join("").split("^").join("");
    let songFolder = i;
    if (i.indexOf(".") == -1) {
      fs.readdir(`${dir}/${i}`, function (err, files) {
        let iffo = `${dir}/${i}`.split("\\").join("/").replace(/(\r\n|\n|\r)/gm, "");
        if (files && db().query(`SELECT * from music where dir='${iffo}'`).length == 0) {
          if (files.toString().indexOf(".osu") == -1) return checkDir(ind + 1, mas, dir);
          let already = false;
          files.forEach(f => {
            if (f.indexOf(".osu") > -1) {
              if (!already) {
                already = true;
                app.osuimport = `Importing ${ind + 1}/${mas.length}`;
                parseOsu(ind, mas, dir, songFolder, f, i, files);
              }
            }
          })
        } else { checkDir(ind + 1, mas, dir); }
      })
    } else { checkDir(ind + 1, mas, dir); }
  }
}

function parseOsu(ind, mas, dir, songFolder, f, i, files) {
  let info = fs.readFileSync(`${dir}\\${songFolder}\\${f}`.split("\\").join("/")).toString(),
    title = f.split(".osu").join(""),
    bmid = songFolder.split(" ")[0],
    full = "";
  if (info.indexOf("Artist:") > -1 && info.indexOf("Title:") > -1) title = `${info.split(`Artist:`)[1].split("\n")[0]} - ${info.split(`Title:`)[1].split("\n")[0]}`.replace(/(\r\n|\n|\r)/gm, "");
  if (info.indexOf("BeatmapSetID") > -1) bmid = info.split(`BeatmapSetID:`)[1].split("\n")[0];
  files.forEach(img => { if (img.indexOf(".jpg") > -1 || img.indexOf(".png") > -1) { full = img; } });
  if (info.indexOf("AudioFilename: ") > -1) {
    let obj = { bmid: bmid, title: title.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ""), icon: `${root}/images/${bmid}.jpg`.split("\\").join("/").replace(/(\r\n|\n|\r)/gm, ""), file: `${dir}/${songFolder}/${info.split(`AudioFilename: `)[1].split("\n")[0]}`.split("\\").join("/").replace(/(\r\n|\n|\r)/gm, ""), dir: `${dir}/${i}`.split("\\").join("/").replace(/(\r\n|\n|\r)/gm, ""), full: `${dir}/${songFolder}/${full}`.split("\\").join("/").replace(/(\r\n|\n|\r)/gm, ""), loved: "false" };
    saveOsu(obj, mas, dir, bmid, ind, i);
  } else { checkDir(ind + 1, mas, dir); }
}

function saveOsu(obj, mas, dir, bmid, ind) {
  if (db().query(`SELECT * from music where dir='${obj.dir}'`).length == 0) {
    axios.get(`https://assets.ppy.sh/beatmaps/${bmid}/covers/card.jpg`, { responseType: 'arraybuffer', validateStatus: false }).then(response => {
      fs.writeFileSync(`${root}/images/${bmid}.jpg`.split("\\").join("/").replace(/(\r\n|\n|\r)/gm, ""), Buffer.from(response.data, 'base64'));
      db().insert('music', obj);
      checkDir(ind + 1, mas, dir);
    }).catch(er => {
      checkDir(ind + 1, mas, dir);
    })
  } else { checkDir(ind + 1, mas, dir); }
}

function loadMusic() {
  if (document.getElementById('load-music').style.display == "" || document.getElementById('load-music').style.display == "none") {
    document.getElementsByClassName('menu-left')[0].classList.remove('act-menu');
    document.getElementsByClassName('shadow')[0].style.display = "none";
    document.getElementById('pl').style.display = "none";
    document.getElementById('ap').style.display = "none";
    document.querySelector(".radio-choise").style.display = "none";
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
    document.getElementById('ap').style.display = null;
    document.getElementById('load-music').style.display = null;
    document.querySelector(".radio-choise").style.display = null;
    document.getElementById('yomp').style.background = null;
    document.getElementsByClassName('main')[0].style.height = null;
    document.getElementsByClassName('maximize')[0].style.opacity = null;
    document.getElementsByClassName('minimize')[0].style.opacity = null;
    remote.getCurrentWindow().setSize(1000, 700);
    remote.getCurrentWindow().center();
  }
}
