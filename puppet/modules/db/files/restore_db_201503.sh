#!/usr/bin/env bash

echo "boo";
if [ -f /vagrant/dump.sql ]; then
  if [ ! -f /home/vagrant/restored_dump ]; then
    su communityshare -c "
    pg_restore --verbose --clean --no-acl --no-owner -d communityshare /vagrant/dump.sql;
    psql communityshare < /vagrant/update_scripts/modify201503.sql;
"
    python3 /vagrant/update_scripts/update_search.py;
    touch /home/vagrant/restored_dump;
  fi;
fi;

