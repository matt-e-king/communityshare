(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.search',
    [
      'communityshare.services.user',
      'communityshare.services.search'
    ]);
  
  var makeSignUpController = function(controllerName, searcher_role,
                                      searching_for_role) {
    module.controller(
      controllerName,
      function($scope, $location, $q, Session, signUp, Search, User) {
        $scope.Session = Session;
        $scope.activeLabels = {};
        $scope.newUser = new User();
        $scope.message = '';
        $scope.getLabels = function() {
          var labels = [];
          for (var label in $scope.activeLabels) {
            if ($scope.activeLabels[label]) {
              labels.push(label);
            }
          }
          return labels;
        };
        $scope.saveSettings = function() {
          var userPromise = signUp($scope.newUser.name, $scope.newUser.email,
                                   $scope.newUser.password);
          var searchPromise = userPromise.then(
            function(user) {
              var newSearch = new Search({
                searcher_user_id: user.id,
                searcher_role: searcher_role,
                searching_for_role: searching_for_role,
                active_only: false,
                labels: $scope.getLabels()
              });
              return newSearch.save();
            },
            function(message) {
              var deferred = $q.defer();
              deferred.reject('Failed to signup: ' + message);
              return deferred.promise;
            });
          searchPromise.then(
            function(search) {
              console.log('search is - ' + search);
            $location.path('/home');
            },
            function(message) {
              $scope.message =
                "Failed to save preferences: " + message;
            }
          );
        };
      });
  };

  makeSignUpController('SignupEducatorController', 'educator', 'partner')
  makeSignUpController('SignupCommunityPartnerController', 'partner', 'educator')

})();
