import os
import json
import argparse

def getMetadata(base_dir):
    """
        Find all json files in output dir and return their parsed contents as a list of lists.
    """

    metadata = []
    for entry in os.scandir(base_dir):
        if not entry.is_dir():
            continue

        dir_data = {
            'trackName': entry.name,
        }
        for name in os.listdir(os.path.join(base_dir, entry.name)):
            basename, ext = os.path.splitext(name)
            if ext == '.json':
                with open(os.path.join(base_dir, entry.name, name), 'r') as f:
                    dir_data['objects'] = json.load(f)

        metadata += [dir_data]
    return metadata

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('base_dir', help='base directory (output directory for split-tracks)')
    args = parser.parse_args();

    data = getMetadata(args.base_dir)
    print(json.dumps(data, indent=2))

