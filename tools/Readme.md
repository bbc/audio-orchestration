# MDO Packaging Tools

The `prepare.sh` script brings together the different tools, it is usually sufficient to just use this. The components are:

* `split-tracks`: removes silence from the input `.wav` files and stores some metadata about timings.
* `generate-sequence`: creates an intermediate `sequence.json` metadata file based on the output from `split-tracks`.
* `encode-media`: runs `ffmpeg` to create the DASH streams and manifests, and the final `sequence.json` metadata file, including paths to the encoded audio. There are currently two versions, one for Safari and one for all other browsers, because a slightly different DASH format is required.

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
