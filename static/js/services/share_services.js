(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.share',
    [
      'communityshare.services.item'
    ])

  module.factory(
    'Share',
    function(ItemFactory, EvntBase, SessionBase) {
      var Share = ItemFactory('share');
      Share.prototype.initialize = function() {
        if (this.events) {
          for (var i=0; i<this.events.length; i++) {
            this.events[i] = new EvntBase(this.events[i]);
          }
        }
        if (this.educator && this.community_partner) {
          if (SessionBase.activeUser.id === this.educator.id) {
            this.otherUser = this.educator;
          } else if (SessionBase.activeUser.id === this.community_partner.id) {
            this.otherUser = this.community_partner;
          }
        }
      };
      return Share;
    });

  module.factory(
    'EvntBase',
    function(ItemFactory) {
      var Evnt = ItemFactory('event');
      return Evnt;
    });
  
  module.factory(
    'Evnt',
    function(ItemFactory, EvntBase, Share) {
      EvntBase.prototype.initialize = function() {
        this.datetime_start = new Date(this.datetime_start);
        this.datetime_stop = new Date(this.datetime_stop);
        if (this.share) {
          this.share = new Share(this.share);
        }
      };
      return EvntBase;
    });
  
})();
