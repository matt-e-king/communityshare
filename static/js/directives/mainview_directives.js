(function() {
  'use strict';
  
  var module = angular.module('communityshare.directives.mainview', [
    'ui.bootstrap.alert'
  ]);

  module.directive(
    'csForbidden',
    function() {
      return {
        templateUrl: '/static/templates/forbidden.html',
      };
    });

})();
