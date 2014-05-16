(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.conversation',
    [
      'communityshare.services.item',
      'communityshare.services.user',
      'communityshare.services.share'
    ])

  module.factory(
    'Conversation',
    function(SessionBase, ItemFactory, UserBase, Message, Messages, Share, Evnt) {
      var Conversation = ItemFactory('conversation');
      Conversation.prototype.updateFromData = function(data) {
        for (var key in data) {
          this[key] = data[key];
        }
        if (this.userA) {
          this.userA = UserBase.make(this.userA);
        }
        if (this.userB) {
          this.userB = UserBase.make(this.userB);
        }
        if (SessionBase.activeUser.id === this.userA_id) {
          this.otherUser = this.userB;
        } else if (SessionBase.activeUser.id === this.userB_id) {
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
      Conversation.prototype.makeShare = function() {
        var educator_user_id = undefined;
        var community_partner_user_id = undefined;
        if (SessionBase.activeUser.is_educator) {
          educator_user_id = SessionBase.activeUser.id;
        } else if (SessionBase.activeUser.is_community_partner) {
          community_partner_user_id = SessionBase.activeUser.id;
        }
        if (this.otherUser.is_educator) {
          educator_user_id = this.otherUser.id;
        } else if (this.otherUser.is_community_partner) {
          community_partner_user_id = this.otherUser.id;
        }
        var share;
        if ((educator_user_id === undefined) || (community_partner_user_id === undefined)) {
          share = undefined;
          Messages.showError('A share required both an educator and a community partner.');
        } else {
          share = new Share({
            conversation_id: this.id,
            educator_user_id: educator_user_id,
            community_partner_user_id: community_partner_user_id,
            title: undefined,
            description: undefined
          });
          share.addNewEvent();
        }
        return share;
      };

      Conversation.getUnviewedForUser = function(user_id) {
        var data = {
          user_id: user_id,
          with_unviewed_messages: true
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
