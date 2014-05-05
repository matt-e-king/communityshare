(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.share',
    [
      'communityshare.services.share',
      'communityshare.services.conversation'
    ]);


  module.controller(
    'NewShareController',
    function(Session, $scope, $routeParams, Conversation, Share) {
      var conversationId = $routeParams.conversationId;
      if (conversationId !== undefined) {
        var conversationPromise = Conversation.get(conversationId);
        conversationPromise.then(
          function(conversation) {
            var newShare = new Share({
              conversation_id: conversation.id,
              userA_id: Session.activeUser.id,
              userB_id: conversation.otherUser.id,
              title: undefined,
              description: undefined
            });
          },
          function(message) {
            var msg = '';
            if (message) {
              msg = ': ' + message;
            }
            $scope.errorMessage = 'Failed to load conversation' + msg;
          });
      } else {
        $scope.errorMessage = 'Missing conversation ID';
      };
    });
  
})();
