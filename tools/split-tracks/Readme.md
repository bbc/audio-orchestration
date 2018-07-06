# Split-tracks

A tool to detect and remove periods of silence from audio files to split them into individual
objects. It transforms a single mono wav file into many shorter files, and a metadata file
describing the starting points for each detected object.

Because ProTools and similar tools lack sufficient object-based audio output options.

## Setup

If numpy is already installed system wide, give the virtual env access to it when creating it:

```sh
python3 -m venv --system-site-packages env
. env/bin/activate
pip install numpy
pip install pandas
pip install pysndfile
```

## Usage:

For each input file, a directory in `--output` is created. This contains a `.wav` file for each
object detected in the input file, and a `.json` file describing the timing of those objects.

Make sure the environment is activated:

```sh
. env/bin/activate
```

For a single input file:

```sh
python3 split_tracks.py --gap 0.1 --output Assets_split/ Assets/001.wav
```

With _xargs_, processing all files in a directory in order:

```sh
ls Assets/*.wav | xargs python3 split_tracks.py --gap 0.1 --output Assets_split/
```

With _GNU parallel_ processing paths from a text file in parallel:

```sh
ls Assets/*.wav > inputs.txt
cat inputs.txt | parallel python3 split_tracks.py --gap 0.1 --output Assets_split/
```

The `--gap` parameter describes the minimum duration of silence between objects for them to be
considered separate.

## Additional scripts

These scripts further analyse the `.json` metadata files produced by the main tool:

 * `get_metadata.py <dir>` collects all the metadata files and outputs them as single json object.
 * `analyse_metadata_active_tracks.py --duration <seconds> <dir>` lists the active tracks for each second.
 * `analyse_metadata_utilisation.py <dir>` finds the number and total duration of objects for each track.

## Known issues

* Uses digital silence to detect object boundaries - assumes input is a multitrack session bounced
  from ProTools or similar.
* May fail if a file does not begin and end with at least one sample of silence.
