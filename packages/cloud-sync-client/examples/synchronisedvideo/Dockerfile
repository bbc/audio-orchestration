FROM node:carbon

WORKDIR /usr/src/app

COPY package.json ./
COPY /src ./src/
COPY *.js ./

RUN mkdir -p /logs
RUN ls -la /usr/src/app/*

RUN npm install
RUN npm install grunt-cli -g

EXPOSE 3000
ENTRYPOINT [ "npm", "start" ]