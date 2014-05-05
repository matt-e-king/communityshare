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
    function(SessionBase, ItemFactory, User, Message) {
      var Conversation = ItemFactory('conversation');
      Conversation.prototype.updateFromData = function(data) {
        for (var key in data) {
          this[key] = data[key];
        }
        this.userA = new User(this.userA);
        this.userB = new User(this.userB);
        if (SessionBase.activeUser.id === this.userA.id) {
          this.otherUser = this.userB;
        } else if (SessionBase.activeUser.id === this.userB.id) {
          this.otherUser = this.userA;
        }
        if (this.messages) {
          for (var i=0; i<this.messages.length; i++) {
            var messageData = this.messages[i];
            this.messages[i] = new Message(messageData);
            if (messageData.sender_user_id === this.userA.id) {
              this.messages[i].sender_user = this.userA;
            } else if (messageData.sender_user_id === this.userB.id) {
              this.messages[i].sender_user = this.userB;
            }
          }
        }
      };
      Conversation.prototype.getUnviewedMessages = function() {
        var unviewedMessages = [];
        for (var i=0; i<this.messages.length; i++) {
          var message = this.messages[i];
          if ((message.sender_user.id === this.otherUser.id) &&
              !(message.viewed)) {
            unviewedMessages.push(message);
          }
        }
        return unviewedMessages;
      };
      Conversation.prototype.markMessagesAsViewed = function() {
        var messages = this.getUnviewedMessages();
        for (var i=0; i<messages.length; i++) {
          var message = messages[i];
          message.viewed = true;
          message.save();
        }
      };
      Conversation.getUnviewedForUser = function(user_id) {
        var data = {
          user_id_with_unviewed_messages: user_id
        }
        var conversationsPromise = Conversation.get_many(data=data);
        return conversationsPromise;
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
