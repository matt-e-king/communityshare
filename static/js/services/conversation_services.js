(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.conversation',
    [
      'communityshare.services.item',
      'communityshare.services.user',
    ])

  module.factory(
    'Conversation',
    function(ItemFactory, User, Message) {
      var Conversation = ItemFactory('conversation');
      Conversation.prototype.updateFromData = function(data) {
        for (var key in data) {
          this[key] = data[key];
        }
        this.userA = new User(this.userA);
        this.userB = new User(this.userB);
        for (var i=0; i<this.messages.length; i++) {
          var messageData = this.messages[i];
          this.messages[i] = new Message(messageData);
          if (messageData.sender_user_id === this.userA.id) {
            this.messages[i].sender_user = this.userA;
          } else if (messageData.sender_user_id === this.userB.id) {
            this.messages[i].sender_user = this.userB;
          }
        }
      };
      return Conversation;
    });

  module.factory(
    'Message',
    function(ItemFactory) {
      var message = ItemFactory('message');
      return message;
    });

})();
