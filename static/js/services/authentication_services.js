(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.authentication',
    [
      'ngResource',
      'communityshare.services.user',
      'communityshare.services.conversation'
    ])

  module.factory(
    'activeUserLoader',
    function(SessionBase) {
      return SessionBase.getActiveUserPromise;
    });

  module.factory(
    'SessionBase',
    function($q) {
      var SessionBase = {};
      var deferred;
      SessionBase.clearUser = function() {
        deferred = $q.defer();
        SessionBase.activeUser = undefined;
      };
      SessionBase.setUser = function(user) {
        deferred.resolve(user);
        SessionBase.activeUser = user;
      };
      SessionBase.getActiveUserPromise = function() {
        return deferred.promise;
      }
      SessionBase.clearUser();
      return SessionBase;
    });

  module.factory(
    'Session',
    function(SessionBase, Authenticator) {
      Authenticator.authenticateFromCookie();
      return SessionBase;
    });

  module.factory(
    'Authenticator',
    function($q, $http, User, SessionBase, $cookies, $cookieStore, Conversation, Messages) {
      var Authenticator = {};
      Authenticator.clean = function() {
        $http.defaults.headers.common['Authorization'] = '';
        $cookieStore.remove('apiKey');
        SessionBase.clearUser();
        SessionBase.setUser(undefined);
      };
      Authenticator.setApiKey = function(key) {
        $http.defaults.headers.common['Authorization'] = 
          'Basic:api:' + key;
        $cookies.apiKey = key;
      };
      Authenticator.setEmail = function(email) {
        $cookies.email = email;
      };

      Authenticator.getUnviewedConversations = 
        function() {
          if (SessionBase.activeUser) {
            var conversationsPromise = Conversation.getUnviewedForUser(
              SessionBase.activeUser.id);
            conversationsPromise.then(
                function(conversations) {
                  // Check again since we might have logged out since.
                  if (SessionBase.activeUser) {
                    var nUnviewedMessages = 0;
                    for (var i=0; i<conversations.length; i++) {
                      var conversation = conversations[i];
                      var messages = conversation.getUnviewedMessages();
                      nUnviewedMessages += messages.length;
                    }
                    SessionBase.activeUser.nUnviewedMessages = nUnviewedMessages;
                  }
                },
              function(message) {
                var msg = '';
                if (message) {
                  msg = ': ' + message;
                }
                Messages.showError('Failed to get messages: ' + msg);
              });
          }
        };

      Authenticator.authenticateFromCookie =
        function() {
          var deferred = $q.defer();
          var apiKey = $cookies.apiKey;
          var email = $cookies.email;
          if ((apiKey) && (email)){
            Authenticator.setApiKey(apiKey)
            var userPromise = User.getByEmail(email);
            userPromise.then(
              function(user) {
                SessionBase.setUser(user);
                Authenticator.getUnviewedConversations();
              },
              function(message) {
                SessionBase.setUser(undefined);
                deferred.reject(message);
              }
            );
          } else {
            var message = 'No cookie found';
            SessionBase.setUser(undefined);
            deferred.reject(message);
          }
        };

      Authenticator.authenticateWithEmailAndPassword =
        function(email, password) {
          $http.defaults.headers.common['Authorization'] = 
            'Basic:' + email + ':' + password; 
          var url = 'api/requestapikey'
          var promiseApiKey = $http({
            url: url,
            method: 'GET'
          });
          promiseApiKey.then(
            function(response) {
              var apiKey = response.data.apiKey;
              Authenticator.setApiKey(apiKey);
              $cookies.email = email;
            },
            function(response) {
            });
          var userPromise = User.getByEmail(email);
          SessionBase.clearUser();
          userPromise.then(
            function(user) {
              SessionBase.setUser(user);
              Authenticator.getUnviewedConversations();
            },
            function(response) {
              SessionBase.setUser(undefined);
            }
          );
          return userPromise;
        };

      Authenticator.requestResetPassword = function(email) {
        var url = 'api/requestresetpassword/'+email;
        var deferred = $q.defer();
        var promise = $http({
          url: url,
          method: 'GET'
        });
        promise.then(
          function(response) {
            deferred.resolve(response.data);
          },
          function(response) {
            if (response.data && response.data.message) {
              deferred.reject(response.data.message);
            }
          });
        return deferred.promise;
      };

      Authenticator.resetPassword = function(key, password) {
        var url = 'api/resetpassword';
        var promise = $http({
          url: url,
          method: 'POST',
          data: {
            key: key,
            password: password
          }
        });
        return promise;
      };
      return Authenticator;
    }
  );

})();
