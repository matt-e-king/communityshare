(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.share',
    [
      'communityshare.services.share',
      'communityshare.services.conversation'
    ]);


  var combineDates = function(dateDate, timeDate) {
    var year = dateDate.getFullYear();
    var month = dateDate.getMonth();
    var day = dateDate.getDate();
    var hours = timeDate.getHours();
    var minutes = timeDate.getMinutes();
    var newDate = new Date(year, month, day, hours, minutes);
    return newDate;
  };

  module.controller(
    'ShareController',
    function(Session, $scope, $routeParams, Share) {
      $scope.Session = Session;
      var shareId = $routeParams.shareId;
      var errorMessage = '';
      if (shareId !== undefined) {
        var sharePromise = Share.get(shareId);
        sharePromise.then(
          function(share) {
            $scope.share = share;
          },
          function(message) {
            var msg = 'Failed to load share';
            if (message) {
              msg += ': ' + message;
            }
            $scope.errorMessage = msg;
          });
      }
    });
      

  module.controller(
    'NewShareController',
    function(Session, $scope, $location, $routeParams, Conversation, Share, Evnt) {
      $scope.share = undefined;
      $scope.save = function() {
        if ($scope.share) {
          var sharePromise = $scope.share.save();
          sharePromise.then(
            function(share) {
              for (var i=0; i<$scope.events.length; i++) {
                var evnt = $scope.events[i];
                evnt.datetime_start = combineDates(evnt.date, evnt.time_start);
                evnt.datetime_stop = combineDates(evnt.date, evnt.time_stop);
                evnt.share_id = share.id;
                var eventPromise = evnt.save();
                eventPromise.then(
                  function(evnt) {
                    $location.$$search = {};
                    $location.path('/share/' + share.id);
                  });
              }
            },
            function(message) {
            }
          );
        };
      };
      var conversationId = $routeParams.conversationId;
      if (conversationId !== undefined) {
        var conversationPromise = Conversation.get(conversationId);
        conversationPromise.then(
          function(conversation) {
            var educator_user_id = undefined;
            var community_partner_user_id = undefined;
            if (Session.activeUser.is_educator) {
              educator_user_id = Session.activeUser.id;
            } else if (Session.activeUser.is_community_partner) {
              community_partner_user_id = Session.activeUser.id;
            }
            if (conversation.otherUser.is_educator) {
              educator_user_id = conversation.otherUser.id;
            } else if (conversation.otherUser.is_community_partner) {
              community_partner_user_id = conversation.otherUser.id;
            }
            if ((educator_user_id === undefined) || (community_partner_user_id === undefined)) {
              $scope.errorMessage = 'A share required both an educator and a community partner.';
            } else {
              $scope.share = new Share({
                conversation_id: conversation.id,
                educator_user_id: educator_user_id,
                community_partner_user_id: community_partner_user_id,
                title: undefined,
                description: undefined
              });
              $scope.events = [
                new Evnt({
                  share_id: undefined,
                  title: undefined,
                  description: undefined,
                  datetime_start: undefined,
                  datetime_stop: undefined
                  })]
            }
          },
          function(message) {
            var msg = '';
            if (message) {
              msg = ': ' + message;
            }
            $scope.errorMessage = 'Failed to load conversation' + msg;
          });
      } else {
        $scope.errorMessage = 'Missing conversation ID';
      };
    });
  
})();
