function notify(title, body, bol) {
  if (db().query("SELECT * from settings")[0].notiturn == "false") {
    let icon = "assets/icons/icon.png";
    if ((title.toLocaleLowerCase().indexOf("now") > -1 && remote.getCurrentWindow().isFocused())) return;
    if (title.toLocaleLowerCase().indexOf("loved") > -1 && remote.getCurrentWindow().isFocused()) return M.toast({ html: `<i style="margin-right: 10px;" class="fas fa-heart owo ${title.split(" ")[0] == "Added" ? "fav" : ""}"></i> <span>${body}</span>` });
    if (db().query("SELECT * from settings")[0].notiloved == "true" && title.toLocaleLowerCase().indexOf("loved") > -1) return;
    if (db().query("SELECT * from settings")[0].notiadd == "true" && title.toLocaleLowerCase().indexOf("success") > -1) return;
    if (title.toLocaleLowerCase().indexOf("loved") > -1) icon = "assets/icons/notif-icon/i_loved.png";
    if (title.toLocaleLowerCase().indexOf("now") > -1) icon = "assets/icons/notif-icon/i_np.png";
    if (title.toLocaleLowerCase().indexOf("success") > -1) icon = "assets/icons/notif-icon/i_add.png";
    if (title.toLocaleLowerCase().indexOf("error") > -1) icon = "assets/icons/notif-icon/i_error.png";
    if (title.toLocaleLowerCase().indexOf("update") > -1) icon = "assets/icons/notif-icon/i_up.png";
    if (title.toLocaleLowerCase().indexOf("youtube") > -1 && bol) icon = "assets/icons/notif-icon/i_yt_finish.png";
    if (title.toLocaleLowerCase().indexOf("youtube") > -1 && !bol) icon = "assets/icons/notif-icon/i_yt_start.png";
    if (body.length > 40) body = body.substring(0, 40) + "...";
    // let noti = new Notification(title, { silent: true, silent: true, body: body, icon: icon });
    // if (title.toLocaleLowerCase().indexOf("update") > -1) {
    //   noti.onclick = () => {
    //     setsToggle();
    //   }
    // }
    if(app._data.playlist[AP.getIndex()]) icon = app._data.playlist[AP.getIndex()].icon;
    require('electron').ipcRenderer.send("notification", {title: title, body: body, img: icon})
  }
}
