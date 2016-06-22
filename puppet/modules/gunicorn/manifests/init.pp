class gunicorn {

  file { '/etc/gunicorn.d/vhost':
    ensure  => 'link',
    target  => '/vagrant/puppet/modules/gunicorn/files/vhost',
  }

  package { 'gunicorn':
     ensure => present,
  }

  file {'/usr/bin/gunicorn':
    ensure => 'link',
    target => '/vagrant/puppet/modules/gunicorn/files/gunicorn',
    require => Package['gunicorn'],
  }

  exec { "pip-gunicorn":
    command => "sudo pip3 install gunicorn",
    path => "/usr/bin/",
    tries => 2,
    timeout => 600,
    require => Package['python3-pip', 'python3.4-dev'], # The package dependecies needs to run first
    logoutput => on_failure,
  }

}