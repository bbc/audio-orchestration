FROM node:11@sha256:a23014909228ec00666b0ddf5f28638a9fac8f844a972bed831838f6d1c73641

ENV http_proxy http://www-cache.rd.bbc.co.uk:8080
ENV https_proxy http://www-cache.rd.bbc.co.uk:8080

# need netcat for ssh so that we can use scp to deploy docs
# need zip for zap
RUN apt-get update && apt-get install -y netcat-openbsd zip

# create a dir that matches the yarn-cache location in pipeline
RUN mkdir -p /var/tmp/yarn-cache
RUN chmod 777 /var/tmp/yarn-cache

# create a directory for .npm to go in
RUN mkdir -p /var/tmp/home-for-npm
RUN chmod 777 /var/tmp/home-for-npm
