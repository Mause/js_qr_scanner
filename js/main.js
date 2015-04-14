function color(c) {
    document.getElementsByClassName("match")[0].style['background-color'] = c;
}

function QRScanner(callback) {
    this.lock = false;
    this.callback = callback;
}
QRScanner.prototype = {
    gum_success: function gum_success(stream) {
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

        this.callback(data);
    }, 500),

    play_callback: function play_callback() {
        setTimeout(
            function(){
                this.c1.width = this.video.videoWidth;
                this.c1.height = this.video.videoHeight;
            }.bind(this),
            125
        );

        this.timerCallback();
    },

    ready: function ready() {
        'use strict';
        this.video = document.getElementById("video");
        this.c1 = document.getElementById("qr-canvas");
        this.ctx = this.c1.getContext("2d");

        this.video.addEventListener(
            "play", $.proxy(this.play_callback, this), false
        );
    },

    obtainAndConnectCamera: function obtainAndConnectCamera() {
        getCamera().then(
            $.proxy(this.gum_success, this),
            $.proxy(this.gum_failure, this)
        )
    }
}



function App() {
    this.api = null;
    this.camera = null;
    this.scanner = null;
}
App.prototype = {
    scanRequestSuccess: function scanRequestSuccess(data) {
        this.lock = false;
        setTimeout('color("red")', 100);

        console.log(data);
        alert(this.messageFromData(data));
    },

    messageFromData: function messageFromData(data) {
        if (data.status < 1) {
            var error;

            if (data.error.length <= 0) {
                error = "Unknown error occured";
            } else {
                error = data.error;
            }
            return error;

        } else if (data.paid < 1){
            return "Hasn't paid!";

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

            return successMessage;
        }
    },

    api_caller: function api_caller(data) {
        this.api.scanRequest(data).then(
            $.proxy(this.scanRequestSuccess, this)
        )
    },

    ready: function ready() {
        this.api = new QrAPI(
            "/ticket/signin",
            this.getPassword()
        );
        this.scanner = new QRScanner(this.api_caller);
        this.scanner.ready();
        this.scanner.obtainAndConnectCamera();
    },

    getPassword: function getPassword() {
        if (localStorage.getItem("password") == null) {
            localStorage.setItem("password", prompt("API password?"));
        }

        return localStorage.getItem("password");
    }
}


var inst = new App();
$(document).ready(function(){
    if (!navigator.getUserMedia) {
        alert("No getUserMedia support");

    } else if (!Modernizr.localstorage) {
        alert("No localstorage support");

    } else {
        // try {
            inst.ready()
        // } catch (e) {
        //     alert(e);
        // }
    }
});
