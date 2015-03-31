class db {

  exec { "restore-db":
    command => "restore_db_201503.sh",
    path => "/vagrant/puppet/modules/db/files/",
    timeout => 600,
    logoutput => on_failure,
  }

}