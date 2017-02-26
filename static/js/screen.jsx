var Screen = React.createClass({
    STATUSES: ['camera', 'video'],
    propTypes: {
        "onFrame": React.PropTypes.func,
        "flip": React.PropTypes.bool,
        "onClick": React.PropTypes.func
    },

    getInitialState() {
        return {
            "video_el": null,
            "src": null,
            "ctx": null,
            "camera_stage": 0,
            "video_stage": 0
        };
    },

    increment(name) {
        var obj = {}
        obj[name] = this.state[name] + 1
        this.setState(obj);
    },

    gum_success(stream) {
        this.increment("camera_stage");
        console.log("Camera obtained and connected");
        this.setState({
            "src": window.URL.createObjectURL(stream)
        });
    },

    gum_failure(error) {
        alert("Unable to connect to camera");
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
                    this.increment("video_stage");
                    console.log("Video obtained");
                    clearInterval(interval_id);
                }
            }.bind(this),
            125
        );

        console.log("Waiting for video...");
        this.increment("video_stage")

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

        this.increment("camera_stage");
        console.log('Waiting for camera...');

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

    componentWillReceiveProps(nextProps, nextContext) {
        if (this.props.source_id != nextProps.source_id) {
            this.setState({
                "camera_stage": 0,
                "video_stage": 0
            });
            this.increment('camera_stage');
            getUserMedia(nextProps.source_id).then(
                this.gum_success, this.gum_failure
            )
        }
    },

    render() {
        var status_values = this.STATUSES.map(name => {
            <span key={name}>
                <div style={{float: 'left'}}>{name}: </div>
                <StatusCube status={this.state[name + '_stage']}/>
            </span>
        });

        return (
            <div>
                <canvas
                    id="qr-canvas"
                    onClick={this.props.onClick}
                    style={this.props.flip ? this.flipStyle : {}}>
                </canvas>
                <video src={this.state.src} autoPlay={true} id="video"></video>
                <div>
                    {status_values}
                    <br/>
                </div>
            </div>
        );
    }
});
