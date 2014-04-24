(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.map',
    [
    ])

  module.factory(
    'Map',
    function($q) {
      var Map = function(elementId) {
        var element = document.getElementById(elementId);
        if (element) {
          //  Setup map
          var latlng = new google.maps.LatLng(32.223303, -110.970905);
          var mapOptions = {
            zoom: 10,
            center: latlng
          }
          this.map = new google.maps.Map(document.getElementById(elementId), mapOptions);
        }
        this.geocoder = new google.maps.Geocoder();
      }
        
      Map.prototype.codeAddress = function(address) {
        var _this = this;
        var deferred = $q.defer()
        this.geocoder.geocode( { 'address': address}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (_this.map) {
              _this.map.setCenter(results[0].geometry.location);
              _this.map.setZoom(13);
              var marker = new google.maps.Marker({
                map: _this.map,
                position: results[0].geometry.location
              });
            }
            deferred.resolve(results[0].geometry.location);
          } else {
            deferred.reject('Geocode was not successful for the following reason: ' + status);
          }
        });
        return deferred.promise;
      };
      return Map;
    });

})();
