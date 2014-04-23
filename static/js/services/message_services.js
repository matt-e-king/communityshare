(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.message',
    [
    ])

  module.factory(
    'Messages',
    function() {
      var Messages = {};
      Messages.info = function(text) {
        alert(text);
      };
      Messages.error = function(text) {
        alert(text);
      };
      return Messages;
    });

})();
