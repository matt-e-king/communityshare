(function() {
  'use strict';
  
  var module = angular.module('communityshare.directives.user', [
  ]);

  module.directive(
    'csCommunityPartnerView',
    function(Session) {
      return {
        scope: {methods: '='},
        templateUrl: './static/templates/community_partner_home.html',
        controller: 'CommunityPartnerViewController'
      };
    });
  
  module.directive(
    'csCommunityPartnerSettings',
    function() {
      return {
        scope: {
          methods: '=',
          user: '='
        },
        templateUrl: './static/templates/community_partner_settings.html',
        controller: 'CommunityPartnerSettingsController'
      };
    });
      
})();
