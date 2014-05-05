(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.share',
    [
      'communityshare.services.item'
    ])

  module.factory(
    'Share',
    function(ItemFactory, $q, $http, makeBaseLabels, sortLabels) {
      var Share = ItemFactory('share');
      Share.prototype.initialize = function() {
      };
      return Share;
    });

})();
