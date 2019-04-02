FROM node:8
MAINTAINER Rajiv Ramdhany "rajiv.ramdhany@bbc.co.uk"

LABEL version="2.0.0"
LABEL description="This service provides monitors timeline membership change events in a session and generates a synchronisation \
timeline for each timeline source-type pair. It dynamically runs a reduction function over the state of similar timelines to \
synthesise the state for the synchronisation timeline. The asynchrony reduction algorithm supports "

# update npm to v5.3.0
RUN rm -rf /usr/local/lib/node_modules/npm \
  && mkdir /usr/local/lib/node_modules/npm \
  && curl -sL https://github.com/npm/npm/archive/v5.3.0.tar.gz | tar xz -C /usr/local/lib/node_modules/npm --strip-components=1 \
  && npm --version


# Create service directory
RUN mkdir -p /usr/src/common
WORKDIR /usr/src/common
ADD common/ /usr/src/common
COPY package.json /usr/src/common
RUN npm install

WORKDIR /usr/src
RUN mkdir -p /usr/src/synccontroller

RUN npm install grunt-cli -g


RUN mkdir -p /usr/src/synccontroller/src
WORKDIR /usr/src/synccontroller/src
ADD synccontroller/src /usr/src/synccontroller/src

WORKDIR /usr/src/synccontroller
COPY synccontroller/Gruntfile.js /usr/src/synccontroller/

# Install service dependencies
COPY synccontroller/package.json /usr/src/synccontroller/
RUN npm install
RUN grunt build_lib

EXPOSE 3002

ENTRYPOINT ["node","src/main.js"]

