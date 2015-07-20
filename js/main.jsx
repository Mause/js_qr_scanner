var flag = name => location.search.indexOf(name) != -1;

var DEBUG = flag('debug');
var USE_MOCK = flag('use_mock');
var SCAN_INTERVAL = 125 / 2;
var QR_RE = /^([0-9]+)\$\$([a-z0-9]+)\$\$(.+)$/;

var log_messages_prop_type = React.PropTypes.arrayOf(
    React.PropTypes.shape({
        "timestamp": React.PropTypes.date,
        "message": React.PropTypes.string
    })
).isRequired;



var Mock = {
    scanRequest(data) {
        return $.getJSON('tests.json').then(
            function(tests) {
                if (!(data in tests)) {
                    // may genuinely glitch out
                    return {
                        status: 0,
                        error: "Invalid code, try again"
                    }
                }

                var resp = tests[data]['response'];
                return (
                    resp === 'fail_request' ?
                    $.Deferred().reject() :
                    resp
                );
            },
            () => console.error("Couldn't load tests")
        )
    }
}



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


function was_successful(data) {
    return !(data.status < 1 || data.paid < 1);
}


function messageFromData(data) {
    var message = '',
        user = render_user(data.user);
    if (user.length !== 0) {
        message = "<" + user + "> : " + message;
    }

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
    var pad = str => ("0" + str).substr(-2),
        hours = pad(d.getHours()),
        minutes = pad(d.getMinutes()),
        seconds = pad(d.getSeconds());

    return `${hours}:${minutes}:${seconds}`;
}


