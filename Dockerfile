FROM ubuntu:14.04

ADD . /communityshare
WORKDIR /communityshare

RUN apt-get update && apt-get -y install python3 python3-pip libpq-dev python-dev python3-all-dev && pip3 install -r /communityshare/requirements.txt

CMD /communityshare/start_dev.sh
