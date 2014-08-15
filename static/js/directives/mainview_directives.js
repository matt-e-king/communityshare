(function() {
  'use strict';
  
  var module = angular.module('communityshare.directives.mainview', [
    'ui.bootstrap.alert'
  ]);

  module.directive(
    'csRegistrationWrapper',
    function() {
      return {
        templateUrl: '/static/templates/registration_wrapper.html',
        transclude: true
      }
    });

  module.directive(
    'csStandardWrapper',
    function() {
      return {
        templateUrl: '/static/templates/standard_wrapper.html',
        transclude: true
      }
    });

  module.directive(
    'csSideNav',
    function() {
      return {
        templateUrl: '/static/templates/sidenav.html'
      };
    });

  module.directive(
    'csNavBar',
    function() {
      return {
        templateUrl: '/static/templates/navbar.html',
        replace: true
      };
    });

  module.directive(
    'csFooter',
    function() {
      return {
        templateUrl: '/static/templates/footer.html'
      };
    });

  module.directive(
    'csUserAgreement',
    function() {
      return {
        templateUrl: '/static/templates/user_agreement.html'
      };
    });

  module.directive(
    'csForbidden',
    function() {
      return {
        templateUrl: '/static/templates/forbidden.html'
      };
    });

  module.directive(
    'csDatepicker',
    function() {
      return {
        scope: {
          'ngModel': '='
        },
        templateUrl: '/static/templates/datepicker.html',
        controller: function($scope) {

          $scope.today = function() {
            $scope.ngModel = new Date();
          };

          $scope.clear = function () {
            $scope.ngModel = null;
          };

          $scope.minDate = new Date();
          $scope.maxDate = new Date();
          $scope.maxDate.setFullYear($scope.maxDate.getFullYear()+1);
          
          $scope.open = function($event) {
            $event.preventDefault();
            $event.stopPropagation();
            $scope.opened = true;
          };

          $scope.dateOptions = {
            formatYear: 'yy',
            startingDay: 1
          };
        }
      };
    });

})();
