function youtube(vid, title, icon) {
  if (db().query(`SELECT * from music where videoId='${vid}'`).length > 0) return notify('Error', 'Song already in playlist :3');
  $.get("https://images" + ~~(Math.random() * 33) + "-focus-opensocial.googleusercontent.com/gadgets/proxy?container=none&url=https%3A%2F%2Fwww.youtube.com%2Fget_video_info%3Fvideo_id%3D" + vid, function (data) {
    if (data.indexOf("errorcode=150") > -1) return notify('Error', 'Copyright');
    var data = parse_str(data),
      streams = (data.url_encoded_fmt_stream_map + ',' + data.adaptive_fmts).split(',');
    if (data.url_encoded_fmt_stream_map == "") return notify('Error', 'Copyright or NOT FOUND');
    $.each(streams, function (n, s) {
      let stream = parse_str(s),
        itag = stream.itag * 1,
        quality = false;
      switch (itag) {
        case 139: quality = "48kbps"; break;
        case 140: quality = "128kbps"; break;
        case 141: quality = "256kbps"; break;
      }
      if (quality) {
        notify('YouTube', `${title} added to download queue`, false);
        let obj = { url: stream.url, title: title, icon: icon, file: `${root}/youtube/${title}.mp3`, videoId: vid, loved: "false" };
        if(ytQuery.length == 0) {
          ytQuery.push(obj);
          ytDownlaod(obj);
        } else {
          ytQuery.push(obj);
        }
        let text = "";
      }
    });
  })
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
        if (err) {console.log(err)};
        db().insert('music', {
          title: obj.title.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, ""),
          icon: `${root}/images/${obj.videoId}.jpg`.split("\\").join("/"),
          file: `${root}/youtube/${obj.videoId}.mp3`,
          videoId: obj.videoId,
          loved: "false"
        });
        notify("YouTube", `Download ${obj.title} complete :3`, true);
        ytQuery = ytQuery.filter(y => y.videoId != obj.videoId);
        if(ytQuery.length > 0) {
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
