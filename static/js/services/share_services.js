(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.share',
    [
      'communityshare.services.item'
    ])

  module.factory(
    'Share',
    function(ItemFactory, $q, $http, makeBaseLabels, sortLabels, Evnt) {
      var Share = ItemFactory('share');
      Share.prototype.initialize = function() {
        if (this.events) {
          for (var i=0; i<this.events.length; i++) {
            this.events[i] = new Evnt(this.events[i]);
          }
        }
      };
      return Share;
    });
  
  module.factory(
    'Evnt',
    function(ItemFactory, $q, $http, makeBaseLabels, sortLabels) {
      var Evnt = ItemFactory('event');
      Evnt.prototype.initialize = function() {
        this.datetime_start = new Date(this.datetime_start);
        this.datetime_stop = new Date(this.datetime_stop);
      };
      return Evnt;
    });

})();
