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
      'communityshare.controllers.user',
      'communityshare.controllers.search',
      'communityshare.controllers.message',
      'communityshare.directives.labels'
    ]);
  
  app.config(function($routeProvider) {

    $routeProvider.when('/', {
      templateUrl: './static/templates/default.html'
    });

    $routeProvider.when('/login', {
      templateUrl: './static/templates/login.html',
      controller: 'LoginController'
    });

    $routeProvider.when('/logout', {
      templateUrl: './static/templates/logout.html',
      controller: 'LogoutController'
    });

    $routeProvider.when('/signup/communitypartner', {
      templateUrl: './static/templates/signup_community_partner.html',
      controller: 'SignupCommunityPartnerController'
    });

    $routeProvider.when('/signup/educator', {
      templateUrl: './static/templates/signup_educator.html',
      controller: 'SignupEducatorController'
    });

    $routeProvider.when('/requestresetpassword', {
      templateUrl: './static/templates/request_reset_password.html',
      controller: 'RequestResetPasswordController'
    });

    $routeProvider.when('/resetpassword', {
      templateUrl: './static/templates/reset_password.html',
      controller: 'ResetPasswordController'
    });

    $routeProvider.when('/home', {
      templateUrl: './static/templates/home.html',
      controller: 'HomeController'
    });

    $routeProvider.when('/searchusers', {
      templateUrl: './static/templates/search_users.html',
      controller: 'SearchUsersController'
    });

    $routeProvider.when('/settings', {
      templateUrl: './static/templates/settings.html',
      controller: 'SettingsController'
    });

    $routeProvider.when('/user/:userId', {
      templateUrl: './static/templates/user_view.html',
      controller: 'UserController'
    });

    $routeProvider.when('/search/:searchId/edit', {
      templateUrl: './static/templates/search_edit.html',
      controller: 'SearchEditController'
    });

    $routeProvider.otherwise({
      templateUrl: './static/templates/unknown.html'
    });
    
  });
  
})();
