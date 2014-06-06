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
      var close = function() {
        $modalInstance.close($scope.share);
      };
      $scope.save = function() {
        for (var i=0; i<$scope.share.events.length; i++) {
          $scope.share.events[i].updateDateTimes();
        }
        var sharePromise = $scope.share.save();
        sharePromise.then(
          close,
          showErrorMessage);
      };
    });
  
})();
