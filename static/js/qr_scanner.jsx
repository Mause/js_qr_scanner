var QRScanner = React.createClass({
    propTypes: {
        "callback": React.PropTypes.func.isRequired,
        "flip": React.PropTypes.bool.isRequired,
        "message": React.PropTypes.string.isRequired,
        "message_bg": React.PropTypes.string.isRequired,
        "source_id": React.PropTypes.string.isRequired
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

    qrcode_callback(data) {
        _.debounce(this.props.callback, 500)(data);
    },

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

        this.do_decode();
    },

    render() {
        return (
            <Row>
                <div className="panel">
                    <Screen
                        flip={this.props.flip}
                        source_id={this.props.source_id}
                        onFrame={this.onFrame}
                        />
                </div>
            </Row>
        );
    }
});
