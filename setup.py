from setuptools import setup

setup(
    name = "nbupload",
    version = "0.0.3",
    author = "Atsushi Takayama",
    author_email = "taka.atsushi@gmail.com",
    description = ("An IPython Notebook widget for letting users upload a file"),
    license = "MIT",
    keywords = "ipython notebook",
    url = "https://github.com/edvakf/nbupload",
    packages=['nbupload'],
    package_data = {
        'nbupload': ['FileUploaderView.js'],
    },
)
