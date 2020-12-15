function miniPlayer() {
  if (document.getElementById('ap').style.transform == "translateY(180px)") {
    document.getElementById('ap').style.transform = "translateY(0px)";
  } else {
  }
  document.getElementById('pl').style.display = "none";
  document.getElementsByClassName('center')[0].style.display = "none";
  document.getElementsByClassName('top')[0].style.transform = "scale(0)";
  document.getElementsByClassName('main')[0].style.background = "transparent";
  document.getElementsByClassName('bottom')[0].style.position = "absolute";
  document.getElementsByClassName('bottom')[0].style.bottom = "0";
  document.querySelector('.ap--settings').style.display = 'none';
  document.querySelector('.ap--playback').style.maxWidth = '110px';
  document.querySelector('.ap--playback').style.flex = '0 0 110px';
  document.querySelector('.ap--track').style.maxWidth = '280px';
  document.querySelector('.ap--track').style.width = '-webkit-fill-available';
  document.querySelector('.ap--track').style.flex = '0 0 280px';
  document.querySelector('.bottom').style.height = '40px';
  document.querySelector('.ap').style.borderRadius = '7px 0 0 0';
  remote.getCurrentWindow().setSize(400, 40);
  remote.getCurrentWindow().setAlwaysOnTop(true);
  remote.getCurrentWindow().setPosition(screen.availWidth - 400, screen.availHeight - 40);
  remote.getCurrentWindow().setSkipTaskbar(true);
  remote.getCurrentWindow().focus();
  mini = true;
}

function miniPlayerOff() {
  if (document.getElementById('ap').style.transform == "translateY(180px)") document.getElementById('ap').style.transform = `translateY(0px)`;
  remote.getCurrentWindow().focus();
  document.getElementById('pl').style.display = "block";
  document.getElementsByClassName('center')[0].style.display = null;
  document.getElementsByClassName('top')[0].style.transform = "scale(1)";
  document.getElementsByClassName('main')[0].style.background = "var(--bg)";
  document.getElementsByClassName('bottom')[0].style.position = null;
  document.getElementsByClassName('bottom')[0].style.bottom = null;
  document.querySelector('.ap--settings').style.display = 'flex';
  document.querySelector('.ap--playback').style.maxWidth = null;
  document.querySelector('.ap--playback').style.flex = null;
  document.querySelector('.ap--track').style.maxWidth = null;
  document.querySelector('.ap--track').style.width = null;
  document.querySelector('.ap--track').style.flex = null;
  document.querySelector('.bottom').style.height = null;
  document.querySelector('.ap').style.borderRadius = null;
  remote.getCurrentWindow().setAlwaysOnTop(false);
  remote.getCurrentWindow().setSize(1000, 700);
  remote.getCurrentWindow().center();
  remote.getCurrentWindow().setSkipTaskbar(false);
  mini = false;
}
