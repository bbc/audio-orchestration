import numpy as np
import pandas as pd
import json
from pysndfile import PySndfile, construct_format
import os
import argparse

def getPaths(base_dir, ext):
    """
        For the given directory, returns a list of paths for all files in it with
        that extension.
    """

    return list(map(lambda name: os.path.join(base_dir, name),
        filter(lambda name: os.path.splitext(name)[1] == ext,
            os.listdir(base_dir))))

def timecode(s, sr):
    """
        Creates a timecode string for the given number of samples and sample rate.
    """
    total_seconds = s / sr
    minutes = int(total_seconds / 60)
    seconds = int(total_seconds % 60)
    milliseconds = int((total_seconds * 1000) % 1000)

    return '{:02d}m{:02d}s.{:03d}'.format(
        minutes,
        seconds,
        milliseconds
    )

def analyse_slow(p, gap):
    a = PySndfile(p)
    ff = a.read_frames(dtype=np.int32)

    min_gap_samples = round(gap * a.samplerate())

    zero_count = 0
    non_zero_count = 0
    sample_offset = 0
    gaps = []
    for s in ff.flat:
        if s == 0:
            # still in silence
            zero_count += 1
        else:
            # reached the start of an object after a long period of silence.
            if zero_count > min_gap_samples:
                gaps += [(s - zero_count, s)]
            # reset the zero count even if the gap was short
            zero_count = 0

        sample_offset += 1

    for g in gaps:
        (start, end) = g
        print('{} -- {}'.format(
            timecode(start, a.samplerate()),
            timecode(end, a.samplerate())
        ))

    del a
    del ff

def analyse(p, gap):
    a = PySndfile(p)
    sr = a.samplerate()
    min_gap_samples = round(gap * sr)

    # load samples into a data frame
    try:
        series = pd.Series(a.read_frames(dtype=np.int32))
    except Exception as e:
        print("Could not process audio data. The file may have too many channels (all files must be mono).\n\n")
        raise e

    # close soundfile
    del a

    # if track is entirely empty, return immediately.
    if np.count_nonzero(series) == 0:
        return sr, [], series

    # a data frame of booleans, saying whether a sample was nonzero or not
    nonzero = (series != 0)

    # shift the frame by one sample and compare to make this one true if there was a transition
    transitions = (nonzero != nonzero.shift(1))

    # find the indices where transitions as a non-zero (== true) value
    transition_indices = transitions.iloc[np.flatnonzero(transitions)]

    # apply minimum gap length to reduce number of close transitions
    last_transition = 0
    object_start = 0
    objects = []

    for t in transition_indices.keys():
        if series[t] == 0:
            # transition was to silence
            last_transition = t
        else:
            # transition was to object.
            # if gap was long enough, end the previous object and start a new one
            if (t - last_transition) > min_gap_samples:
                if (object_start < last_transition):
                    # to avoid creating empty objects
                    objects += [(object_start, last_transition)]
                object_start = t

    if len(objects) == 0:
        # no gaps found at all, assume a single object for the entire file.
        objects += [(object_start, last_transition)]
    else:
        # Add the last object if it was left incomplete (ended by a transition to silence after the object start)
        # TODO: assuming the file starts and ends with at least one sample of silence.
        (last_start, _) = objects[-1]
        if last_transition > last_start and last_transition > object_start:
            objects += [(object_start, last_transition)]

    return sr, objects, series

def printObjects(sr, objects):
    for i in range(len(objects)):
        (start, end) = objects[i]
        print('{}: {} -- {}'.format(i, timecode(start, sr), timecode(end, sr)))

def process(p, gap, outpath):
    sr, objects, data = analyse(p, gap)
    printObjects(sr, objects)

    # create output directory for this track
    basename = os.path.splitext(os.path.basename(p))[0]
    out_dir = os.path.abspath(os.path.join(outpath, basename))
    os.makedirs(out_dir, exist_ok=True)

    # create per-object sound files with PySndfile?
    metadata = []
    for i in range(len(objects)):
        (start, end) = objects[i]
        out_name = '{}_{:04d}.wav'.format(basename, i)

        a = PySndfile(os.path.join(out_dir, out_name), 'w', construct_format('wav', 'pcm24'), 1, sr)
        a.write_frames(data[start:end].values)

        metadata += [{
            'filename': out_name,
            'startSample': start,
            'startTime': round(start / sr, 5),
            'duration': round((end - start) / sr, 5),
            'startTimecode': timecode(start, sr)
        }]

        print('wrote', out_name);
        del a

    metadata_name = '{}.json'.format(basename)
    with open(os.path.join(out_dir, metadata_name), 'w+') as f:
        json.dump(metadata, f, indent=2)
        print('wrote metadata', metadata_name)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', help='path to output directory', default='output')
    parser.add_argument('--gap', type=float, help='minimum duration of silence between objects to separate them, in seconds', default=0.1)
    parser.add_argument('input_files', action='append')
    args = parser.parse_args();

    for p in args.input_files:
        process(p, args.gap, args.output)

