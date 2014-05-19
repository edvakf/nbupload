from __future__ import print_function
from IPython.html import widgets
from IPython.utils.traitlets import Unicode, Int
import binascii
import os

class FileUploaderWidget(widgets.DOMWidget):
    _view_name = Unicode('FileUploaderView', sync=True)
    filename = Unicode(sync=True)
    percentage = Int(0, sync=True)
    _file_handler = None

    def __init__(self, dirname=None, **kwargs):
        widgets.DOMWidget.__init__(self, **kwargs)

        if dirname == None:
            self.dirname = os.getcwd()
        else:
            self.dirname = os.path.abspath(dirname)

        self.error = widgets.CallbackDispatcher()
        self.loaded = widgets.CallbackDispatcher()

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
        self.percentage = 0

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
                self._on_chunk(content['data'])
            elif content['event'] == 'eof':
                self._on_eof()

    def _on_chunk(self, data):
        """Called when chunk of file body is received.

        Parameters
        ----------
        content: data
            'base64': whether payload is base64 encoded; boolean
            'payload': chunk of data
        """
        payload = data['payload']
        if data['base64']:
            payload = binascii.a2b_base64(payload)
        self._file_handler.write(payload)
        self.percentage = data['percentage']

    def _on_eof(self):
        """Called when file upload finished.
        """
        self.close_file()
        self.loaded()

    def _on_error(self, data):
        self.error(data['message'])

