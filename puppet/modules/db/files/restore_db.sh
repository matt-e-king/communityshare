#!/usr/bin/env bash

if [ -f /vagrant/dump.sql ]; then
  if [ ! -f /home/vagrant/restored_dump ]; then
    su postgres;
    pg_restore --verbose --clean --no-acl --no-owner -h localhost -d communityshare /vagrant/dump.sql;
    touch /home/vagrant/restored_dump;
    psql < /vagrant/update_scripts/modify201503.sql;
    python3 /vagrant/update_scripts/update_search.py;
    exit;
  fi;
fi;
