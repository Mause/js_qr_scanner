var DEBUG = location.search.indexOf('debug') != -1;

var log_messages_prop_type = React.PropTypes.arrayOf(
    React.PropTypes.shape({
        "timestamp": React.PropTypes.date,
        "message": React.PropTypes.string
    })
).isRequired;



function render_user(user) {
    if (typeof user === "undefined") return "";

    var user = user.user,
        firstName = user.first_name,
        lastName = user.last_name,
        rendered = "";

    if (firstName.length > 0) {
        rendered = firstName;
        if (lastName.length > 0) {
            rendered += lastName;
        }
    }

    return rendered;
}


function messageFromData(data) {
    var message = '';

    if (data.status < 1) {
        if (data.error.length === 0) {
            message = "Unknown error occured";
        } else {
            message = data.error;
        }

    } else if (data.paid < 1){
        message =  "Hasn't paid!";

    } else {
        message = "Sign-in successful";
    }

    var user = render_user(data.user);
    if (user.length !== 0) {
        message = "<" + user + "> : " + message;
    }

    return message;
}


function checkCompatibility() {
    if (!navigator.getUserMedia) {
        return "No getUserMedia support";

    } else if (!Modernizr.localstorage) {
        return "No localStorage support";
    }

    return null;
}


function get_timestamp(d) {
    function pad(str) { return ("0" + str).substr(-2); }

    return (
        pad(d.getHours())   + ":" +
        pad(d.getMinutes()) + ":" +
        pad(d.getSeconds())
    );
}


var QR_RE = /^([0-9]+)\$\$([a-z0-9]+)\$\$([A-Za-z0-9]+)$/;


var QRScanner = React.createClass({displayName: "QRScanner",
    propTypes: {
        "log": React.PropTypes.func.isRequired,
        "callback": React.PropTypes.func.isRequired
    },

    getDefaultProps: function() {
        return {
            "callback": null,
            "log": null
        };
    },

    getInitialState: function() {
        return {
            "video_el": null,
            "ctx": null
        };
    },

    gum_success: function gum_success(stream) {
        this.props.log("Camera obtained and connected");
        this.state.video_el.src = window.URL.createObjectURL(stream)
    },

    gum_failure: function gum_failure(error) {
        this.props.log("Unable to connect to camera");
    },

    timerCallback: function timerCallback() {
        if (this.state.video_el.paused || this.state.video_el.ended) {
            return;
        }

        // render the video stream to the canvas
        this.state.ctx.drawImage(this.state.video_el, 0, 0)

        if (!this.state.scan_lock) {
            this.do_decode();
        }

        setTimeout(this.timerCallback, 125);
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
        this.props.callback(data);
    }, 500),

    play_callback: function play_callback() {
        var interval_id = setInterval(
            function(){
                var valid = (
                    this.state.video_el.videoWidth +
                    this.state.video_el.videoHeight
                ) > 0;

                if (valid) {
                    this.state.c1.width = this.state.video_el.videoWidth;
                    this.state.c1.height = this.state.video_el.videoHeight;
                    this.props.log("Video obtained");
                    clearInterval(interval_id);
                }
            }.bind(this),
            125
        );

        this.props.log("Waiting for video...");

        this.timerCallback();
    },

    componentDidMount: function ready() {
        'use strict';
        var video_el = document.getElementById("video"),
            c1 = document.getElementById("qr-canvas"),
            ctx = c1.getContext("2d");

        this.setState({
            "video_el": video_el,
            "ctx": ctx,
            "c1": c1
        });

        video_el.addEventListener(
            "play", $.proxy(this.play_callback, this), false
        );

        return getCamera().then(
            this.gum_success,
            this.gum_failure
        )
    },

    render: function render() {
        return (
            React.createElement(Row, null, 
                React.createElement("div", {className: "panel"}, 
                    React.createElement("canvas", {id: "qr-canvas"})
                ), 
                React.createElement("video", {autoPlay: true, id: "video"})
            )
        );
    }
});


var Row = React.createClass({displayName: "Row",
    render: function() {
        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "large-offset-3 large-6 small-12 columns"}, 
                    this.props.children
                )
            )
        );
    }
});


var LogBox = React.createClass({displayName: "LogBox",
    propTypes: {
        "log_messages": log_messages_prop_type
    },

    render: function() {
        return (
            React.createElement(Row, null, 
                React.createElement("div", {className: "panel"}, 
                    this.props.log_messages.map(function(log, idx) {
                        return (
                            React.createElement("div", {key: idx}, 
                                React.createElement("p", null, get_timestamp(log.timestamp), " ", log.message)
                            )
                        );
                    }), 
                    React.createElement("br", null)
                )
            )
        );
    }
})


