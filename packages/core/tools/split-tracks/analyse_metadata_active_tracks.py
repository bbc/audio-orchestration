import argparse
from get_metadata import getMetadata

def overlaps(s1, e1, s2, e2):
    # 1 entirely within 2
    if s1 >= s2 and e1 <= e2:
        return True
    # 2 entirely within 1
    if s1 <= s2 and e1 >= e2:
        return True
    # 2 starts within 1
    if s2 >= s1 and s2 <= e1:
        return True
    # 2 ends within 1
    if e2 >= s1 and e2 <= e1:
        return True
    return False

def activeTracks(data, start, end):
    active = []
    for track in data:
        for obj in track['objects']:
            objStart = obj['startTime']
            objEnd = objStart + obj['duration']
            if overlaps(start, end, objStart, objEnd):
                active += [track['trackName']]
                break
    return active

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--duration', type=int, default=10, help='how many seconds to analyse')
    parser.add_argument('base_dir', help='base directory (output directory for split-tracks)')
    args = parser.parse_args();

    data = getMetadata(args.base_dir)
    for i in range(args.duration):
        active = activeTracks(data, i, i+1)
        print('{}, {}, {}'.format(i, len(active), ', '.join(active)))

