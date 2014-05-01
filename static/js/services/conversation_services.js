(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.conversation',
    [
      'communityshare.services.item',
    ])

  module.factory(
    'Conversation',
    function(ItemFactory) {
      var Conversation = ItemFactory('conversation');
      return Conversation;
    });

  module.factory(
    'Message',
    function(ItemFactory) {
      var message = ItemFactory('message');
      return message;
    });

})();
