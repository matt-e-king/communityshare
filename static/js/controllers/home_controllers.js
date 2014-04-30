(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.home',
    [
      'communityshare.directives.home',
      'communityshare.services.search',
      'communityshare.services.modal'
    ]);
  
  module.controller(
    'HomeController',
    function($scope, Session) {
      $scope.Session = Session;
    });

  module.controller(
    'EducatorHomeController',
    function($scope, Session, Search, makeDialog, Messages) {
      if ((Session.activeUser) && (Session.activeUser.is_educator)) {
        var searchParams = {
          'searcher_user_id': Session.activeUser.id,
          'active': true,
          'searcher_role': 'educator'
        };
        $scope.deleteSearch = function(search) {
          var title = 'Delete Search';
          var msg = 'Do you really want to delete this search';
          var btns = [{result:'yes', label: 'Yes', cssClass: 'btn-primary'},
                       {result:'no', label: 'No'}];
          var d = makeDialog(title, msg, btns);
          console.log(d);
          d.result.then(
            function(result) {
              if (result === 'yes') {
                var deletePromise = search.destroy();
                deletePromise.then(
                  function() {
                    var index = $scope.activeSearches.indexOf(search);
                    if (index >= 0) {
                      $scope.activeSearches.splice(index, 1);
                    }
                  },
                  function(message) {
                    Messages.error(message);
                  });
              }
            })
        };
        var searchesPromise = Search.get_many(searchParams);
        searchesPromise.then(
          function(searches) {
            $scope.activeSearches = searches;
          },
          function() {
          });
      }
      
    });

  module.controller(
    'CommunityPartnerHomeController',
    function($scope, Session, Search, Messages, CommunityPartnerUtils) {
      $scope.properties = {};
      if (Session.activeUser && Session.activeUser.is_community_partner) {
        var searchesPromise = Session.activeUser.getSearches();
        var searchPromise = CommunityPartnerUtils.searchesPromiseToSearchPromise(
          searchesPromise);
        searchPromise.then(
          function(search) {
            $scope.search = search;
            if (search) {
              search.makeLabelDisplay();
            }
          }, 
          function(message) {
            Messages.error(message);
          });
      }
    });

  module.controller(
    'AdministratorHomeController',
    function($scope, $location) {
      $scope.searchText = '';
      $scope.searchForUsers = function() {
        var searchParams = {
          'searchText': $scope.searchText
        };
        $location.path('/searchusers').search(searchParams);
      };
    });

    module.controller(
    'SearchesDisplayController',
    function() {
    });

  module.controller(
    'SearchUsersController',
    function($scope, $location, $q, User, Session) {
      $scope.Session = Session;
      $scope.infoMessage = 'Searching for matching users...';
      $scope.users = undefined;
      $scope.searchText = $location.search().searchText;
      var searchForUsers = function() {
        var searchNameParams = {
          'name.ilike': '%' + $scope.searchText + '%'
        };
        var searchEmailParams = {
          'email.ilike': '%' + $scope.searchText + '%'
        };
        var byNamePromise = User.get_many(searchNameParams);
        var byEmailPromise = User.get_many(searchEmailParams);
        var combinedPromise = $q.all({byName: byNamePromise,
                                      byEmail: byEmailPromise});

        combinedPromise.then(
          function(results) {
            var users = results.byName.concat(results.byEmail);
            $scope.users = users;
            $scope.infoMessage = '';
            $scope.errorMessage = '';
          },
          function(message) {
            var msg = '';
            if (message) {
              msg = ': ' + message;
            }
            $scope.errorMessage = 'Failed to load users' + msg;
            $scope.infoMessage = '';
          });
      }
      searchForUsers();
      $scope.newSearch = function() {
        var searchParams = {
          'searchText': $scope.searchText
        };
        $location.search(searchParams);
      };
    });

})();
