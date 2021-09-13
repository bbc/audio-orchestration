import argparse
from get_metadata import getMetadata 


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--duration', type=int, default=10, help='how many seconds to analyse')
    parser.add_argument('base_dir', help='base directory (output directory for split-tracks)')
    args = parser.parse_args();

    data = getMetadata(args.base_dir)

    print('Track, Duration, Count')
    for track in data:
        object_count = len(track.get('objects'))
        object_duration = 0
        for obj in track.get('objects'):
            object_duration += obj.get('duration')
        print('{},{},{}'.format(track.get('trackName'), object_duration, object_count))