var Screen = React.createClass({
    propTypes: {
        "log": React.PropTypes.func.isRequired,
        "onFrame": React.PropTypes.func,
        "flip": React.PropTypes.bool,
        "onClick": React.PropTypes.func
    },

    getInitialState() {
        return {
            "video_el": null,
            "ctx": null
        };
    },

    gum_success(stream) {
        this.props.log("Camera obtained and connected");
        this.state.video_el.src = window.URL.createObjectURL(stream)
    },

    gum_failure(error) {
        this.props.log("Unable to connect to camera");
    },

    play_callback() {
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

    timerCallback() {
        if (this.state.video_el.paused || this.state.video_el.ended) {
            return;
        }

        // render the video stream to the canvas
        this.state.ctx.drawImage(this.state.video_el, 0, 0)

        if (this.props.onFrame) {
            this.props.onFrame(this.state.ctx);
        }

        setTimeout(this.timerCallback, SCAN_INTERVAL);
    },

    componentDidMount() {
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

    flipStyle: {
        "MozTransform": "scale(-1, 1)",
        "WebkitTransform": "scale(-1, 1)",
        "OTransform": "scale(-1, 1)",
        'transform': "scale(-1, 1)",
        "filter": "FlipH"
    },

    render() {
        return (
            <div>
                <canvas id="qr-canvas" onClick={this.props.onClick} style={this.props.flip ? this.flipStyle : {}}></canvas>
                <video autoPlay={true} id="video"></video>
            </div>
        );
    }
});


var QRScanner = React.createClass({
    propTypes: {
        "log": React.PropTypes.func.isRequired,
        "callback": React.PropTypes.func.isRequired,
        "flip": React.PropTypes.bool.isRequired,
        "message": React.PropTypes.string.isRequired,
        "message_bg": React.PropTypes.string.isRequired,
    },

    getInitialState() {
        return {"scan_lock": false};
    },

    getDefaultProps() {
        return {
            "callback": null,
            "log": null
        };
    },

    do_decode() {
        try {
            this.qrcode_callback(qrcode.decode());
        } catch (e) {
            if (e !== "Couldn't find enough finder patterns") {
                console.error("Error: " + e);
            }
        }
    },

    qrcode_callback: _.debounce(function qrcode_callback(data) {
        this.props.callback(data);
    }, 500),

    onFrame(ctx) {
        var centre_x = ctx.canvas.width / 2,
            centre_y = ctx.canvas.height / 2

        var width = 600,
            height = 100,
            x = centre_x - (width / 2),
            y = centre_y - (height / 2);

        if (!_.isEmpty(this.props.message)) {
            ctx.fillStyle = this.props.message_bg;
            ctx.fillRect(x, y, width, height);

            ctx.font = '40px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'black';
            ctx.fillText(this.props.message, centre_x, centre_y);
        }

        // if (!this.state.scan_lock) {
        this.do_decode();
        // }
    },

    render() {
        return (
            <Row>
                <div className="panel">
                    <Screen
                        flip={this.props.flip}
                        log={this.props.log}
                        onFrame={this.onFrame}
                        {...this.props}
                        />
                </div>
            </Row>
        );
    }
});


var Row = React.createClass({
    render() {
        return (
            <div className="row">
                <div className="large-offset-3 large-6 small-12 columns">
                    {this.props.children}
                </div>
            </div>
        );
    }
});


var LogBox = React.createClass({
    propTypes: {
        "log_messages": log_messages_prop_type
    },

    render() {
        return (
            <Row>
                <div className="panel">
                    {this.props.log_messages.map(function(log, idx) {
                        return (
                            <div key={idx}>
                                <p>{get_timestamp(log.timestamp) + " " + log.message}</p>
                            </div>
                        );
                    })}
                    <br/>
                </div>
            </Row>
        );
    }
})


var PasswordBox = React.createClass({
    propTypes: {
        "onSave": React.PropTypes.func.isRequired
    },

    render() {
        return (
            <Row>
                <form className="panel" onSubmit={this.props.onSave} style={{"overflow": "auto"}}>
                    <div className="large-10 columns">
                        <input type="password" name="password" />
                    </div>
                    <div className="large-2 columns">
                        <input type="submit" value="Save" className="button" />
                    </div>
                </form>
            </Row>
        );
    }
});


var App = React.createClass({
    propTypes: {
        "log_messages": log_messages_prop_type
    },

    getDefaultProps() {
        return {"log_messages": []};
    },

    getInitialState() {
        return {
            "scan_lock": false,
            "api": null,
            "camera": null,
            "scanner": null,
            "message_bg": '',
            "message": '',
            'flip': false,
            "password": localStorage.getItem("password")
        }
    },

    log(message) {
        var log_messages = this.props.log_messages;
        log_messages.unshift({"timestamp": new Date(), "message": message});
        this.setProps({"log_messages": log_messages});
    },

    scanRequestSuccess(data) {
        console.log(data);
        var msg = messageFromData(data), color;
        this.log(msg);

        if (was_successful(data)) {
            color = 'green';
        } else {
            color = 'red';
        }

        this.setState({
            "message_bg": color,
            "message": msg
        })
    },

    scanRequestFailure(data) {
        this.setState({
            "message_bg": "red",
            "message": "Couldn't reach server, try again"
        });
    },

    api_caller(data) {
        var scanRequest;
        scanRequest = USE_MOCK ? Mock.scanRequest : this.state.api.scanRequest;

        return scanRequest(data).then(
            this.scanRequestSuccess,
            this.scanRequestFailure
        );
    },

    clear() {
        this.setState({
            "scan_lock": false,
            "message_bg": '',
            "message": ''
        });
    },

    data_callback(data) {
        'use strict';
        var match = QR_RE.exec(data)

        if (!match) {
            this.setState({
                "message": data + " is invalid",
                "message_bg": "red"
            });
            return;
        }
        if (this.state.scan_lock) return;

        this.setState({
            "message_bg": "yellow",
            "message": `Checking ${match[3]}`,
            "scan_lock": true
        });

        return this.api_caller(data);
    },

    componentDidMount() {
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

    componentWillUnMount() {
        $(document.body).off('keydown.spacebar', this.handleKeyDown);
    },

    handleKeyDown(event) {
        if (event.keyCode == 32) {
            event.preventDefault();
            this.clear();
        }
    },

    flip(val) {
        this.setState({
            "flip": !this.state.flip
        });
    },

    onSave(event) {
        event.preventDefault();
        this.setState({"password": event.target.password.value})
    },

    render_error(error) {
        return (
            <Row>
                <div className="panel">
                    {error}
                </div>
            </Row>
        );
    },

    render() {
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
            return <PasswordBox onSave={this.onSave} />;
        }

        return (
            <div>
                <QRScanner
                    log={this.log}
                    callback={this.data_callback}
                    flip={this.state.flip}
                    onClick={this.clear}
                    message={this.state.message}
                    message_bg={this.state.message_bg}
                    />
                <LogBox log_messages={this.props.log_messages} />
                <Options flip={this.flip} />
            </div>
        );
    }
})

var Options = React.createClass({
    propTypes: {
        'flip': React.PropTypes.func.isRequired
    },

    logout() {
        localStorage.removeItem("password");
        window.location = window.location; // reload
    },

    render() {
        return (
            <Row>
                <div className="panel" style={{height: "100px"}}>
                    <div className="large-4 columns">
                        <button
                            onClick={this.logout}
                            className="btn">
                                Logout
                        </button>
                    </div>
                    <div className="large-4 columns">
                        <button
                            onClick={this.props.flip}
                            className="btn">
                                Flip
                        </button>
                    </div>
                </div>
            </Row>
        );
    }
})

function run() {
    React.render(
        <App/>,
        document.getElementById('app')
    );
}

if (DEBUG) {
    try { run(); }
    catch (e) {
        alert(e);
        throw e;
    }
} else {
    run();
}
