from __future__ import print_function
from IPython.html import widgets
from IPython.utils.traitlets import Unicode
from IPython.display import clear_output
import binascii
import os, sys

class FileUploaderWidget(widgets.DOMWidget):
    _view_name = Unicode('FileUploaderView', sync=True)
    filename = Unicode(sync=True)
    _file_handler = None

    def __init__(self, dirname=None, **kwargs):
        widgets.DOMWidget.__init__(self, **kwargs)

        if dirname == None:
            self.dirname = os.getcwd()
        else:
            self.dirname = os.path.abspath(dirname)

        self.on_msg(self._handle_custom_msg)

    def close_file(self):
        """Close file opened by the instance if there are any.
        """
        if self._file_handler != None:
            self._file_handler.close()
            self._file_handler = None

    def _filename_changed(self):
        """Called when file input form is updated.
        """
        self.close_file()
        self._file_handler = open(os.path.join(self.dirname, self.filename), 'wb')

    def _handle_custom_msg(self, content):
        """Handle a msg from the front-end.

        Parameters
        ----------
        content: dict
            'event': type of event sent from client
            'data': detail of event
        """
        if 'event' in content:
            if content['event'] == 'error':
                self._on_error(content['data'])
            elif content['event'] == 'body':
                self._on_body(content['data'])
            elif content['event'] == 'eof':
                self._on_eof()

    def _on_body(self, data):
        """Called when chunk of file body is received.

        Parameters
        ----------
        content: data
            'payload': base64 encoded content of file
            'percentage': percentage of file sent
        """
        payload = binascii.a2b_base64(data['payload'])
        self._file_handler.write(payload)
        self._update_percentage(data['percentage'])

    def _on_eof(self):
        """Called when file upload finished.
        """
        self.close_file()
        self._update_percentage(100)
        print(u'Saved: {}'.format(self.filename))

    def _on_error(self, data):
        """Called when error is received.

        Parameters
        ----------
        content: data
            'message': error message
        """
        self.close_file()
        print(u'Error: {}'.format(data['message']), file=sys.stderr)

    def _update_percentage(self, percentage):
        """Clear current output and print progress bar
        """
        bar = 'Progress ['
        length = 50
        for i in range(0, length):
            if ((i + 1) / length * 100 <= percentage):
                bar += '*'
            else:
                bar += ' '
        bar += ']'
        clear_output(wait=True) # avoid flickering
        print(bar)
