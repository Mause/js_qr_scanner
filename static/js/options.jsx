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
                    <div className="small-3 columns">
                        <button
                            onClick={this.logout}
                            className="btn">
                                Logout
                        </button>
                    </div>
                    <div className="small-3 columns">
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
