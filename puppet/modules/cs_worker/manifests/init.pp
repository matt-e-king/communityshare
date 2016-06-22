class cs_worker {

  file { '/etc/init.d/cs_worker':
    ensure  => 'link',
    target  => '/vagrant/puppet/modules/cs_worker/files/cs_worker',
  }

  file { '/var/run/cs_worker':
    ensure  => 'directory',
    group => 'adm',
    owner => 'www-data',    
  }

  # Make sure that the nginx service is running
  service { 'cs_worker':
    ensure => running,
  }
  

}