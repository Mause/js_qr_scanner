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
