protoc --js_out=import_style=commonjs,binary:. syncevents.proto

protoc -I=./ --java_out=./ syncevents.proto