(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.controllers.conversation',
    [
      'communityshare.services.conversation'
    ]);
  
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
