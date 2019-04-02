#!/bin/bash

progname=$0

die() {
    printf '%s\n' "$1" >&2
    exit 1
}


function usage () {

cat <<EOF
Usage: $progname [-h]
   -h   displays basic help
EOF
   exit 0
}

E_BADARGS=65
E_NOFILE=66

while :; do
    case $1 in
        -h|-\?|--help)
            usage    # Display a usage synopsis.
            exit
            ;;
        --)              # End of all options.
            shift
            break
            ;;
        -?*)
            printf 'WARN: Unknown option (ignored): %s\n' "$1" >&2
            ;;
        *)               # Default case: No more options, so break out of the loop.
            break
    esac

    shift
done

platform=`uname -s | tr [A-Z] [a-z] | tr -d ' '`
echo "platform detected: $platform"
addresses='unknown'
if [ $platform == 'linux' ]
then
  addresses=`ifconfig | grep 'inet addr' | grep 'Mask:255.255.255.0' | cut -d ':' -f 2 | cut -d ' ' -f 1`
elif [ $platform == 'darwin' ]
then
  addresses=`ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1'`
elif [ $platform == "freebsd" ]
then
  addresses=`ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1'`
else
  echo "platform not supported"
fi

myArray=($addresses)
echo "setting PUBLIC_IP env variable to: ${myArray[0]}"
echo "writing config file $PWD/examples/synchronisedvideo/config/config.js"
echo "module.exports = { hostname: \"${myArray[0]}\", port:9001};" > $PWD/examples/synchronisedvideo/config/config.js
echo "writing config file $PWD/examples/synchronisedvideo/src/js/config.js"
echo "module.exports = { hostname: \"${myArray[0]}\", port:9001};" > $PWD/examples/synchronisedvideo/src/js/config.js
echo "calling docker-compose up"
grunt build_lib
docker-compose up -d --scale synccontroller=2

