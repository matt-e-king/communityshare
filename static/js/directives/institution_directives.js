(function() {
  'use strict';
  
  var module = angular.module('communityshare.directives.institutions', [
  ]);

  module.directive(
    'csInstitutions',
     function(Session) {
       return {
         scope: {
           institutions: '='
         },
         templateUrl: './static/templates/institution_adder.html'
       };
     });
  
})();
