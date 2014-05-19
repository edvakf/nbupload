require(["widgets/js/widget"], function(WidgetManager){

    // byte size to read & send at once (~ 100kB)
    // multiple of 6 because we encode the bytes in base64
    var CHUNK_SIZE = 6 * 16 * 1024;

    // runs an array of asynchronous functions
    // each function takes a callback function that it calls after itself
    function run_chain(fns) {
        var next = fns.shift();
        if (!next) return;
        next(function() { run_chain(fns); });
    };

    var FileUploaderView = IPython.DOMWidgetView.extend({
        render: function(){
            this.setElement($('<input />').attr('type', 'file'));
        },

        events: {
            'change': 'handle_file_change',
        },

        handle_file_change: function(evt) {
            var file = evt.target.files[0];

            if (!file) {
                this._send_error('file not selected');
                return;
            }

            this.model.set('filename', file.name);
            this.touch();

            var that = this;
            var chain = [];

            for (var stop = 0, end = file.size; stop < end; stop += CHUNK_SIZE) {
                var chunk = file.slice(stop, stop + CHUNK_SIZE);
                var percentage = Math.floor(stop * 100 / end);

                // enclose loop variables
                (function(chunk, percentage) {
                    // add chain function
                    chain.push(function(callback) {
                        that.model.set('percentage', percentage);
                        that.touch();
                        that._send_file(chunk, callback);
                    });
                }(chunk, percentage));
            }
            chain.push(function(callback) {
                that.send({'event': 'eof'});
                that.model.set('percentage', 100);
                that.touch();
            });

            run_chain(chain);
        },

        _send_file: function(file, callback) {
            var reader = new FileReader();
            var that = this;
            reader.onerror = function(e) {
                that._send_error('an error occurred while reading the file');
            },
            reader.onload = function(e) {
                var dataurl = e.target.result;
                var match;
                if (!(match = /^data:.*?(;base64),/.exec(dataurl))) {
                    that._send_error('file could not be read');
                }
                var base64 = match[1] === ';base64';
                var pos = match[0].length;
                var len = dataurl.length;
                that.send({
                    'event': 'body',
                    'data': {
                        'payload': dataurl.slice(pos),
                        'base64': base64,
                    }
                });
                callback();
            };
            reader.readAsDataURL(file);
        },

        _send_error: function(message) {
            this.send({
                'event': 'error',
                'data': {
                    'message': message
                }
            })
        },
    });

    WidgetManager.register_widget_view('FileUploaderView', FileUploaderView);
});

