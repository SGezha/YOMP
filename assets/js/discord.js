function discordUpdate() {
  let progress = "";
  for (let i = 0; i < 10; i++) {
    if (parseInt(musicStatus.progress / 10).toFixed(0) > i) {
      progress += "-";
    } else if (parseInt(musicStatus.progress / 10).toFixed(0) == i) {
      progress += "●";
    } else {
      progress += "-"
    }
  }
  if (document.getElementsByClassName('pl-current')[0]) {
    ipc.send("rpc", {
      status: "playing",
      title: document.querySelector('.ap-title').innerHTML,
      progress: `${musicStatus.curTime} [${progress}] ${musicStatus.durTime}`
    });
  } else {
    ipc.send("rpc", {
      status: "paused",
      title: document.querySelector('.ap-title').innerHTML,
      progress: `${musicStatus.curTime} [${progress}] ${musicStatus.durTime}`
    });
  }
  setTimeout(() => { discordUpdate() }, 1000);
}
