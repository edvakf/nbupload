require(["widgets/js/widget"], function(WidgetManager){

    // byte size to read & send at once (~ 100kB)
    // multiple of 6 because we encode the bytes in base64
    var CHUNK_SIZE = 6 * 16 * 1024;

    /**
     * jQuery Deferred wrapper of FileReader
     *
     * @param {Blob} blob of a file http://www.w3.org/TR/FileAPI/#dfn-Blob
     * @return Promise that resolves with the base64 encoded file content
     */
    var readFile = function(file) {
        var deferred = $.Deferred();
        var reader = new FileReader();
        reader.onerror = function(e) {
            deferred.reject('an error occurred while reading the file');
        },
        reader.onload = function(e) {
            var m, dataurl = e.target.result;
            if (!(m = /^data:.*?(;base64),/.exec(dataurl))) {
                deferred.reject('file could not be read');
            }
            if (m[1] !== ';base64') {
                deferred.reject('only base64 encoded data-uri is supported');
            }
            deferred.resolve(dataurl.slice(m[0].length));
        };
        reader.readAsDataURL(file);
        return deferred.promise();
    };

    /**
     * read file progressively with jQuery Deferred's "progress" interface
     *
     * @param {Blob} blob of a file http://www.w3.org/TR/FileAPI/#dfn-Blob
     * @return Promise
     */
    var progressiveReadFile = function(file) {
        var d_progress = $.Deferred(); // deferred to return
        var d_chain = $.Deferred(); // last of the internal deferred chain
        var d_kick = d_chain; // first of the internal deferred chain

        for (var from = 0, total = file.size; from < total; from += CHUNK_SIZE) {
            (function(from) {
                d_chain = d_chain.then(function() {
                    var to = Math.min(from + CHUNK_SIZE, total);
                    var slice = file.slice(from, to);
                    return readFile(slice).then(
                        function (data) {
                            d_progress.notify({
                                'total_bytes': total,
                                'range_start': from,
                                'range_end': to,
                                'chunk': data,
                            });
                        },
                        function (err) {
                            d_progress.reject(err);
                        }
                    );
                });
            } (from));
        }
        d_chain.then(function() {
            d_progress.resolve();
        });
        d_kick.resolve();
        return d_progress.promise();
    };

    /**
     * IPython notebook widget for uploading a local file to notebook server
     *
     * @class FileUploaderView
     */
    var FileUploaderView = IPython.DOMWidgetView.extend({
        render: function(){
            this.setElement($('<input type="file"/>'));
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

            this._handle_file(file);
        },

        _handle_file: function(file) {
            var that = this;
            progressiveReadFile(file).then(
                function done() {
                    that.send({'event': 'eof'});
                },
                function fail(err) {
                    that._send_error(err);
                },
                function progress(data) {
                    var percentage = Math.floor(data['range_end'] / data['total_bytes'] * 100);
                    that._send_body(data['chunk'], percentage);
                }
            );
        },

        _send_body: function(payload, percentage) {
            this.send({
                'event': 'body',
                'data': {
                    'payload': payload,
                    'percentage': percentage,
                }
            });
        },

        _send_error: function(message) {
            this.send({
                'event': 'error',
                'data': {
                    'message': message
                }
            });
        },
    });

    WidgetManager.register_widget_view('FileUploaderView', FileUploaderView);
});

