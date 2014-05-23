(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.user',
    [
      'communityshare.services.user',
      'communityshare.directives.user'
    ]);

  // User Views
  
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
          if ($scope.educatorViewMethods.onUserUpdate) {
            $scope.educatorViewMethods.onUserUpdate(user);
          }
        },
        function(response) {
          $scope.message = 'Could not find user with id=' + userId;
        });
      $scope.communityPartnerViewMethods = {};
      $scope.educatorViewMethods = {};
    });

  // User Signups

  module.controller(
    'SignupCommunityPartnerController',
    function($scope, Session, Messages, User, signUp, $location, $q) {
      // This controller relies on a CommunityPartnerSettings directive.
      $scope.Session = Session;
      $scope.newUser = new User();
      $scope.communityPartnerSettingsMethods = {}
      $scope.properties = {};
      $scope.saveSettings = function() {
        var userPromise = signUp($scope.newUser.name, $scope.newUser.email,
                                 $scope.newUser.password);
        userPromise.then(
          function(user) {
            var methods = $scope.communityPartnerSettingsMethods;
            if ((methods.setUser) && (methods.saveSettings)) {
              methods.setUser(user);
              var settingsPromise = methods.saveSettings();
              settingsPromise.then(
                function(search) {
                  $location.path('/search/' + search.id + '/results');
                },
                function(message) {
                  Messages.error(message);
                });
            }
          },
          function(message) {
            Messages.error(message);
          });
      };
    });

  module.controller(
    'SignupEducatorController',
    function($scope, Session, Messages, User, signUp, $location, $q, Search) {
      // This controller relies on a CommunityPartnerSettings directive.
      $scope.Session = Session;
      $scope.newUser = new User();
      $scope.properties = {};
      $scope.educatorSearchSettingsMethods = {}
      $scope.search = new Search({
        searcher_user_id: undefined,
        searcher_role: 'educator',
        searching_for_role: 'partner',
        active: true,
        labels: [],
        latitude: undefined,
        longitude: undefined,
        distance: undefined
      });
      
      $scope.saveSettings = function() {
        var userPromise = signUp($scope.newUser.name, $scope.newUser.email,
                                 $scope.newUser.password);
        userPromise.then(
          function(user) {
            $scope.search.searcher_user_id = user.id;
            var methods = $scope.educatorSearchSettingsMethods;
            if (methods.saveSettings) {
              var settingsPromise = methods.saveSettings();
              settingsPromise.then(
                function(search) {
                  $location.path('/search/' + search.id + '/results');
                },
                function(message) {
                  Messages.error(message);
                });
            }
          },
          function(message) {
            Messages.error(message);
          });
      };
    });

  // Settings Controller

  module.controller(
    'SettingsController',
    function($scope, $location, Session, Messages, $q) {
      $scope.Session = Session;
      $scope.user = Session.activeUser;
      $scope.properties = {};
      // Methods of 'setUser' and 'saveSettings' will be created by
      // the directive.
      $scope.communityPartnerSettingsMethods = {};
      if (Session.activeUser) {
        $scope.editedUser = Session.activeUser.clone();
      }

      var onError = function(message) {
        var msg = '';
        if (message) {
          msg = ': ' + message;
        }
        var msg = 'Failed to update settings' + msg;
        $scope.errorMessage = msg;
        $scope.successMessage = '';
      };
      
      $scope.saveSettings = function() {
        var saveUserPromise = $scope.editedUser.save();
        var combinedPromise;
        var saveCPSettingsPromise;
        var methods = $scope.communityPartnerSettingsMethods;
        if (methods.saveSettings) {
          saveCPSettingsPromise = methods.saveSettings();
          combinedPromise = $q.all([saveUserPromise, saveCPSettingsPromise]);
        } else {
          combinedPromise = $q.all([saveUserPromise]);
        }
        saveUserPromise.then(
          function(user) {
            Session.activeUser.updateFromData(user.toData());
          },
          onError);
        if (saveCPSettingsPromise) {
          saveCPSettingsPromise.then(
            function() {},
            onError);
        }
        combinedPromise.then(
          function() {
            $location.path('/home');
          });
      };
    });

})();
