(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.user',
    [
      'communityshare.services.user',
      'communityshare.services.map',
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
        },
        function(response) {
          $scope.message = 'Could not find user with id=' + userId;
        });
      $scope.communityPartnerViewMethods = {};
    });

  module.controller(
    'CommunityPartnerViewController',
    function($scope, CommunityPartnerUtils, Search, Messages) {
      $scope.methods.onUserUpdate = function(user) {
        var searchesPromise = user.getSearches();
        var searchPromise = CommunityPartnerUtils.searchesPromiseToSearchPromise(
          searchesPromise);
        searchPromise.then(
          function(search) {
            $scope.search.makeLabelDisplay()
          },
          function(message) {
            Messages.error(message);
          });
      };
      if ($scope.user) {
        $scope.methods.onUserUpdate($scope.user);
      }
    });

  // User Signups

  module.controller(
    'SignupCommunityPartnerController',
    function($scope, Session, Messages, User, signUp, $location, $q) {
      // This controller relies on a CommunityPartnerSettings directive.
      $scope.Session = Session;
      $scope.newUser = new User();
      $scope.communityPartnerSettingsMethods = {}
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
                function() {
                  $location.path('/home');
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
    function($scope, Session, Messages) {
      $scope.Session = Session;
      $scope.user = Session.activeUser;
      // Methods of 'setUser' and 'saveSettings' will be created by
      // the directive.
      $scope.communityPartnerSettingsMethods = {};
      if (Session.activeUser) {
        $scope.editedUser = Session.activeUser.clone();
      }
      $scope.saveSettings = function() {
        var saveUserPromise = $scope.editedUser.save();
        saveUserPromise.then(
          function(user) {
            Session.activeUser.updateFromData(user.toData());
          },
          function(message) {
            var msg = 'Failed to save user: ' + message;
            Messages.error(msg);
          });
        var methods = $scope.communityPartnerSettingsMethods;
        if (methods.saveSettings) {
          methods.saveSettings();
        }
      };
    });

  module.controller(
    'CommunityPartnerSettingsController',
    function($scope, Search, Map, Messages, CommunityPartnerUtils) {
      $scope.properties = {};
      var makeNewSearch = function() {
        var search = new Search({
          searcher_user_id: undefined,
          searcher_role: 'partner',
          searching_for_role: 'educator',
          active: true,
          labels: [],
          latitude: undefined,
          longitude: undefined,
          distance: undefined
        });
        return search;
      };
      $scope.search = undefined;
      if ($scope.user) {
        // User exists.  Load the search.
        var searchesPromise = $scope.user.getSearches();
        var searchPromise = CommunityPartnerUtils.searchesPromiseToSearchPromise(
          searchesPromise);
        searchPromise.then(
          function(search) {
            if (search) {
              $scope.search = search;
              $scope.properties.search = search;
              search.makeLabelDisplay();
            } else {
              // Apparently the user didn't have a search.
              $scope.search = makeNewSearch();
              $scope.properties.search = $scope.search;
              $scope.search.makeLabelDisplay();
            }
          },
          function(message) {
            Messages.error(message);
          });
      } else {
        // User does not exist.  Create a new search.
        $scope.search = makeNewSearch();
        $scope.properties.search = $scope.search;
        $scope.search.makeLabelDisplay();
      }
      $scope.methods.setUser = function(user) {
        $scope.search.searcher_user_id = user.id
      }
      $scope.methods.saveSettings = function() {
        $scope.search.processLabelDisplay();
        var searchPromise = $scope.search.save();
        return searchPromise;
      };
      $scope.activeLabels = {};
      $scope.getLabels = function() {
        var labels = [];
        for (var label in $scope.activeLabels) {
          if ($scope.activeLabels[label]) {
            labels.push(label);
          }
        }
        return labels;
      };
      var map = new Map('map-canvas');
      $scope.codeAddress = function() {
        var address = $scope.search.location;
        var promiseLatLng = map.codeAddress(address);
        promiseLatLng.then(
          function(latlng) {
            $scope.search.latitude = latlng.k;
            $scope.search.longitude = latlng.A;
          },
          function(message) {
            Messages.error(message);
          });
      };
      
    });
    
})();
