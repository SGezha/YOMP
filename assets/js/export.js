const NodeID3 = require('node-id3')

async function exportLoved() {
  let dir = await remote.dialog.showOpenDialog({ title: 'Select osu!/songs Folder', properties: ['openDirectory'] });
  let exportLoved = [];
  db().query("SELECT * from music").forEach(m => { if (m.loved == 1) exportLoved.push(m); });
  if (dir.filePaths[0]) {
    setsToggle();
    loadMusic();
    exportProces(0, exportLoved, dir);
  }
}

async function exportAll() {
  let dir = await remote.dialog.showOpenDialog({ title: 'Select osu!/songs Folder', properties: ['openDirectory'] });
  if (dir.filePaths[0]) {
    setsToggle();
    loadMusic();
    exportProces(0, db().query("SELECT * from music"), dir);
  }
}

function exportProces(id, mas, dir) {
  if (id == mas.length) return loadMusic();
  let e = mas[id];
  document.getElementById("load-progress").innerHTML = `<div class="textload">${e.title}</div> <span> ${id + 1}/${mas.length}</span>`;
  fs.copyFile(e.file, `${dir.filePaths[0]}/${e.title}.mp3`, (err) => {
    if (err) throw err;
    let metadata = {
      title: e.title.split(" - ")[1],
      artist: e.title.split(" - ")[0],
      APIC: e.full ? decodeURI(e.full) : decodeURI(e.icon)
    }
    NodeID3.update(metadata, `${dir.filePaths[0]}/${e.title}.mp3`, function (err, buffer) { exportProces(id + 1, mas, dir); })
  });
}
