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

    $routeProvider.when('/logout', {
      templateUrl: './static/templates/logout.html',
      controller: 'LogoutController'
    });

    $routeProvider.when('/requestresetpassword', {
      templateUrl: './static/templates/request_reset_password.html',
      controller: 'RequestResetPasswordController'
    });

    $routeProvider.when('/resetpassword', {
      templateUrl: './static/templates/reset_password.html',
      controller: 'ResetPasswordController',
      reloadOnSearch: false
    });

    $routeProvider.when('/home', {
      templateUrl: './static/templates/home.html',
      controller: 'HomeController'
    });

    $routeProvider.when('/settings', {
      templateUrl: './static/templates/settings.html',
      controller: 'SettingsController'
    });

    $routeProvider.when('/user/:userId', {
      templateUrl: './static/templates/user_view.html',
      controller: 'UserController'
    });

    $routeProvider.otherwise({
      templateUrl: './static/templates/unknown.html'
    });
    
  });
  
})();