var DataBox = React.createClass({displayName: "DataBox",
    propTypes: {
        "color": React.PropTypes.string.isRequired,
        "data": React.PropTypes.string.isRequired,
        "clear": React.PropTypes.func.isRequired
    },

    render: function() {
        return (
            React.createElement(Row, null, 
                React.createElement("div", {className: "panel", style: {overflow:"auto"}}, 
                    React.createElement("div", {className: "large-8 columns"}, 
                        React.createElement("div", {className: "match", style: {"backgroundColor": this.props.color}}, 
                            " "
                        ), 
                        "  ", 
                        React.createElement("div", {className: "left", id: "data"}, this.props.data)
                    ), 
                    React.createElement("div", {className: "large-4 columns"}, 
                        React.createElement("button", {
                            onClick: this.props.clear, 
                            className: "btn right", 
                            style: {margin:0}}, 
                                "Clear"
                        )
                    ), 
                    React.createElement("br", null)
                )
            )
        );
    }
});


var PasswordBox = React.createClass({displayName: "PasswordBox",
    propTypes: {
        "onSave": React.PropTypes.func.isRequired
    },

    render: function() {
        return (
            React.createElement(Row, null, 
                React.createElement("form", {className: "panel", onSubmit: this.props.onSave, style: {"overflow": "auto"}}, 
                    React.createElement("div", {className: "large-10 columns"}, 
                        React.createElement("input", {type: "password", name: "password"})
                    ), 
                    React.createElement("div", {className: "large-2 columns"}, 
                        React.createElement("input", {type: "submit", value: "Save", className: "button"})
                    )
                )
            )
        );
    }
});


var App = React.createClass({displayName: "App",
    propTypes: {
        "log_messages": log_messages_prop_type
    },

    getDefaultProps: function() {
        return {"log_messages": []};
    },

    getInitialState: function() {
        return {
            "color": "red",
            "data": "",
            "scan_lock": false,
            "api": null,
            "camera": null,
            "scanner": null,
            "password": localStorage.getItem("password")
        }
    },

    log: function log(message) {
        var log_messages = this.props.log_messages;
        log_messages.unshift({"timestamp": new Date(), "message": message});
        this.setProps({"log_messages": log_messages});
    },

    scanRequestSuccess: function scanRequestSuccess(data) {
        console.log(data);
        this.log(messageFromData(data));
    },

    api_caller: function api_caller(data) {
        return this.state.api.scanRequest(data).then(
            this.scanRequestSuccess
        )
    },

    clear: function clear() {
        this.setState({
            "scan_lock": false,
            "color": "red",
            "data": ""
        });
    },

    data_callback: function data_callback(data) {
        'use strict';
        var match = QR_RE.exec(data)

        if (!match) {
            this.setState({"data": data + " is invalid"});
            return;
        }
        if (this.state.scan_lock) return;

        this.setState({
            "data": match[3],
            "color": "green",
            "scan_lock": true
        });

        return this.api_caller(data);
    },

    componentDidMount: function componentDidMount() {
        this.setState({
            "api": new QrAPI(
                DEBUG ?
                "/ticket/signin" :
                "http://events.rflan.org/ticket/signin",
                null
            )
        });
        $(document.body).on('keydown.spacebar', this.handleKeyDown);
    },

    componentWillUnMount: function componentWillUnMount() {
        $(document.body).off('keydown.spacebar', this.handleKeyDown);
    },

    handleKeyDown: function handleKeyDown(event) {
        if (event.keyCode == 32) {
            event.preventDefault();
            this.clear();
        }
    },

    onSave: function onSave(event) {
        event.preventDefault();
        this.setState({"password": event.target.password.value})
    },

    render_error: function render_error(error) {
        return (
            React.createElement(Row, null, 
                React.createElement("div", {className: "panel"}, 
                    error
                )
            )
        );
    },

    render: function() {
        if (!_.isEmpty(this.state.password)) {
            if (this.state.api) {
                this.state.api.setPassword(this.state.password);
            }
            localStorage.setItem("password", this.state.password);
        }

        var error = checkCompatibility();
        if (error !== null) {
            return this.render_error(error);
        }

        if (this.state.password === null) {
            return React.createElement(PasswordBox, {onSave: this.onSave});
        }

        return (
            React.createElement("div", null, 
                React.createElement(QRScanner, {log: this.log, callback: this.data_callback}), 
                React.createElement(DataBox, {color: this.state.color, data: this.state.data, clear: this.clear}), 
                React.createElement(LogBox, {log_messages: this.props.log_messages})
            )
        );
    }
})

function run() {
    React.render(
        React.createElement(App, null),
        document.getElementById('app')
    );
}

if (DEBUG) {
    try {
        run();
    } catch (e) {
        alert(e);
        throw e;
    }
} else {
    run();
}
