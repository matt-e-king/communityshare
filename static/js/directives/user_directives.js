(function() {
  'use strict';
  
  var module = angular.module('communityshare.directives.user', [
      'communityshare.services.survey',
      'communityshare.directives.survey'
  ]);
  
  module.directive(
    'csCommunityPartnerView',
    function() {
      return {
        scope: {
          methods: '=',
          user: '='},
        templateUrl: './static/templates/community_partner_view.html',
        controller: function(Session, $scope, CommunityPartnerUtils, Search, Messages) {
          $scope.methods.onUserUpdate = function(user) {
            if (user.is_community_partner) {
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
            }
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
          search: '=',
          form: '='
        },
        templateUrl: './static/templates/educator_search_settings.html',
        controller: function($scope, Search, Messages) {
          $scope.properties = {};
          var haveSetForm = false;
          $scope.$watch('educatorSearchSettingsForm', function() {
            if (!haveSetForm) {
              $scope.form = $scope.educatorSearchSettingsForm;
            }
          });
          $scope.methods.setSearch = function(search) {
            $scope.properties.search = search;
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
          user: '=',
          form: '=',
          includeDetails: '@'
        },
        templateUrl: './static/templates/community_partner_settings.html',
        controller: function($scope, Search, Messages, CommunityPartnerUtils, Question) {

          var questionsPromise = Question.get_many({
            question_type: 'signup_community_partner'
          });
          questionsPromise.then(
            function(questions) {
              $scope.questions = questions;
            });

          $scope.properties = {};
          var haveSetForm = false;
          $scope.$watch('partnerSettingsForm', function() {
            if (!haveSetForm) {
              $scope.form = $scope.partnerSettingsForm;
            }
          });
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
        }
      };
    });
      
})();
