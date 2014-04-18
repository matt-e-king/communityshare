(function() {
  'use strict';
  
  var module = angular.module('communityshare.directives.home', [
  ]);

  module.directive(
    'csAdministratorHome',
     function(Session) {
       return {
         scope: false,
         templateUrl: './static/templates/administrator_home.html',
         controller: 'AdministratorHomeController'
       };
     });
  
})();
