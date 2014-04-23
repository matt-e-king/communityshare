(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.search',
    [
      'communityshare.services.user',
      'communityshare.services.search'
    ]);
  
  var makeSignUpController = function(controllerName, searcher_role,
                                      searching_for_role) {
    module.controller(
      controllerName,
      function($scope, $location, $q, Session, signUp, Search, User) {
        $scope.Session = Session;
        $scope.activeLabels = {};
        $scope.newUser = new User();
        $scope.message = '';
        $scope.getLabels = function() {
          var labels = [];
          for (var label in $scope.activeLabels) {
            if ($scope.activeLabels[label]) {
              labels.push(label);
            }
          }
          return labels;
        };
        $scope.saveSettings = function() {
          var userPromise = signUp($scope.newUser.name, $scope.newUser.email,
                                   $scope.newUser.password);
          var searchPromise = userPromise.then(
            function(user) {
              var latitude = undefined;
              var longitude = undefined;
              if ($scope.newUser.latlng) {
                latitude = $scope.newUser.latlng.k;
                longitude = $scope.newUser.latlng.A;
              }
              var newSearch = new Search({
                searcher_user_id: user.id,
                searcher_role: searcher_role,
                searching_for_role: searching_for_role,
                active_only: false,
                labels: $scope.getLabels(),
                latitude: latitude,
                longitude: longitude,
                distance: $scope.newUser.distance
              });
              return newSearch.save();
            },
            function(message) {
              var deferred = $q.defer();
              deferred.reject('Failed to signup: ' + message);
              return deferred.promise;
            });
          searchPromise.then(
            function(search) {
              $location.path('/home');
            },
            function(message) {
              $scope.message =
                "Failed to save preferences: " + message;
            }
          );
        };
        //  Setup map
        var latlng = new google.maps.LatLng(32.223303, -110.970905);
        var mapOptions = {
          zoom: 10,
          center: latlng
        }
        var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
        var geocoder = new google.maps.Geocoder();

        $scope.codeAddress = function() {
          var address = $scope.newUser.location;
          geocoder.geocode( { 'address': address}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
              map.setCenter(results[0].geometry.location);
              map.setZoom(13);
              var marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location
              });
              $scope.newUser.latlng = results[0].geometry.location;
            } else {
              alert('Geocode was not successful for the following reason: ' + status);
            }
          });
        }

      });
  };

  makeSignUpController('SignupEducatorController', 'educator', 'partner')

})();
