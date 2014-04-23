(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.user',
    [
      'communityshare.services.user',
      'communityshare.directives.user'
    ]);
  
  module.controller(
    'UserController',
    function($scope, $routeParams, User, Session) {
      $scope.Session = Session;
      var userId = $routeParams.userId;
      var userPromise = User.get(userId);
      $scope.message = 'Loading user...'
      userPromise.then(
        function(user) {
          $scope.message = '';
          $scope.user = user;
          if ($scope.communityPartnerViewMethods.onUserUpdate) {
            $scope.communityPartnerViewMethods.onUserUpdate(user);
          }
        },
        function(response) {
          $scope.message = 'Could not find user with id=' + userId;
        });
      $scope.communityPartnerViewMethods = {};
    });

  module.controller(
    'CommunityPartnerViewController',
    function($scope, sortLabels, Search) {
      $scope.methods.onUserUpdate = function(user) {
        var searchParams = {
          'searcher_user_id': user.id
        };
        var searchesPromise = Search.get_many(searchParams);
        searchesPromise.then(
          function(searches) {
            var labels = [];
            for (var i=0; i<searches.length; i++) {
              var search = searches[i];
              if (search.active) {
                labels = labels.concat(search.labels);
              }
            }
            $scope.labels = sortLabels(labels);
          },
          function() {
          });
      };
      if ($scope.user) {
        $scope.methods.onUserUpdate($scope.user);
      }
    });

  module.controller(
    'SettingsController',
    function($scope, Session) {
      $scope.Session = Session;
      if (Session.activeUser) {
        $scope.editedUser = Session.activeUser.clone();
      }
      $scope.saveSettings = function() {
        var savePromise = $scope.editedUser.save();
        savePromise.then(
          function(user) {
            Session.activeUser.updateFromData(user.toData());
          },
          function(response) {
            console.log('failed to save user');
          });
      };
    });

})();
