(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.survey',
    []);

  module.factory(
    'Question',
    function(ItemFactory) {
      var Question = ItemFactory('question');
      return Question;
    });

})();
