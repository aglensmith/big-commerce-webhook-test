/** @jsx React.DOM */

var websocket = function (callbacks) {
    var wsproto = "ws://";
    if (location.protocol === 'https:') {
        wsproto = "wss://";
    }
    var ws = new WebSocket(wsproto + location.host + "/_ws");
    ws.onmessage = function(message) {
        var msg = JSON.parse(message.data);
        var cb = callbacks[msg.Type];
        if (!!cb) {
            cb(msg);
        }
    };
    ws.onopen = function() {
        console.log("connected websocket for real-time updates");
    };
    ws.onerror = function(err) {
        console.log("Web socket error:")
        console.log(err);
    };
    ws.onclose = function(cls) {
        console.log("Web socket closed:" + cls);
        setTimeout(function() { websocket(callbacks) }, 0);
    };
}

var ContainerRow = React.createClass({displayName: "ContainerRow",
    render: function() {
        return (
            React.createElement("div", {className: "container"}, React.createElement("div", {className: "row"}, this.props.children))
        );
    }
});

var Tabs = React.createClass({displayName: "Tabs",
    getInitialState: function() {
        return {"selected": this.props.children[0].props.name}
    },
    render: function() {
        var $tabs = this;
        var tabs = React.Children.map(this.props.children, function(child) {
            var selected = $tabs.state.selected == child.props.name;
            var onSelect = function() { $tabs.setState({selected:child.props.name}) }
            return (
                React.createElement("li", {className: selected ? "active":""}, 
                    React.createElement("a", {href: "#", onClick: onSelect}, child.props.name)
                )
            );
        });
        var panes = React.Children.map(this.props.children, function(child) {
            var active = child.props.name == $tabs.state.selected;
            return React.createElement(Pane, {name: child.props.name, active: active}, child.props.children);
        });
        if (!!this.props.rightControl) {
            var rightControl = React.createElement("li", {className: "pull-right"}, this.props.rightControl);
        }
        return (
            React.createElement("div", null, 
                React.createElement("ul", {className: "nav nav-pills"}, 
                    tabs, 
                    rightControl
                ), 
                panes
            )
        );
    }
});

var Pane = React.createClass({displayName: "Pane",
    render: function() {
        return React.createElement("div", {style: {display: this.props.active ? "block": "none"}}, this.props.children);
    }
});

var KeyVal = React.createClass({displayName: "KeyVal",
    render: function() {
        if (_.isEmpty(this.props.attrs)) {
            return React.createElement("div", null);
        }

        var rows = _.map(this.props.attrs, function(value, key) {
            var noValue = React.createElement("small", {className: "test-small text-muted"}, "no value")
            return (
                React.createElement("tr", {key: key}, " ", React.createElement("th", null, key), " ", React.createElement("td", null, (!!value) ? value : noValue), " ")
            );
        });

        return (
            React.createElement("div", null, 
                React.createElement("h6", null, this.props.title), 
                React.createElement("table", {className: "table params"}, 
                    React.createElement("tbody", null, 
                        rows
                    )
                )
            )
        );
    }
});

var RelativeTime = React.createClass({displayName: "RelativeTime",
    render: function() {
        var ts = new Date(this.props.t * 1000).toISOString();
        return (
            React.createElement("span", {title: ts, className: "muted"}, moment(ts).fromNow())
        );
    },
    componentDidMount: function() {
        var $this = this;
        this.interval = setInterval(function() {
            $this.forceUpdate();
        }, 15000);
    },
    componentWillUnmount: function() {
        clearInterval(this.interval);
    }
});

var SessionStatus = React.createClass({displayName: "SessionStatus",
    getInitialState: function() {
        return { Session: window.common.Session };
    },
    render: function() {
        var stat = {
            0: {text: "connecting", className: "label-info"},
            1: {text: "online", className: "label-success"},
            2: {text: "reconnecting", className: "label-error", title: this.state.Session.LastError},
            3: {text: "shutting down", className: "label-warning"}
        }[this.state.Session.Status];

        return React.createElement("span", {style: {"lineHeight": "2"}, className: "label " + stat.className, title: (!!stat.title) ? stat.title : stat.text}, stat.text)
    }
});

var sessionStatus = ReactDOM.render(React.createElement(SessionStatus, null), document.getElementById("connection-status"));
