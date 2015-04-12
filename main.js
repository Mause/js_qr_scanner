navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia;



function getSources() {
    var def = $.Deferred();

    window.MediaStreamTrack.getSources(function(sources){
        def.resolve(sources);
    });

    return def;
}

function color(c) {
    document.getElementsByClassName("match")[0].style['background-color'] = c;
}

function QRScanner() {
    this.videos_idx = 0;
    this.api = null;
    qrcode.debug = true;
    this.lock = false;
}
QRScanner.prototype = {
    gum_success: function gum_success(stream) {
        console.log(stream);
        this.video.src = window.URL.createObjectURL(stream)
    },

    gum_failure: function gum_failure(error) {
        alert("Failed!");
    },

    timerCallback: function timerCallback() {
        if (this.video.paused || this.video.ended) {
            return;
        }

        this.ctx.drawImage(this.video, 0, 0)

        this.do_decode();
        setTimeout(this.timerCallback.bind(this), 125);
    },

    do_decode: function do_decode() {
        try {
            this.qrcode_callback(qrcode.decode());
        } catch (e) {
            if (e !== "Couldn't find enough finder patterns") {
                console.log("Error: " + e);
            }
        }
    },

    qrcode_callback: _.debounce(function qrcode_callback(data) {
        document.getElementById("data").innerHTML = data;

        if (!/^[0-9]+\$\$[a-z0-9]+\$\$[A-Za-z0-9]+$/.exec(data)) {
            document.getElementById("data").innerHTML += " is invalid";
            return;
        }

        while(this.lock) {}
        this.lock = true;
        color("green");
        this.api.scanRequest(data);
        this.lock = false;
        setTimeout('color("red")', 500);
    }, 500),

    play_callback: function play_callback() {
        setTimeout(
            function(){
                this.c1.width = this.video.videoWidth;
                this.c1.height = this.video.videoHeight;
            }.bind(this),
            125
        )

        this.timerCallback();
    },

    getSourcesCallback: function getSourcesCallback(sources) {
        var videos = (
            sources
            .filter(function(q) { return q.kind == "video" })
        )
        var env = videos.filter(function(q) { return q.facing == "environment" });
        if (env.length != 0) videos = env;

        this.getUserMedia(videos[0].id);
    },

    getCamera: function getCamera() {
        if (typeof MediaStreamTrack !== "undefined") {
            getSources().then($.proxy(this.getSourcesCallback, this));
        } else {
            this.getUserMedia();
        }
    },

    getUserMedia: function getUserMedia(id) {
        var video = (
            (id !== undefined) ?
            {optional: [{sourceId: id}]} :
            {}
        )

        navigator.getUserMedia(
            {'video': video},
            $.proxy(this.gum_success, this),
            this.gum_failure
        )
    },

    ready: function ready() {
        'use strict';
        this.video = document.getElementById("video");
        this.c1 = document.getElementById("qr-canvas");
        this.ctx = this.c1.getContext("2d");

        this.video.addEventListener("play", this.play_callback.bind(this), false);

        this.api = new QrAPI(
            "/ticket/signin",
            prompt("API password?")
        );

        this.getCamera();
    }
}

var inst = new QRScanner();


if (navigator.getUserMedia) {
    $(document).ready(function(){
        try {
            inst.ready()
        } catch (e) {
            alert(e);
        }
    })
} else {
    alert("No getUserMedia support");
}
