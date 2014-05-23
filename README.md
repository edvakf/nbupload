# nbupload

An IPython Notebook widget for letting users upload a file

## Install

```
pip install nbupload
```

## Usage

In IPython Notebook cell;

```
%load_ext nbupload
FileUploaderWidget()
```

This creates a file input DOM element.

File selected is automatically uploaded to the server running IPython.

The file is saved to the working directory of the notebook by default.
You can save it to a custom directory by supplying an optional argument.

```
FileUploaderWidget('/tmp')
```
