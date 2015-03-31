user { 'communityshare':}

exec { 'apt-get update':
  path => '/usr/bin',
  }

package { 'emacs':
  ensure => present,
  }
package { 'git':
  ensure => present,
}
package { 'python3.4':
  ensure => present,
}
package { 'python3-pip':
  ensure => present,
}
package { 'python3.4-dev':
  ensure => present,
}
package { 'python3.4-psycopg2':
  ensure => present,
}

class { 'postgresql::server': }
class { 'postgresql::lib::devel': }

postgresql::server::db { 'communityshare':
  user     => 'communityshare',
  password => postgresql_password('communityshare', 'communityshare'),
}

postgresql::validate_db_connection { 'validate my postgres connection':
  database_host           => 'localhost',
  database_username       => 'communityshare',
  database_password       => 'communityshare',
  database_name           => 'communityshare',
}

file { '/var/www/':
  ensure => 'directory',
  }

exec { "pip-install-requirements":
  command => "sudo pip3 install apscheduler flask jinja2 markupsafe sqlalchemy werkzeug aniso8601 argparse html2text itsdangerous mimerender passlib pycrypto python-dateutil python-mimeparse pytz requests six tinys3",
  path => "/usr/bin/",
  tries => 2,
  timeout => 600,
  require => Package['python3-pip', 'python3.4-dev'], # The package dependecies needs to run first
  logoutput => on_failure,
}

exec { "nltk-install-A":
  command => "sudo pip3 install nltk",
  path => "/usr/bin",
  tries => 2,
  timeout => 60, 
  require => Package['python3-pip'],
  logoutput => on_failure,
}

exec { "nltk-install-B":
  command => "python3 -m nltk.downloader -d /usr/share/nltk_data wordnet stopwords punkt maxent_treebank_pos_tagger",
  path => "/usr/bin",
  tries => 2,
  timeout => 1200, 
  require => Package['python3-pip'],
  logoutput => on_failure,
}

file { '/var/log/community_share':
  ensure => 'directory',
  group => 'adm',
  owner => 'www-data',
  }


include db, nginx, gunicorn