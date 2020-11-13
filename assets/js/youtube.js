const DownloadYTFile = require('yt-dl-playlist')

const downloader = new DownloadYTFile({
  outputPath: `${root}/youtube/`,
  ffmpegPath: `${ffmpeg}/bin/ffmpeg.exe`,
  maxParallelDownload: 10,
  fileNameGenerator: (videoTitle) => {
    return `${videoTitle.replace(/[|&\/\\#,+()$~%.'":*?<>{}]/g, "")}.mp3`
  }
})

async function ffmpegSelect() {
  let dir = await remote.dialog.showOpenDialog({ title: 'Select ffmpeg Folder', properties: ['openDirectory'] });
  if (!dir.filePaths[0]) return;
  fs.writeFileSync(`${root}/ffmpeg.txt`, dir.filePaths[0]);
  ffmpeg = fs.readFileSync(`${root}/ffmpeg.txt`).toString();
}

function openYoutube() {
  $(".menu-left").removeClass('act-menu');
  $(".shadow").hide();
  document.querySelector(".youtube-choise").style.display = "flex";
  setTimeout(() => { document.querySelector(".youtube-choise").classList.toggle("active"); }, 100)
  return;
}

function youtube(vid, title, icon) {
  vid = vid.split(`v=`)[1].split("&")[0];
  if (db().query(`SELECT * from music where videoId='${vid}'`).length > 0) return notify('Error', 'Song already in playlist :3');
  downloader.download(vid);
  let obj = {};
  let load = 0;
  document.querySelector('.youtube-b').innerHTML = "Getting info...";
  downloader.on('start', (fileInfo) => {
    console.log(fileInfo);
    notify('YouTube', `${fileInfo.ref.title} download`, false);
    obj = { title: `${fileInfo.ref.title.replace(/[&|\/\\#,+()$~%.'":*?<>{}]/g, "")}`, icon: `${fileInfo.ref.thumbnail.url}`, file: `${fileInfo.filePath}`, videoId: vid, loved: "false" };
  })
  downloader.on('video-info', (fileInfo, video) => {
    console.log({ fileInfo, video })
  })
  downloader.on('video-setting', (fileInfo, settings) => {
    console.log({ fileInfo, settings })
  })
  downloader.on('progress', (fileInfo) => {
    console.log(fileInfo);
    if(load == 0) {
      document.querySelector('.youtube-b').innerHTML = "Downloading.";
      load++;
    } else if(load == 1) {
      load++;
      document.querySelector('.youtube-b').innerHTML = "Downloading..";
    } else if(load == 2) {
      document.querySelector('.youtube-b').innerHTML = "Downloading...";
      load = 0;
    }
    document.querySelector('#youtube-id').value = fileInfo.ref.title;
  })
  downloader.on('complete', (fileInfo) => {
    document.querySelector(".youtube-choise").classList.toggle("active");
    setTimeout(() => { document.querySelector(".youtube-choise").style.display = "none"; }, 100)
    axios.get(obj.icon, { responseType: 'arraybuffer' }).then(response => {
      fs.writeFileSync(`${root}/images/${obj.videoId}.jpg`.split("\\").join("/"), Buffer.from(response.data, 'base64'));
      db().insert('music', {
        title: obj.title.replace(/[|&\/\\#,+()$~%.'":*?<>{}]/g, ""),
        icon: `${root}/images/${obj.videoId}.jpg`.split("\\").join("/"),
        file: `${root}/youtube/${fileInfo.fileName}`,
        videoId: obj.videoId,
        loved: "false"
      });
      notify("YouTube", `Download ${obj.title} complete :3`, true);
      document.querySelector('#youtube-id').value = "";
      document.querySelector('.youtube-b').innerHTML = "Download";
      refresh();
    }).catch(er => { })
  })
  downloader.on('error', (fileInfo) => console.log(fileInfo.error))
}

function ytDownlaod() {
  obj = ytQuery[0];
  remote.require("electron-download-manager").download({
    url: obj.url,
    onProgress: (p, r) => {
      let text = "";
      ytQuery.forEach((r, ind) => { text += `${ind + 1}. ${r.title}\n`; });
      document.getElementById("yt").innerHTML = `YouTube ${p.progress.toFixed(0)}% <i onclick="clearYT()" title="${text}" class="fas tooltipped fa-download"></i> ${ytQuery.length}`;
    }
  }, function (error, info) {
    if (error) {
      notify('Error', 'Copyright or NOT FOUND');
      return;
    }
    axios.get(obj.icon, { responseType: 'arraybuffer' }).then(response => {
      fs.writeFileSync(`${root}/images/${obj.videoId}.jpg`.split("\\").join("/"), Buffer.from(response.data, 'base64'));
      fs.rename(info.filePath, `${root}/youtube/${obj.videoId}.mp3`, function (err) {
        if (err) { console.log(err) };
        db().insert('music', {
          title: obj.title.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ""),
          icon: `${root}/images/${obj.videoId}.jpg`.split("\\").join("/"),
          file: `${root}/youtube/${obj.videoId}.mp3`,
          videoId: obj.videoId,
          loved: "false"
        });
        notify("YouTube", `Download ${obj.title} complete :3`, true);
        ytQuery = ytQuery.filter(y => y.videoId != obj.videoId);
        if (ytQuery.length > 0) {
          ytDownlaod();
        } else {
          document.getElementById("yt").innerHTML = `YouTube`;
        }
      });
    }).catch(er => { })
  });
}

function clearYT() {
  document.getElementById("yt").innerHTML = `YouTube`;
  ytQuery = [];
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
