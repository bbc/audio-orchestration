FROM ubuntu:16.04
MAINTAINER Rajiv Ramdhany <rajiv.ramdhany@bbc.co.uk>
ENV REFRESHED_AT 2017-09-13

RUN apt-get -qq update
RUN apt-get -qq install curl unzip

ADD https://releases.hashicorp.com/consul/0.8.0/consul_0.8.0_linux_amd64.zip /tmp/consul.zip
RUN cd /usr/sbin && unzip /tmp/consul.zip && chmod +x /usr/sbin/consul && rm /tmp/consul.zip

RUN mkdir -p /webui/
ADD https://releases.hashicorp.com/consul/0.8.0/consul_0.8.0_web_ui.zip /webui/webui.zip
RUN cd /webui && unzip webui.zip && rm webui.zip

ADD consul.json /config/

EXPOSE 53/udp 8300 8301 8301/udp 8302 8302/udp 8400 8500

VOLUME ["/data"]

ENTRYPOINT [ "/usr/sbin/consul", "agent", "-ui", "-config-dir=/config" ]
CMD []
