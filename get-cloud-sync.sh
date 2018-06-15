#!/bin/bash

AUDIOTEAM_PATH=${AUDIOTEAM_PATH:-/audioteam}
ZIP_PATH=$AUDIOTEAM_PATH/2-inprogress-projects/MDO-WebDelivery/software/cloud-sync/cloud-sync.zip

fail() {
  echo ""
  echo ""
  echo "Could not unzip $ZIP_PATH."
  echo "If the audioteam drive is not mounted at $AUDIOTEAM_PATH, run this script as:"
  echo "AUDIOTEAM_PATH=/your/path/to/audioteam $0"
  exit 1
}

unzip $ZIP_PATH -x __MACOSX/* -d || fail
npm install || exit 1
npm run prepare
