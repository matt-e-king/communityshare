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
    'SessionBase',
    function() {
      var SessionBase = {};
      SessionBase.activeUser = undefined;
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
                SessionBase.activeUser = user;
                Authenticator.getUnviewedConversations();
              },
              function(message) {
                deferred.reject(message);
              }
            );
          } else {
            deferred.reject('No cookie found');
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
          userPromise.then(
            function(user) {
              SessionBase.activeUser = user;
              Authenticator.getUnviewedConversations();
            },
            function(response) {
            }
          );
          return userPromise;
        };

      Authenticator.requestResetPassword = function(email) {
        var url = 'api/requestresetpassword/'+email;
        var promise = $http({
          url: url,
          method: 'GET'
        });
        return promise;
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
