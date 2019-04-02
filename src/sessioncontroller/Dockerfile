FROM node:8
MAINTAINER Rajiv Ramdhany "rajiv.ramdhany@bbc.co.uk"

LABEL version="2.0.0"
LABEL description="This service provide session management functions to the Sync Service and handles \
requests from clients"

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
RUN mkdir -p /usr/src/sessioncontroller

RUN npm install grunt-cli -g


RUN mkdir -p /usr/src/sessioncontroller/src
WORKDIR /usr/src/sessioncontroller/src
ADD sessioncontroller/src /usr/src/sessioncontroller/src

WORKDIR /usr/src/sessioncontroller
COPY sessioncontroller/Gruntfile.js /usr/src/sessioncontroller/

# Install service dependencies
COPY sessioncontroller/package.json /usr/src/sessioncontroller/
RUN npm install
RUN grunt build_lib

EXPOSE 4000

ENTRYPOINT ["node","src/main.js"]

