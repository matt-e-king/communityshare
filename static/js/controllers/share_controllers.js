(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.share',
    [
      'communityshare.services.share',
      'communityshare.services.conversation'
    ]);

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
    'EditShareController',
    function($scope, share, $modalInstance, $q) {
      $scope.share = share;
      $scope.events = share.events;
      $scope.cancel = $modalInstance.close;
      var showErrorMessage = function(message) {
        var msg = 'Failed to save share details';
        if (message) {
          msg += ': ' + message;
        }
        $scope.errorMessage = msg;
      }
      var saveEvents = function() {
        var eventPromises = [];
        for (var i=0; i<$scope.events.length; i++) {
          var evnt = $scope.events[i];
          evnt.updateDateTimes();
          evnt.share_id = $scope.share.id;
          var eventPromise = evnt.save();
          eventPromises.push(eventPromise);
        }
        var allEventsPromise = $q.all(eventPromises);
        return allEventsPromise;
      };
      var close = function() {
        $modalInstance.close($scope.share);
      };
      $scope.save = function() {
        var saveEventsFirst = ($scope.share.id >= 0);
        if (saveEventsFirst) {
          var eventsPromise = saveEvents();
          var shareDeferred = $q.defer();
          eventsPromise.then(
            function() {
              var sharePromise = $scope.share.save();
              sharePromise.then(
                function(share) {
                  shareDeferred.resolve(share);
                },
                function(message) {
                  shareDeferred.reject(message);
                });
            },
            function(message) {
              shareDeferred.reject(message);
            });
          var finalPromise = shareDeferred.promise;
          finalPromise.then(
            close,
            showErrorMessage);
        } else {
          var sharePromise = $scope.share.save();
          sharePromise.then(
            function(share) {
              var eventsPromise = saveEvents();
              eventsPromise.then(
                function(events) {
                  for (var i=0; i<events.length; i++) {
                    var evnt = events[i];
                    var index = share.events.indexOf(evnt);
                    if (index === -1) {
                      share.events.push(evnt);
                    }
                  }
                  close();
                },
                showErrorMessage);
            });
        }
      };
    });
  
})();
