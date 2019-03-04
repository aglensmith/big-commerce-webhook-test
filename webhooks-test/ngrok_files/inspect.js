/** @jsx React.DOM */

(function() {
    var isTimeZero = function(ts) {
        return ts === "0001-01-01T00:00:00Z";
    };

    var InspectPage = React.createClass({displayName: "InspectPage",
        getInitialState: function() {
            return {
                roundTripMap: {},
                roundTrips: [],
                tunnels: {},
                plan: "",
                expires: new Date(0).toString(),
            };
        },
        rtMapToList: function(rts) {
            return _.sortBy(_.map(rts, function(rt) { return rt }), function(rt) { return -rt.Start });
        },
        start: function(rts, session) {
            var rtMap = {};
            rts.forEach(function(rt) {
                rtMap[rt.EntryId] = preprocessRT(rt)
            });

            var rtList = this.rtMapToList(rts);
            this.setState({
                roundTripMap: rtMap,
                roundTrips: rtList,
                tunnels: session.Tunnels,
                expires: session.Expires,
                plan: session.PlanName,
            });

            // start the websocket
            var page = this;
            websocket({
                RoundTrip: function(msg) {
                    page.addRoundTrip(msg.Payload);
                },
                Session: function(msg) {
                    page.setState({ tunnels: msg.Payload.Tunnels });
                    sessionStatus.setState({ Session: msg.Payload });
                }
            });
        },
        onClear: function() {
            $.ajax({
                url: "/api/requests/http",
                type: "DELETE"
            });
            this.setState({
                roundTripMap: {},
                roundTrips: [],
            });
        },
        addRoundTrip: function(rt) {
            // we have to manipulate a copy because of how setState works
            var rts = _.extend({}, this.state.roundTripMap);
            rts[rt.EntryId] = preprocessRT(rt);
            var rtList = this.rtMapToList(rts);
            this.setState({roundTripMap: rts, roundTrips: rtList});
        },
        render: function() {
            var tunnelURLs = _.map(this.state.tunnels, function(t, key) {
                return t.URL;
            });
            tunnelURLs.sort();
            var bb = React.createElement(ExpiryBar, {plan: this.state.plan, expires: this.state.expires});

            if (_.isEmpty(this.state.roundTrips)) {
                return (
                    React.createElement(ContainerRow, null, 
                        bb, 
                        React.createElement(GetStarted, {tunnelURLs: tunnelURLs})
                    )
                );
            }

            return (
                React.createElement(ContainerRow, null, 
                    bb, 
                    React.createElement(Inspect, {roundTrips: this.state.roundTrips, 
                        roundTripMap: this.state.roundTripMap, 
                        onClear: this.onClear})
                )
            );
        },
    });

    var preprocessRT = function(rt) {
        preprocessReq(rt.Request);
        preprocessResp(rt.Response);
        return rt;
    };

    var preprocessReq = function(req) {
        if (!req.RawBytes) {
            var decoded = Base64.decode(req.Raw);
            req.RawBytes = hexRepr(decoded.bytes);

            if (!req.Body.Binary && req.Body.Encoding == "") {
                req.RawText = decoded.text;
            }
        }

        preprocessBody(req.Body);
    };

    var preprocessResp = function(resp) {
        resp.statusClass = {
            '2': "text-info",
            '3': "muted",
            '4': "text-warning",
            '5': "text-danger"
        }[resp.Status[0]];

        if (!resp.RawBytes) {
            var decoded = Base64.decode(resp.Raw);
            resp.RawBytes = hexRepr(decoded.bytes);

            if (!resp.Body.Binary && resp.Body.Encoding == "") {
                resp.RawText = decoded.text;
            }
        }

        preprocessBody(resp.Body);
    };

    var preprocessBody = function(body) {
        body.isForm = body.ContentType == "application/x-www-form-urlencoded";
        body.exists = body.Size != 0;
        body.hasError = !!body.Error;

        var syntaxClass = {
            "text/xml":               "xml",
            "application/xml":        "xml",
            "text/html":              "xml",
            "text/css":               "css",
            "application/json":       "json",
            "text/javascript":        "javascript",
            "application/javascript": "javascript",
        }[body.ContentType];

        // decode body
        if (body.Binary) {
            body.Text = "";
        } else {
            body.Text = Base64.decode(body.Text).text;
        }

        // prettify
        var transform = {
            "xml": "xml",
            "json": "json"
        }[syntaxClass];

        if (!body.hasError && !!transform) {
            try {
                // vkbeautify does poorly at formatting html
                if (body.ContentType != "text/html") {
                    body.Text = vkbeautify[transform](body.Text);
                }
            } catch (e) {
            }
        }

        if (!!syntaxClass) {
            body.Text = hljs.highlight(syntaxClass, body.Text).value;
        } else {
            // highlight.js doesn't have a 'plaintext' syntax, so we'll just copy its escaping function.
            body.Text = body.Text.replace(/&/gm, '&amp;').replace(/</gm, '&lt;').replace(/>/gm, '&gt;');
        }
    };

    var hexRepr = function(bytes) {
        var buf = [];
        var ascii = [];
        for (var i=0; i<bytes.length; ++i) {
            var b = bytes[i];

            if (!(i%8) && i!=0) {
                buf.push("\t");
                buf.push.apply(buf, ascii)
                buf.push('\n');
                ascii = [];
            }

            if (b < 16) {
                buf.push("0");
            }

            if (b < 0x20 || b > 0x7e) {
                ascii.push('.');
            } else {
                ascii.push(String.fromCharCode(b));
            }

            buf.push(b.toString(16));
            buf.push(" ");
            ascii.push(" ");
        }

        if (ascii.length > 0) {
            var charsLeft = 8 - (ascii.length / 2);
            for (i=0; i<charsLeft; ++i) {
                buf.push("   ");
            }
            buf.push("\t");
            buf.push.apply(buf, ascii);
        }

        return buf.join("");
    };

    var prettyTime = function(seconds) {
        var out = "";
        if (seconds >= 60*60) {
            if (seconds < 2*60*60) {
                out = out + "1 hour";
            } else {
                var hours = seconds / (60 * 60);
                out = out + Math.floor(hours) + " hours";
            }
        }
        var mins = (seconds / 60) % 60;
        if (mins >= 1) {
            if (out.length > 0) {
                out = out + ", ";
            }
            // Javascript's modulo operator does not return an integer.
            if (mins >= 1 && mins < 2) {
                out = out + "1 minute";
            } else {
                out = out + Math.floor(mins) + " minutes";
            }
        }
        if (out.length === 0) {
            out = "less than a minute";
        }
        return out;
    };

    var ExpiryBar = React.createClass({displayName: "ExpiryBar",
        render: function() {
            if (isTimeZero(this.props.expires)) {
                return null;
            }

            var expires = new Date(this.props.expires);
            var now = new Date();
            var secondsToExpiry = (expires.getTime() - now.getTime())/1000;
            var alertClass = "alert-warning";
            if (secondsToExpiry <= 5*60) {
                alertClass = "alert-danger";
            }
            var text, plan, link;
            if (this.props.plan === "") {
                plan = "You are using ngrok without an account. ";
                link = React.createElement("span", null, React.createElement("a", {href: "https://ngrok.com/signup"}, "Sign up"), " for longer sessions")
            } else {
                plan = "You are on the " + this.props.plan + " plan. ";
                link = React.createElement("span", null, React.createElement("a", {href: "https://dashboard.ngrok.com/billing/plan"}, "Upgrade to a paid plan"), " for sessions that don't expire")
            }
            if (secondsToExpiry >= 0) {
              text = React.createElement("span", null, plan, "Your session will end in ", prettyTime(secondsToExpiry), ". ", link, ".");
            } else {
              text = React.createElement("span", null, "Your session expired ", prettyTime(secondsToExpiry*-1), " ago. ", link, " or restart ngrok.");
            }
            return React.createElement("div", {className: "alert " + alertClass, role: "alert"}, text);
        },
    });

    var GetStarted = React.createClass({displayName: "GetStarted",
        render: function() {
            var tunnelList = this.props.tunnelURLs.map(function(url) {
                return React.createElement("li", null, React.createElement("a", {target: "_blank", href: url}, url))
            });
            return (
                React.createElement("div", {className: "col-md-6 col-md-offset-3 well get-started"}, 
                    React.createElement("h4", null, "No requests to display yet"), 
                    React.createElement("hr", null), 
                    React.createElement("h5", null, "To get started, make a request to one of your tunnel URLs"), 
                    React.createElement("ul", {className: "tunnels"}, tunnelList)
                )
            );
        }
    });

    var Inspect = React.createClass({displayName: "Inspect",
        getInitialState: function() {
            return { selected: this.props.roundTrips[0].EntryId };
        },
        onSelect: function(roundTrip) {
            this.setState({selected: roundTrip.EntryId});
        },
        selectedTrip: function() {
            return this.props.roundTripMap[this.state.selected];
        },
        render: function() {
            return (
                React.createElement("div", null, 
                    React.createElement("div", {className: "col-md-6"}, 
                        React.createElement(InspectSelector, {roundTrips: this.props.roundTrips, selected: this.state.selected, onSelect: this.onSelect, onClear: this.props.onClear})
                    ), 
                    React.createElement("div", {className: "col-md-6"}, 
                        React.createElement(InspectRoundTrip, {roundTrip: this.selectedTrip()})
                    )
                )
            );
        }
    });

    var InspectSelector = React.createClass({displayName: "InspectSelector",
        render: function() {
            var $this = this;
            var roundTrips = _.map(this.props.roundTrips, function(rt) {
                var onSelect = function() { $this.props.onSelect(rt) };
                var selected = $this.props.selected == rt.EntryId;
                return (
                    React.createElement("tr", {key: rt.EntryId, className: selected ? 'selected' : '', onClick: onSelect}, 
                        React.createElement("td", {className: "wrapped"}, React.createElement("div", {className: "path"}, rt.Request.MethodPath)), 
                        React.createElement("td", null, rt.Response.Status), 
                        React.createElement("td", null, React.createElement("span", {className: "pull-right"}, durationFormat(rt.Duration)))
                    )
                );
            });
            return (
                React.createElement("div", null, 
                    React.createElement("h4", {className: "all-requests"}, 
                        React.createElement("button", {onClick: this.props.onClear, className: "btn btn-default pull-right"}, "Clear"), 
                        "All Requests"
                    ), 
                    React.createElement("table", {className: "table round-trip-select"}, React.createElement("tbody", null, roundTrips))
                )
            );
        }
    });

    // roundTrip - serializedRoundTrip object
    var InspectRoundTrip = React.createClass({displayName: "InspectRoundTrip",
        render: function() {
            var rt = this.props.roundTrip;
            return (
                React.createElement("div", null, 
                    React.createElement("div", {className: "row"}, 
                        React.createElement("div", {className: "col-md-4"}, 
                            React.createElement(RelativeTime, {t: rt.Start})
                        ), 
                        React.createElement("div", {className: "col-md-4"}, 
                            React.createElement("i", {className: "glyphicon glyphicon-time"}), " Duration", 
                            React.createElement("span", {style: {marginLeft: "8px"}, className: "muted"}, durationFormat(rt.Duration))
                        ), 
                        React.createElement("div", {className: "col-md-4"}, 
                            React.createElement("i", {className: "glyphicon glyphicon-user"}), " IP", 
                            React.createElement("span", {style: {marginLeft: "8px"}, className: "muted"}, rt.RemoteAddr)
                        )
                    ), 

                    React.createElement("hr", null), 
                    React.createElement(InspectRequest, {request: rt.Request, rtId: rt.EntryId}), 
                    React.createElement("hr", {style: {margin: "40px 0 20px"}}), 
                     rt.Response != null ? React.createElement(InspectResponse, {response: rt.Response, rtId: rt.EntryId}) : null
                )
            );
        }
    });

    // Display the request
    //
    // request - a serializedRequest, with additional fields available
    // rtId - entryID
    var InspectRequest = React.createClass({displayName: "InspectRequest",
        render: function() {
            var req = this.props.request;
            var partialCapture = req.Size != req.CapturedSize;
            var replayButton = React.createElement(ReplayButton, {partial: partialCapture, rtId: this.props.rtId});
            return (
                React.createElement("div", {className: "row"}, React.createElement("div", {className: "col-md-12"}, 
                    React.createElement("h3", {className: "wrapped"}, req.MethodPath), 
                     partialCapture ? React.createElement("div", {className: "alert alert-warning"}, "This request was too big; only ", req.CapturedSize, " bytes were stored. It cannot be replayed.") : null, 
                    React.createElement(DownloadBodyLink, {rtId: this.props.rtId, body: req.Body, msg: "request"}), 
                    React.createElement(Tabs, {rightControl: replayButton}, 
                        React.createElement(Pane, {name: "Summary"}, 
                            React.createElement(KeyVal, {title: "Query Params", attrs: req.Params}), 
                            React.createElement(Body, {body: req.Body})
                        ), 

                        React.createElement(Pane, {name: "Headers"}, 
                            React.createElement(KeyVal, {title: "Headers", attrs: req.Header})
                        ), 

                        React.createElement(Pane, {name: "Raw"}, 
                             !req.RawText ? React.createElement("div", {className: "alert alert-info"}, "Binary request not displayed") : React.createElement("pre", null, React.createElement("code", {className: "http"}, req.RawText))
                        ), 

                        React.createElement(Pane, {name: "Binary"}, 
                            React.createElement("pre", null, React.createElement("code", null, req.RawBytes))
                        )
                    )
                ))
            );
        }
    });

    // Show a button to replay the request
    //
    // partial (bool) - whether the full request was captured
    // rtId (hex string) - entry ID
    var ReplayButton = React.createClass({displayName: "ReplayButton",
        onClick: function() {
            jQuery.ajax({
                type: "POST",
                url: "/api/requests/http",
                data: JSON.stringify({id: this.props.rtId}),
                dataType: "json",
                contentType: "application/json; charset=UTF-8"
            });
        },
        render: function() {
            if (this.props.partial === true) {
                // need the div overlay because of
                // https://github.com/twbs/bootstrap/issues/9294
                return (
                  React.createElement("div", {style: {cursor: "not-allowed"}}, 
                    React.createElement("button", {disabled: "disabled", className: "btn btn-primary"}, "Replay")
                  )
                );
            } else {
                return React.createElement("button", {className: "btn btn-primary", onClick: this.onClick}, "Replay")
            }
        }
    });

    var InspectResponse = React.createClass({displayName: "InspectResponse",
        render: function() {
            var resp = this.props.response;
            var partialCapture = resp.Size != resp.CapturedSize;
            return (
                React.createElement("div", null, 
                    React.createElement("h3", {className: resp.statusClass}, resp.Status), 
                     partialCapture ? React.createElement("div", {className: "alert alert-warning"}, "This response was too big; only ", resp.CapturedSize, " bytes were stored.") : null, 
                    React.createElement(DownloadBodyLink, {rtId: this.props.rtId, body: resp.Body, msg: "response"}), 
                    React.createElement(Tabs, null, 
                        React.createElement(Pane, {name: "Summary"}, 
                            React.createElement(Body, {body: resp.Body})
                        ), 

                        React.createElement("div", {name: "Headers"}, 
                            React.createElement(KeyVal, {title: "Headers", attrs: resp.Header})
                        ), 

                        React.createElement(Pane, {name: "Raw"}, 
                             !resp.RawText ? React.createElement("div", {className: "alert alert-info"}, "Binary response not displayed") : React.createElement("pre", null, React.createElement("code", {className: "http"}, resp.RawText))
                        ), 

                        React.createElement(Pane, {name: "Binary"}, 
                            React.createElement("pre", null, React.createElement("code", null, resp.RawBytes))
                        )
                    )
                )
            );
        }
    });

    var DownloadBodyLink = React.createClass({displayName: "DownloadBodyLink",
        render: function() {
            var b = this.props.body;
            var downloadMessage = "";
            var downloadLinkText = "";
            var msg = this.props.msg;

            if (b.DecodedSize != b.DisplaySize) {
                downloadMessage = "The " + msg + " was truncated for display.";
                downloadLinkText = "Download complete " + msg;
            } else if (b.Encoding != "") {
                downloadMessage = "The " + msg + " was decoded for display.";
                downloadLinkText = "Download original " + msg;
            } else {
                return null;
            }
            return (
                React.createElement("div", {className: "alert alert-warning"}, 
                    downloadMessage, " ", React.createElement("a", {href: '/inspect/http/' + this.props.rtId + '/' + msg}, downloadLinkText)
                )
            );
        },
    });


    var Tabs = React.createClass({displayName: "Tabs",
        getInitialState: function() {
            return {"selected": this.props.children[0].props.name}
        },
        render: function() {
            var $tabs = this;
            var tabs = React.Children.map(this.props.children, function(child) {
                var selected = $tabs.state.selected == child.props.name;
                var onSelect = function(e) {
                    e.preventDefault();
                    $tabs.setState({selected:child.props.name});
                };
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
                return (
                    React.createElement("tr", {key: key}, React.createElement("th", null, key), React.createElement("td", null, value))
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

    // Render a request body
    //
    // body - a serializedBody instance (with some post processing)
    var Body = React.createClass({displayName: "Body",
        render: function() {
            return (
                React.createElement("div", null, 
                    this.summary(), 
                    this.show(), 
                    this.error()
                )
            );
        },
        summary: function() {
            var b = this.props.body;
            if (!b.exists) {
                return null;
            }

            var battrs = [];
            if (b.CapturedSize != b.Size) {
                battrs.push(b.CapturedSize + " bytes captured");
            }
            if (b.DecodedSize != b.CapturedSize) {
                battrs.push(b.DecodedSize + " bytes decoded");
            }
            if (b.DisplaySize != b.DecodedSize) {
                battrs.push(b.DisplaySize + " bytes displayed");
            }
            var battrsStr = "";
            if (battrs.length > 0) {
                battrsStr = "(" + battrs.join(", ") + ")";
            }
            var contentType = b.RawContentType;
            if (b.Encoding != "") {
                contentType = contentType + ", " + b.Encoding + " encoded";
            }
            return React.createElement("h6", null, b.Size, " bytes ", contentType, " ", battrsStr);
        },
        show: function() {
            if (this.props.body.isForm) {
                return React.createElement(KeyVal, {title: "Form Params", attrs: this.props.body.Form});
            }
            if (!this.props.body.Binary && this.props.body.exists) {
                return React.createElement("pre", null, React.createElement("code", {ref: "code", dangerouslySetInnerHTML: {__html:this.props.body.Text}}));
            }
            return null;
        },
        error: function() {
            if (this.props.body.hasError) {
                return React.createElement("div", {className: "alert"}, this.props.body.Error);
            }
            return null;
        },
        // whenever we render or update a component, highlight the error location
        componentDidMount: function() {
            this.highlightError();
        },
        componentDidUpdate: function() {
            this.highlightError();
        },
        highlightError: function(prevProps, prevState) {
            var offset = this.props.body.ErrorOffset;
            if (offset < 0) {
                return;
            }
            // sometimes the ref just isn't there yet and I don't understand why
            if (!this.refs.code) {
                return;
            }

            // after render, highlight error location
            function textNodes(node) {
                var textNodes = [];

                function getTextNodes(node) {
                    if (node.nodeType == 3) {
                        textNodes.push(node);
                    } else {
                        for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                            getTextNodes(node.childNodes[i]);
                        }
                    }
                }

                getTextNodes(node);
                return textNodes;
            }

            var tNodes = textNodes(this.refs.code);
            for (var i=0; i<tNodes.length; i++) {
                offset -= tNodes[i].nodeValue.length;
                if (offset < 0) {
                    tNodes[i].parentNode.style.backgroundColor = "orange";
                    break;
                }
            }
        }
    });

    var durationFormat = function(d) {
        var toFixed = function(value, precision) {
            var power = Math.pow(10, precision || 0);
            return String(Math.round(value * power) / power);
        };
        var ns = d;
        var ms = ns / (1000 * 1000);
        if (ms > 1000) {
            return toFixed(ms / 1000, 2) + "s";
        } else {
            return toFixed(ms, 2) + "ms";
        }
    }

    var inspector = ReactDOM.render(React.createElement(InspectPage, null), document.getElementById("content"));
    inspector.start(window.data.RoundTrips, window.common.Session);
})();
