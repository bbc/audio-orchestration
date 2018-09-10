#!/bin/sh

if [ $# '!=' 3 ]; then
  echo "Usage:"
  echo "$0 objects.csv output/path base/url"
  exit 1
fi

# Requries realpath and gnu parallel to be installed on the system

SRC_OBJECTS_CSV=$1
DEST=$2
BASE_URL=$3
GAP=0.1

SRC=$(dirname $(realpath $SRC_OBJECTS_CSV))
SRC_FILES=$(cat $SRC_OBJECTS_CSV | tail -n +2 | awk -v dir="$SRC/" -F "," '{print dir$3}')
SPLIT_DEST=$(mktemp -d)

error() {
  echo "### Command Failed. ###"
  rm -r $SPLIT_DEST
  exit 1
}

echo ""
echo "### Splitting Tracks ###"
echo ""


(
  cd split-tracks
  . env/bin/activate
  for f in $SRC_FILES; do
    python split_tracks.py --gap $GAP --output $SPLIT_DEST $f
  done
  python get_metadata.py $SPLIT_DEST > $SPLIT_DEST/tracks.json
  exit $?
) || error

echo ""
echo "### Generating sequence metadata ###"
echo ""

(
  cd generate-sequence
  node mdo-metadata-to-sequence.js $SRC_OBJECTS_CSV $SPLIT_DEST/tracks.json > $SPLIT_DEST/sequence.json
) || error

echo ""
echo "### Encoding Audio for safari ###"
echo ""

mkdir -p $DEST/safari || error

(
  cd encode-media
  node encode-media $SPLIT_DEST/sequence.json $SPLIT_DEST $DEST/safari $BASE_URL/safari
) || error

echo ""
echo "### Encoding Audio for headerless streams ###"
echo ""

mkdir -p $DEST/headerless || error

(
  cd encode-media
  node encode-media-headerless $SPLIT_DEST/sequence.json $SPLIT_DEST $DEST/headerless $BASE_URL/headerless
) || error

echo ""
echo "### Done ###"
echo "Encoded audio and metadata files are here: $DEST"
echo ""

rm -r $SPLIT_DEST
