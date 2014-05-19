# load_ipython_extension & unload_ipython_extension are called
# through %load_ext magic
# http://ipython.org/ipython-doc/dev/config/extensions/
__all__ = [
    'load_ipython_extension',
    'unload_ipython_extension',
]

from .FileUploaderWidget import FileUploaderWidget
import os

def load_ipython_extension(ipython):
    """expose uploader widget to the notebook

    * register FileUploaderView by calling %%javascript cell magic
    * add FileUploaderWidget to the user namespace
    """
    jsfile = os.path.join(os.path.dirname(__file__), 'FileUploaderView.js')
    with open(jsfile) as f:
        ipython.run_cell_magic('javascript', '', f.read())

    ipython.push({'FileUploaderWidget': FileUploaderWidget})

def unload_ipython_extension(ipython):
    """remove FileUploaderWidget

    currently there is no way to un-registering a widget view
    """
    ipython.drop_by_id({'FileUploaderWidget': FileUploaderWidget})

