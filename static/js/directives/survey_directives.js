(function() {
  'use strict';

  var module = angular.module('communityshare.directives.survey', [
  ]);

  module.directive(
    'csQuestion',
    function() {
      return {
        scope: {
          question: '='
        },
        controller: function($scope) {
          // Set custom_answer to ' ' so that it is not initally
          // selected.
          $scope.custom_answer = ' ';
        },
        templateUrl: 'static/templates/question.html'
      };
    });
})();
