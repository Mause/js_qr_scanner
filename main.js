navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia;

function QRScanner() {}
QRScanner.prototype = {
    gum_success: function gum_success(stream) {
        alert("Success!");
        this.video.src = window.URL.createObjectURL(stream)
        this.video.play();
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
        setTimeout(this.timerCallback.bind(this), 1500);
    },

    do_decode: function do_decode() {
        try {
            qrcode.decode();
        } catch (e) {
            console.log("Error: " + e);
        }
    },

    qrcode_callback: function qrcode_callback(data) {
        document.getElementById("data").innerHTML = data;
        // console.log(data);
    },

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

    ready: function ready() {
        'use strict';
        this.video = document.getElementById("video");
        this.c1 = document.getElementById("qr-canvas");
        this.ctx = this.c1.getContext("2d");

        this.video.addEventListener("play", this.play_callback.bind(this), false);

        qrcode.callback = this.qrcode_callback;
        qrcode.debug = true;

        navigator.getUserMedia(
            {video: {}},
            this.gum_success,
            this.gum_failure
        )
    }
}


$(document).ready(function(){

    alert(qrcode);

    try {
        new QRScanner().ready()
    } catch (e) {
        alert(e);
    }
})
