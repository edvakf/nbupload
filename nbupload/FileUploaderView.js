require(["widgets/js/widget"], function(WidgetManager){

    var FileUploaderView = IPython.DOMWidgetView.extend({
        render: function(){
            this.setElement($('<input />').attr('type', 'file'));
        },
        
        events: {
            'change': 'handle_file_change',
        },
        
        sendError: function(message) {
            this.send({
                'event': 'error',
                'data': {
                    'message': message
                }
            })
        },
               
        handle_file_change: function(evt) { 
            var file = evt.target.files[0];

            if (!file) {
                this.sendError('file not selected');
                return;
            }

            this.model.set('filename', file.name);
            this.touch();
            
            var that = this;
            var reader = new FileReader();
            
            reader.onerror = function(e) {
                that.sendError('an error occurred while reading the file');
            },
            reader.onload = function(e) {
                var dataurl = e.target.result;
                var match;
                if (!(match = /^data:.*?(;base64),/.exec(dataurl))) {
                    that.sendError('file could not be read');
                }
                var base64 = match[1] === ';base64';
                var pos = match[0].length;
                var len = dataurl.length;
                var part = 4 * 1000 * 100; // base64 must be partially decoded at fractions of 4 chars
                for (; pos < len; pos += part) {
                    that.send({
                        'event': 'body',
                        'data': {
                            'payload': dataurl.slice(pos, pos + part),
                            'base64': base64,
                            'percentage': Math.round(Math.min(pos + part, len) * 100 / len)
                        }
                    });
                }
                that.send({'event': 'eof'});
            };
            reader.readAsDataURL(file);
        },
    });
        
    WidgetManager.register_widget_view('FileUploaderView', FileUploaderView);
});

