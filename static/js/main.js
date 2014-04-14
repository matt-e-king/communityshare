(function() {
  'use strict';
  var app = angular.module(
    'communityshare',
    [
      'ngRoute',
      'communityshare.controllers.authentication'
    ]);
  
  app.config(function($routeProvider) {
    
    $routeProvider.when('/', {
      templateUrl: './static/templates/default.html',
    });

    $routeProvider.when('/login', {
      templateUrl: './static/templates/login.html',
      controller: 'LoginController'
    });
    
  });
  
})();
