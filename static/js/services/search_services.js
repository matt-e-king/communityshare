(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.search',
    [
      'communityshare.services.item'
    ])

  module.factory(
    'Search',
    function(ItemFactory, $q, $http) {
      var Search = ItemFactory('search');
      return Search;
    });

})();
