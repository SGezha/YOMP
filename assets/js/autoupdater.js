function checkUpdate(auto) {
  let ver = JSON.parse(fs.readFileSync(`${__dirname}/package.json`).toString()).version;
  axios.get(`https://4kc-version.glitch.me/yomp`).then(res => {
    let r = res.data;
    if (ver != r.ver && auto) notify("Update", `New ${r.ver} version available to download, check settings :3`);
    if (ver == r.ver && !auto) notify("Update", `You use latest version :P`);
    if (ver != r.ver && !auto) {
      notify("Update", `New version ${r.ver} started to download c:`);
      let osp = os.platform(),
        arch = os.arch().split("x").join("");
      if (osp.indexOf("win") > -1) osp = "win";
      remote.require("electron-download-manager").download({
        url: r[osp + arch],
        onProgress: (p) => {
          document.getElementById("upda").innerHTML = `UPDATE ${p.progress.toFixed(0)}%`
        }
      }, function (error, info) {
        if (error) { console.log(error); return; }
        notify("Update", `Download update complete :>`);
        child(`${info.filePath.toString().split("\\").join("/")}`, function (err, data) {
          if (err) { console.error(err); return; }
        });
        setTimeout(() => {
          window.close();
        }, 1000)
      });
    }
  })
}
