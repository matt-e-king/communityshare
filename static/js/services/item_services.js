(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.item',
    [
      'ngResource',
      'ngCookies'
    ])

  module.factory(
    'ItemFactory',
    function($q, $http, SessionBase) {
      var ItemFactory = function(resourceName) {
        var Item = function(itemData) {
          this.updateFromData(itemData);
        };
        Item.prototype.toData = function() {
          var data = JSON.parse(JSON.stringify(this));          
          return data;
        }
        Item.prototype.clone = function() {
          var data = this.toData();
          var item = new Item(data);
          return item;
        }
        Item.makeUrl = function(id) {
          var url = '/api/' + resourceName;
          if (id !== undefined) {
            url += '/' + id;
          }
          return url;
        };
        Item.get = function(id) {
          var deferred = $q.defer();
          var dataPromise = $http({
            method: 'GET',
            url: Item.makeUrl(id) 
          });
          dataPromise.then(
            function(data) {
              var item = new Item(data.data.data);
              deferred.resolve(item);
            },
            function(response) {
              deferred.reject(response.message);
            }
          );
          return deferred.promise;
        };
        Item.get_many = function(searchParams) {
          var deferred = $q.defer();
          var dataPromise = $http({
            method: 'GET',
            url: Item.makeUrl(),
            params: searchParams
          });
          dataPromise.then(
            function(response) {
              var items = []
              for (var i=0; i<response.data.data.length; i++) {
                var item = new Item(response.data.data[i]);
                items.push(item);
              }
              deferred.resolve(items);
            },
            function(response) {
              deferred.reject(response.message);
            }
          );
          return deferred.promise;          
        };
        Item.prototype.updateFromData = function(itemData) {
          for (var key in itemData) {
            this[key] = itemData[key];
          }
        };
        Item.prototype.save = function() {
          var _this = this;
          var deferred = $q.defer();
          var method;
          if (this.id === undefined) {
            method = 'POST';
          } else {
            method = 'PATCH';
          }
          var dataPromise = $http({
              method: method,
              url: Item.makeUrl(this.id),
              data: this.toData()
            });
          dataPromise.then(
            function(response) {
              _this.updateFromData(response.data.data)
              // Properties of the current user can also be set.
              if (response.data.user !== undefined) {
                SessionBase.activeUser.updateFromData(response.data.user);
              }
              deferred.resolve(_this);
            },
            function(response) {
              var message = ''
              if (response.data.message) {
                message = response.data.message;
              }
              deferred.reject(message);
            }
          );
          return deferred.promise;
          
        };
        return Item;
      };
      return ItemFactory;
    });  

})();
