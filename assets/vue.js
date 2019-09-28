var app = new Vue({
  el: '#yomp',
  data: {
    playlist: [],
    loved: [],
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
