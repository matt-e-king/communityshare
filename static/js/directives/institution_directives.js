(function() {
  'use strict';
  
  var module = angular.module('communityshare.directives.institutions', [
    'communityshare.services.user'
  ]);

  module.directive(
    'csInstitutions',
     function(Session, Institution) {
       return {
         scope: {
           user: '='
         },
         templateUrl: './static/templates/institution_adder.html',
         controller: function($scope) {
           // FIXME: Not scaleable.  Change to get the most popular.
           var institutionsPromise = Institution.get_many();
           $scope.institution_options = [];
           institutionsPromise.then(
             function(institutions) {
               $scope.institution_options = institutions;
             });
         }
       };
     });
  
})();
