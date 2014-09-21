(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.search',
    [
      'communityshare.controllers.conversation'
    ]);

  module.controller(
    'MatchesController',
    function($scope, Session, Search, $location, labelMapping, makeDialog,
             startConversation, Messages, $modal) {
      $scope.Session = Session;
      $scope.labelMapping = labelMapping;
      $scope.labelClasses = {
        gradeLevels: 'grade-level-button',
        engagementLevels: 'engagement-button',
        subjectAreas: 'subject-area-button',
        undefined: 'subject-area-button'
      };
      var user = Session.activeUser;
      $scope.infoMessage = 'Loading searches...';
      $scope.errorMessage = '';
      $scope.title = '';
      $scope.goToConversation = function(conversation) {
        $location.path('/conversation/' + conversation.id);
      };

      $scope.showThankYou = function() {
        $modal.open({
          templateUrl: './static/templates/educator_thankyou.html',
          controller: 'ModalController'
        });
      };

      var showModal = $location.search()['first'];
      if (showModal) {
        $scope.showThankYou();
      }

      if (user) {
        var searchesPromise = Search.get_many({'searcher_user_id': user.id}, true);
        searchesPromise.then(
          function(searches) {
            $scope.infoMessage = '';
            $scope.errorMessage = '';
            $scope.searches = searches;
            var compareSearchDate = function(search1, search2) {
              var output = -1;
              if (search1.created === search2.created) {
                output = 0;
              } else if (search1.created < search2.created) {
                output = 1;
              }
              return output;
            };
            $scope.searches.sort(compareSearchDate);
            var gotSomeMatches = false;
            for (var i=0; i<$scope.searches.length; i++) {
              var search = $scope.searches[i];
              if ((!gotSomeMatches) && (search.labels.length > 0)) {
                $scope.getMatches(search);
                gotSomeMatches = true;
              }
            }
          },
          function() {
            console.log('failed to get searches');
          });
      }
      $scope.getMatches = function(search) {
        var matchesPromise = Search.getResults(search.id);
        search.show = true;
        search.infoMessage = 'Loading matches...';
        search.errorMessage = '';
        matchesPromise.then(
          function(matches) {
            search.matches = matches;
            search.infoMessage = '';
            search.errorMessage = '';
          },
          function(errorMessage) {
            search.infoMessage = '';
            search.errorMessage = errorMessage;
          });
      };
      $scope.startConversation = startConversation;
      $scope.editProfile = function() {
        $location.path('settings');
      };
      $scope.deleteSearch = function(search) {
        var title = 'Delete Search';
        var msg = 'Do you really want to delete this search?  Others will no longer be able to find you by matching to the contents of this search.';
        var btns = [{result:'yes', label: 'Yes'},
                    {result:'no', label: 'No', cssClass: 'btn-primary'}];
        var d = makeDialog(title, msg, btns);
        d.result.then(
          function(result) {
            if (result === 'yes') {
              var deletePromise = search.destroy();
              deletePromise.then(
                function() {
                },
                function(message) {
                    Messages.error(message);
                });
            }
          });
      };
    });

  module.controller(
    'SearchResultsController',
    function(Session, $scope, $location, $routeParams, $modal, Search, Messages, labelMapping) {
      $scope.Session = Session;
      var searchId = $routeParams.searchId;
      $scope.infoMessage = 'Searching for matches...';
      $scope.errorMessage = '';
      $scope.title = '';
      $scope.goToConversation = function(conversation) {
        $location.path('/conversation/' + conversation.id);
      };

      $scope.labelClasses = {
        gradeLevels: 'light-yellow-button',
        engagementLevels: 'light-blue-button',
        subjectAreas: 'light-green-button',
        undefined: 'light-green-button'
      };
      $scope.labelMapping = labelMapping;

      if (searchId !== undefined) {
        var searchesPromise = Search.getResults(searchId);
        searchesPromise.then(
          function(searches) {
            $scope.searches = searches;
            if (searches.length === 0) {
              $scope.infoMessage = 'No matches found.';
            } else {
              $scope.infoMessage = '';
              if (searches[0].searcher_role === 'educator') {
                $scope.title = 'Best Educator Matches';
              } else {
                $scope.title = 'Best Community Partner Matches';
              }
            }
            $scope.errorMessage = '';
          },
          function(message) {
            var msg = '';
            if (message) {
              msg = ': ' + message;
            }
            $scope.errorMessage = 'Failed to find matches' + msg;
          });
      }
    });      

  module.controller(
    'SearchEditController',
    function(Session, $location, $scope, $routeParams, Search, Messages) {
      $scope.Session = Session;
      var searchId = $routeParams.searchId;
      if (searchId !== undefined) {
        var searchPromise = Search.get(searchId);
        searchPromise.then(
          function(search) {
            $scope.search = search;
          },
          function(message) {
            Messages.error(message);
          });
      } else {
        var searcher_role;
        var searching_for_role;
        if (Session.activeUser.is_educator) {
          searcher_role = 'educator';
          searching_for_role = 'partner';
        } else {
          searcher_role = 'partner';
          searching_for_role = 'educator';
        }
        $scope.search = new Search({
          searcher_user_id: Session.activeUser.id,
          searcher_role: searcher_role,
          searching_for_role: searching_for_role,
          zipcode: Session.activeUser.zipcode,
          labels: []
        });
      }

      $scope.saveSettings = function() {
        var promise = $scope.search.save();
        promise.then(
          function() {
            $location.path('/matches');
          },
          function(message) {
            Messages.error(message);
          });
      };
      
      $scope.searchText = {value: ''};
      $scope.userSearch = function() {
        if ($scope.searchText.value) {
          $location.path('/searchusers/' + $scope.searchText.value);
        }
      };
    });

})();
