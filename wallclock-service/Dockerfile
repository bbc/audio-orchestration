FROM node:8
MAINTAINER Rajiv Ramdhany "rajiv.ramdhany@bbc.co.uk"

LABEL version="2.0.0"
LABEL description="This service provides time synchronisation capability to clients \
via different protocol transports e.g. UDP, WebSockets."

# update npm to v5.3.0
RUN rm -rf /usr/local/lib/node_modules/npm \
  && mkdir /usr/local/lib/node_modules/npm \
  && curl -sL https://github.com/npm/npm/archive/v5.3.0.tar.gz | tar xz -C /usr/local/lib/node_modules/npm --strip-components=1 \
  && npm --version

# Create app directory
RUN mkdir -p /usr/src/wallclockservice
WORKDIR /usr/src/wallclockservice

# Install app dependencies
COPY package.json /usr/src/wallclockservice/
RUN npm install

# Bundle app source
COPY Gruntfile.js /usr/src/wallclockservice/
RUN mkdir -p /usr/src/wallclockservice/src
COPY src /usr/src/wallclockservice/src/

EXPOSE 80 6676 6677/udp

CMD [ "npm", "start" ]