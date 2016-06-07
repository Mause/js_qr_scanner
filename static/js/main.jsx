var flag = name => location.search.indexOf(name) != -1;

var DEBUG = flag('debug');
var USE_MOCK = flag('use_mock');
var SCAN_INTERVAL = 125 / 2;
var QR_RE = /^([0-9]+)\$\$([a-z0-9]+)\$\$(.+)$/;


var Mock = {
    scanRequest(data) {
        return new Promise($.getJSON('tests.json')).then(
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
                    Promise.reject() :
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

    } else if (window.location.hostname == 'localhost') {
        return null;

    } else if (window.location.protocol != 'http') {
        return "Must be accessed over https";
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


var StatusCube = React.createClass({
    propTypes: {
        "status": React.PropTypes.number.isRequired
    },
    render() {
        var color = ["red", "orange", "green"][this.props.status];
        var style = {
            "width": "25px",
            "height": "25px",
            "float": 'left',
            "backgroundColor": color
        };
        return (
            <div style={style}></div>
        );
    }
})


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


var ErrorBox = React.createClass({
    render() {
        return (
            <Row>
                <div className="panel">
                    {this.props.error}
                </div>
            </Row>
        );
    }
})


var App = React.createClass({
    getInitialState() {
        return {
            "scan_lock": false,
            "api": null,
            "scanner": null,
            "message_bg": '',
            "message": '',
            "flip": false,
            "source_id": null,
            "password": localStorage.getItem("password")
        }
    },

    scanRequestSuccess(data) {
        console.log(data);
        var msg = messageFromData(data), color;
        console.log(msg);

        color = was_successful(data) ? 'green' : 'red';

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

    select_source(id) {
        this.setState({source_id: id});
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
            return <ErrorBox error={error}/>;
        }

        if (this.state.password === null) {
            return <PasswordBox onSave={this.onSave} />;
        }

        return (
            <div>
                <QRScanner
                    callback={this.data_callback}
                    flip={this.state.flip}
                    source_id={this.state.source_id}
                    onClick={this.clear}
                    message={this.state.message}
                    message_bg={this.state.message_bg}
                    />
                <Options flip={this.flip} select_source={this.select_source} />
            </div>
        );
    }
})


function run() {
    ReactDOM.render(
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
