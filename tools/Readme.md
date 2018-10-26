# MDO Packaging Tools

The `prepare.sh` script brings together the different tools, it is usually sufficient to just use this. The components are:

* `split-tracks`: removes silence from the input `.wav` files and creates an initial metadata file describing timings of the rendering items.
* `encode-media`: runs `ffmpeg` to create the DASH streams and manifests. There are currently two versions, one for safari and one for all other browsers.
* `generate-sequence`: creates the final `sequence.json` metadata file.

## Dependencies

* Python3 (with `numpy`, `pandas`, and `pysndfile`)
* Node.js
* ffmpeg (--with-fdk-aac)
* GNU `parallel`
* `realpath`

## Standard usage

Usage: `./prepare.sh` `~/path/to/metadata.csv` `~/path/to/destination-folder` `path where this appears on the server`, for example:

```
./prepare.sh ~/my-mdo-audio/metadata.csv ~/my-mdo-experience/audio/my-mdo-audio audio/my-mdo-audio
```

More details in the template tutorial: https://github.com/bbc/bbcat-orchestration-template/tree/master/tutorial
