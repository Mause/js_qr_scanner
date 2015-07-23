var Options = React.createClass({
    propTypes: {
        'flip': React.PropTypes.func.isRequired,
        'select_source': React.PropTypes.func.isRequired
    },

    logout() {
        localStorage.removeItem("password");
        window.location = window.location; // reload
    },

    onChange(ev) {
        this.props.select_source(ev.target.value);
    },

    getInitialState() {
        return {
            "sources": []
        }
    },

    componentWillMount() {
        getSources().then((sources) => {
            sources = _.where(sources, {kind: "video"})
            this.setState({"sources": sources})
        })
    },

    render() {
        var options = this.state.sources.map((src) => {
            return <option key={src.id} value={src.id}>{src.label}</option>;
        })

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
                    <div className="small-6 columns">
                        <select onChange={this.onChange}>
                            {options}
                        </select>
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
