(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.controllers.conversation',
    [
      'communityshare.services.conversation'
    ]);

  module.controller(
    'ConversationController',
    function($scope, $routeParams, Session, Conversation, Message, User) {
      var conversationId = $routeParams.conversationId;
      var conversationPromise = Conversation.get(conversationId);
      $scope.other_user = undefined;
      $scope.conversation = undefined;
      $scope.newMessage = undefined;
      var makeNewMessage = function() {
        var newMessage = new Message({
          conversation_id: conversationId,
          sender_user_id: Session.activeUser.id,
          content: ''
        });
        return newMessage;
      };
      conversationPromise.then(
        function(conversation) {
          if (conversation.userA.id === Session.activeUser.id) {
            $scope.other_user = conversation.userB;
          } else {
            $scope.other_user = conversation.userA;
          }
          $scope.conversation = conversation;
          $scope.newMessage = makeNewMessage();
        },
        function(message) {
            var msg = '';
            if (message) {
              msg = ': ' + message;
            }
            $scope.errorMessage = 'Failed to load conversation' + msg;
        });
      $scope.sendMessage = function() {
        var messagePromise = $scope.newMessage.save();
        messagePromise.then(
          function(message) {
            message.sender_user = Session.activeUser;
            $scope.conversation.messages.push(message);
            $scope.newMessage = makeNewMessage();
          },
          function(message) {
            var msg = '';
            if (message) {
              msg = ': ' + message;
            }
            $scope.errorMessage = 'Failed to send message' + msg;
          });
      }
    });
  
  module.controller(
    'NewConversationController',
    function (Session, $scope, $modalInstance, userId, searchId, User,
              Conversation, Message) {
      var userPromise = User.get(userId);
      $scope.errorMessage = '';
      $scope.conversation = new Conversation({
        title: undefined,
        search_id: searchId,
        userA_id: Session.activeUser.id,
        userB_id: userId
      });
      $scope.message = new Message({
        conversation_id: undefined,
        sender_user_id: Session.activeUser.id,
        content: undefined
      });
      userPromise.then(
        function(user) {
          $scope.user = user;
        });
      $scope.cancel = function() {
        $modalInstance.close();
      };
      $scope.startConversation = function() {
        var conversationPromise = $scope.conversation.save();
        conversationPromise.then(
          function(conversation) {
            $scope.errorMessage = '';
            $scope.message.conversation_id = conversation.id;
            var messagePromise = $scope.message.save();
            messagePromise.then(
              function(message) {
                $modalInstance.close(conversation);
              },
              function(message) {
                var msg = '';
                if (message) {
                  msg = ': ' + message;
                }
                $scope.errorMessage = 'Failed to save message' + msg;
              });
          },
          function(message) {
            var msg = '';
            if (message) {
              msg = ': ' + message;
            }
            $scope.errorMessage = 'Failed to save conversation' + msg;
          });
      };
    });

}());
