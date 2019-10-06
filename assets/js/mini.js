function miniPlayer() {
  if (document.getElementById('ap').style.transform == "translateY(180px)") {
    document.getElementById('hide-progres').style.display = "none";
    document.getElementById('ap').style.transform = "translateY(0px)";
    document.getElementById('hide-progres').style.width = `100%`;
    document.getElementById('hide-progres').style.display = "block";
  } else {
    document.getElementById('hide-progres').style.display = "block";
  }
  document.getElementById('pl').style.display = "none";
  document.getElementsByClassName('center')[0].style.display = "none";
  document.getElementsByClassName('top')[0].style.display = "none";
  document.getElementsByClassName('main')[0].style.background = "transparent";
  document.getElementsByClassName('bottom')[0].style.position = "absolute";
  document.getElementsByClassName('bottom')[0].style.bottom = "0";
  remote.getCurrentWindow().setSize(screen.availWidth, 55);
  remote.getCurrentWindow().setPosition(0, screen.availHeight - 55);
  remote.getCurrentWindow().setSkipTaskbar(true);
  remote.getCurrentWindow().focus();
  mini = true;
  ping = 5;
}

setInterval(() => {
  if (ping != false) {
    if (!$('#ap').is(':hover') && document.getElementById('ap').style.transform != "translateY(180px)") {
      if (ping == 1 && mini == true) {
        document.getElementsByClassName('ap-volume')[0].style.height = null;
        document.getElementsByClassName('ap-volume')[0].style.visibility = null;
        document.getElementsByClassName('ap-volume-container')[0].style.background = null;
        document.getElementById('ap').style.transform = `translateY(180px)`;
        remote.getCurrentWindow().hide();
        ping = false;
      } else {
        if (mini == true) {
          ping--;
          document.getElementById('hide-progres').style.width = `${((ping - 1) * 2) * 10}%`;
        }
      }
    }
  };
}, 1000)

function miniPlayerOff() {
  if (document.getElementById('ap').style.transform == "translateY(180px)") document.getElementById('ap').style.transform = `translateY(0px)`;
  remote.getCurrentWindow().focus();
  document.getElementById('pl').style.display = "block";
  document.getElementById('hide-progres').style.display = "none";
  document.getElementsByClassName('center')[0].style.display = null;
  document.getElementsByClassName('top')[0].style.display = "flex";
  document.getElementsByClassName('main')[0].style.background = "var(--bg)";
  document.getElementsByClassName('bottom')[0].style.position = null;
  document.getElementsByClassName('bottom')[0].style.bottom = null;
  remote.getCurrentWindow().setSize(1000, 700);
  remote.getCurrentWindow().center();
  remote.getCurrentWindow().setSkipTaskbar(false);
  mini = false;
}
