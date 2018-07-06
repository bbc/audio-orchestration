# encode-media

## Usage

Read metadata from `sequence.json`, encode files stored in `input`, store encoded files in `output`:

```
node encode-media.js sequence.json input output > sequence-distribution.json
```

## Requirements

Requires `ffmpeg --with-fdk-aac` >= 4.0 to have the latest version of the
[dash format](https://www.ffmpeg.org/ffmpeg-formats.html#dash-2), and include the Fraunhofer FDK AAC
codec. Using homebrew on MacOS, compile and install with `brew install ffmpeg --with-fdk-aac`.
