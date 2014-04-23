(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.user',
    [
      'communityshare.services.item',
      'communityshare.services.message'
    ])

  var isEmail = function(email) {
    // from http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  };

  module.factory(
    'signUp',
    function($q, $http, User, Authenticator, Session) {
      var signUp = function(name, email, password) {
        var deferred = $q.defer();
        var dataPromise = $http({
          method: 'POST',
          url: '/api/usersignup',
          data: {
            'name': name,
            'email': email,
            'password': password
          }});
        dataPromise.then(
          function(response) {
            var user = new User(response.data.data);
            Authenticator.setApiKey(response.data.apiKey);
            Session.activeUser = user;
            deferred.resolve(user);
          },
          function(response) {
            deferred.reject(response.data.message);
          }
        );
        return deferred.promise;
      };
      return signUp;
    });

  module.factory(
    'User',
    function(ItemFactory, $q, $http, Search) {
      var User = ItemFactory('user');

      User.getByEmail = function(email) {
        var deferred = $q.defer();
        var dataPromise = $http({
          method: 'GET',
          url: '/api/userbyemail/' + email
        });
        dataPromise.then(
          function(data) {
            var user = new User(data.data.data);
            deferred.resolve(user);
          },
          function(response) {
            deferred.reject(response.message);
          }
        );
        return deferred.promise;
      };
      
      User.prototype.getSearches = function() {
        var searchParams = {
          'searcher_user_id': this.id,
          'active': true
        };
        var searchesPromise = Search.get_many(searchParams);
        return searchesPromise;
      }

      return User;
    });

  module.factory(
    'CommunityPartnerUtils',
    function(Messages, $q) {
      var CommunityPartnerUtils = {};
      CommunityPartnerUtils.searchesPromiseToSearchPromise = function(searchesPromise) {
        var deferred = $q.defer();
        searchesPromise.then(
          function(searches) {
            var search;
            if (searches.length > 1) {
              Messages.error('More than one search for a community partner.');
              search = searches[0];
            } else if (searches.length === 0) {
              Messages.error('No searches for a community partner');
              search = undefined;
            } else {
              search = searches[0];
            }
            deferred.resolve(search);
          },
          function(message) {
            deferred.reject(message)
          });
        return deferred.promise;
      };
      return CommunityPartnerUtils;
    });
  

})();
