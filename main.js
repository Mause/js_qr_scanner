navigator.getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia;

// function alert(str) {
//     document.getElementById("alert").innerHTML += (
//         "" + str + "<br/>"
//     )
// }

function QrAPI(apiUrl, apiPassword) { this.apiUrl = apiUrl; }
QrAPI.prototype = {
    getHistory: function getHistory() {
        return $.getJSON(
            this.apiUrl,
            {
                qrcode: "",
                password: this.apiPassword
            }
        );
    },

    scanRequest: function scanRequest(barcode) {
        'use strict';
        return $.post(
            this.apiUrl,
            {
                qrcode: barcode,
                password: this.apiPassword
            },
            function success(data) {
                if (data.status < 1) {
                    var error;

                    if (data.error.length <= 0) {
                        error = "Unknown error occured";
                    } else {
                        error = data.error;
                    }
                    alert(error);

                } else if (data.paid <= 0){
                    alert("Hasn't paid!");

                } else {
                    var user = data.user.user,
                        firstName = user.first_name,
                        lastName = user.last_name,
                        successMessage = "";

                    if (firstName.length > 0) {
                        successMessage = firstName;
                        if (lastName.length > 0) {
                            successMessage += lastName;
                        }
                    } else {
                        successMessage = "Sign-in successful";
                    }

                    alert(successMessage);
                }
            },
            'json'
        )
    }
}

function QRScanner() {}
QRScanner.prototype = {
    gum_success: function gum_success(stream) {
        // alert("Success!");
        this.video.src = window.URL.createObjectURL(stream)
        this.api = new QrAPI(
            "http://requestb.in/14zv6j91",
            "password"
        );
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
            qrcode.decode();
        } catch (e) {
            console.log("Error: " + e);
        }
    },

    qrcode_callback: function qrcode_callback(data) {
        document.getElementById("data").innerHTML = data;
        this.api.scanRequest(data);
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
        this.api = null;

        this.video.addEventListener("play", this.play_callback.bind(this), false);

        qrcode.callback = $.proxy(this.qrcode_callback, this);
        qrcode.debug = true;

        navigator.getUserMedia(
            {video: {}},
            $.proxy(this.gum_success, this),
            this.gum_failure
        )
    }
}


$(document).ready(function(){

    // alert(qrcode);

    try {
        new QRScanner().ready()
    } catch (e) {
        alert(e);
    }
})
