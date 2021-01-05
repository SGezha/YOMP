var app = new Vue({
  el: '#yomp',
  data: {
    playlist: [],
    loved: [],
    ver: 0,
    youtuberesult: [],
    osuimport: "Import osu! songs",
    status: {
      title: "",
      progress: "",
      id: 0
    }
  },
  methods: {
    search() {
      axios.get("https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + document.getElementById("search").value + "&maxResults=50&key=AIzaSyBBFxx0yqaUfX8V17A4M8UcAiOx-eKXYcs")
        .then(res => {
          if (document.getElementById('pl').classList.length == 1) document.getElementById('pl').classList.add("hide");
          this.youtuberesult = [];
          res.data.items.forEach(v => {
            if (v.id.kind == "youtube#video") {
              this.youtuberesult.push(v);
            }
          })
        })
    }
  }
})

function searchbtn() {
  app.search();
  document.getElementById(`youtube`).style.display = "block";
}

document.getElementById("search").onchange = function (e) {
  let youtuberesult = [];
  if (document.getElementById('pl').classList.length == 2) { app.search(); } else {
    let base = db().query("SELECT * from music");
    if (isLoved) {
      base = [];
      db().query("SELECT * from music").forEach(m => {
        if (m.loved == true) base.push(m);
      })
    }
    if (base.length == 0) return;
    if (document.getElementById("pl").classList.length == 2) return;
    let result = [];
    let input = document.getElementById('search');
    var l = input.value.length;
    axios.get("https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + document.getElementById("search").value + "&maxResults=10&key=AIzaSyB5jdwiBYfFWBpnHTfc-XA544A8RLvaL_s").then(res => {
      res.data.items.forEach(v => {
        if (v.id.kind == "youtube#video") {
          result.push({
            icon: v.snippet.thumbnails['high'].url,
            title: v.snippet.title,
            bmid: null,
            category: null,
            dataId: 3,
            dir: null,
            fav: ``,
            file: ``,
            full: null,
            hide: true,
            need: true,
            id: -0,
            loved: `false`,
            type: `<i class="fab fa - youtube"></i>`,
            videoId: v.id.videoId
          })
        }
      })
      readyFind();
    }).catch(er => {
      readyFind();
    })
    function readyFind() {
      if (l > 0) {
        for (var i = 0; i < base.length; i++) {
          let title = base[i].title;
          if (title.toLowerCase().match(input.value.toLowerCase())) {
            result.push(base[i]);
          }
        }
        AP.init({
          playList: result
        });
        loaded = 0;
      } else {
        if (!isLoved) { refresh(); } else { openloved(); }
      }
    }
  }
};
