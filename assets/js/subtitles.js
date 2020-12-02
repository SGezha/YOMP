const convert = require('xml-js');

let timer = 0;
let text;
let NowVideoId

function getText() {
    if(!caption) return TextStop();
    TextStop();
    text = [];
    let stroka = "";
    let lastStroka = "";
    let x = document.getElementById("snackbar");
    let now = app._data.playlist[AP.getIndex()];
    if (now.videoId == null) return console.log("No text");
    axios.get(`http://video.google.com/timedtext?type=track&v=${now.videoId}&id=0&lang=en`).then(res => {
        if (res.data != false) text = JSON.parse(convert.xml2json(res.data, { compact: true, spaces: 4 })).transcript.text;
        if(text.length == 0) {
            axios.get(`http://video.google.com/timedtext?type=track&v=${now.videoId}&id=0&lang=ru`).then(res => {
                if (res.data != false)text = JSON.parse(convert.xml2json(res.data, { compact: true, spaces: 4 })).transcript.text;
            })
            if(text.length == 0) {
                axios.get(`http://video.google.com/timedtext?type=track&v=${now.videoId}&id=0&lang=uk`).then(res => {
                    if (res.data != false)text = JSON.parse(convert.xml2json(res.data, { compact: true, spaces: 4 })).transcript.text;
                })
            }
        }
        NowVideoId = now.videoId;
    })
    timer = setInterval(() => {
        if (text.find(a => Number(a._attributes.start).toFixed(0) == audio.currentTime.toFixed(0)) != undefined) stroka = text.find(a => Number(a._attributes.start).toFixed(0) == audio.currentTime.toFixed(0))._text;

        if (stroka != undefined && lastStroka != stroka) {
            x.innerText = stroka.split("\n").join(" ").replace(/( |<([^>]+)>)/ig, " ").replace(/[^\p{Alpha}\p{M}\p{Nd}\p{Pc}\p{Join_C} ’ " ` : - .]/gu, "").replace(/[0-9]/g, '');
            lastStroka = stroka;
            x.classList.add("show");
            animText(text.find(a => Number(a._attributes.start).toFixed(0) == audio.currentTime.toFixed(0))._attributes.dur);
        }


    }, 1000);
}

function TextStop() {
    document.getElementById("snackbar").className = document.getElementById("snackbar").className.replace("show", "");
    clearTimeout(timer);
    timer = 0;
}

function animText(dur) {
    var s,
    spanizeLetters = {
      settings: {
        letters: $('.js-spanize'),
      },
      init: function() {
        s = this.settings;
        this.bindEvents();
      },
      bindEvents: function(){
        s.letters.html(function (i, el) {
          //spanizeLetters.joinChars();
          var spanizer = $.trim(el).split("");
          return '<span style="display: inline-block">' + spanizer.join('</span><span style="display: inline-block">') + '</span>';
        });
      },
    };
    spanizeLetters.init();
}
