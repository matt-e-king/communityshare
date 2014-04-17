(function() {
  'use strict';
  var app = angular.module(
    'communityshare',
    [
      'ngRoute',
      'ui.bootstrap',
      'communityshare.directives.mainview',
      'communityshare.controllers.authentication',
      'communityshare.controllers.home',
      'communityshare.controllers.user'
    ]);
  
  app.config(function($routeProvider) {

    $routeProvider.when('/', {
      templateUrl: './static/templates/default.html',
    });

    $routeProvider.when('/login', {
      templateUrl: './static/templates/login.html',
      controller: 'LoginController'
    });

    $routeProvider.when('/home', {
      templateUrl: './static/templates/home.html',
      controller: 'HomeController'
    });

    $routeProvider.when('/settings', {
      templateUrl: './static/templates/settings.html',
      controller: 'SettingsController'
    });
    
  });
  
})();
