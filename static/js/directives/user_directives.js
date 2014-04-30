(function() {
  'use strict';
  
  var module = angular.module('communityshare.directives.user', [
  ]);
  
  module.directive(
    'csCommunityPartnerView',
    function() {
      return {
        scope: {
          methods: '=',
          user: '='},
        templateUrl: './static/templates/community_partner_home.html',
        controller: function(Session, $scope, CommunityPartnerUtils, Search, Messages) {
          $scope.methods.onUserUpdate = function(user) {
            var searchesPromise = user.getSearches();
            var searchPromise = CommunityPartnerUtils.searchesPromiseToSearchPromise(
              searchesPromise);
            searchPromise.then(
              function(search) {
                search.makeLabelDisplay()
                $scope.search = search;
              },
              function(message) {
                Messages.error(message);
              });
          };
          if ($scope.user) {
            $scope.methods.onUserUpdate($scope.user);
          }
        }
      };
    });

  module.directive(
    'csEducatorView',
    function() {
      return {
        scope: {
          methods: '=',
          user: '='},
        templateUrl: './static/templates/educator_view.html',
        controller: function(Session, $scope, Search, Messages) {
          $scope.methods.onUserUpdate = function(user) {
            var searchesPromise = user.getSearches();
            searchesPromise.then(
              function(searches) {
                var searchesAsEducator = [];
                for (var i=0; i<searches.length; i++) {
                  var search = searches[i];
                  if (search.searcher_role === 'educator') {
                    searchesAsEducator.push(search);
                  }
                }
                $scope.searches = searchesAsEducator;
              },
              function(message) {
                Messages.error(message);
              });
          };
          if ($scope.user) {
            $scope.methods.onUserUpdate($scope.user);
          }
        }
      };
    });

  
  module.directive(
    'csEducatorSearchSettings',
    function() {
      return {
        scope: {
          methods: '=',
          search: '='
        },
        templateUrl: './static/templates/educator_search_settings.html',
        controller: function($scope, Search, Map, Messages) {
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
          $scope.properties = {};
          $scope.methods.setSearch = function(search) {
            $scope.properties.search = search;
            if ((search.location !== undefined) && (search.longitude !== undefined)) {
              search.location = search.latitude + ', ' + search.longitude;
              $scope.codeAddress();
            }
            search.makeLabelDisplay();
          };
          if ($scope.search) {
            $scope.methods.setSearch($scope.search);
          }
          $scope.methods.saveSettings = function() {
            $scope.properties.search.processLabelDisplay();
            var searchPromise = $scope.properties.search.save();
            return searchPromise;
          };
        }
      };
    });
   
  
  module.directive(
    'csCommunityPartnerSettings',
    function() {
      return {
        scope: {
          methods: '=',
          user: '='
        },
        templateUrl: './static/templates/community_partner_settings.html',
        controller: function($scope, Search, Map, Messages, CommunityPartnerUtils) {
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
          if (($scope.user) && ($scope.user.is_community_partner)) {
            // User exists.  Load the search.
            var searchesPromise = $scope.user.getSearches();
            var searchPromise = CommunityPartnerUtils.searchesPromiseToSearchPromise(
              searchesPromise);
            searchPromise.then(
              function(search) {
                if (search) {
                  $scope.search = search;
                  $scope.properties.search = search;
                  $scope.search.location = $scope.search.latitude + ', ' + $scope.search.longitude;
                  $scope.codeAddress();
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
        }
      };
    });
      
})();
