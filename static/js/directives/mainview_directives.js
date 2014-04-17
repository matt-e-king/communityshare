(function() {
  'use strict';
  
  var module = angular.module('communityshare.directives.mainview', [
    'ui.bootstrap.alert'
  ]);

  module.directive(
    'csMainView',
     function($compile, Session) {
       var noPermission = function(el, scope) {
         var children = el[0].childNodes;
         var l = children.length;
         for (var i=l-1; i>=0; i--) {
           var c = children[i];
           c.parentNode.removeChild(c);
         }
         var nodetext1 = '<div id="content-header"><h1>Forbidden</h1></div><div id="content-container"><div class="row"><div class="col-lg-12"><h4 class="heading">You do not have permission to view this page</h4>'
         var nodetext2 = '<p>Try <a href="/#/login">logging in</a></p>'
         var nodetext3 = '</div></div></div'
         var nodetext;
         if (Session.activeUser) {
           nodetext = nodetext1 + nodetext3;
         } else {
           nodetext = nodetext1 + nodetext2 + nodetext3;
         }
         var errorNode = $compile(nodetext)(scope);
         el.append(errorNode);
       };

       return {
         restrict: 'AE',
         scope: false,
         link: function(scope, element, attrs) {
           if (attrs.hasPermission === 'true') {
           } else {
             noPermission(element, scope);
           }
         }
       };
     });
  
})();
