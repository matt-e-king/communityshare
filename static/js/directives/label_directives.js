(function() {
  'use strict';
  
  var module = angular.module('communityshare.directives.labels', [
    'communityshare.services.search'
  ]);

  module.directive(
    'csNewLabel',
     function(Session) {
       return {
         scope: {
           methods: '=',
         },
         controller: function($scope) {
           $scope.update = function() {
             if ($scope.methods.onUpdate) {
               $scope.methods.onUpdate();
             }
           };
         },
         link: function(scope, elm, attrs) {
           elm.bind('keydown', function(event) {
             var ENTERCODE = 13;
             var TABCODE = 9;
             if ((event.keyCode === ENTERCODE) || (event.keyCode === TABCODE)) {
               scope.$apply(scope.update);
             }
           });
           elm.bind('blur', function(event) {
             scope.$apply(scope.update);
           });
         }
       };
     });

  module.directive(
    'csEducatorLabels',
     function(Session, labels) {
       return {
         scope: {
           activeLabels: '='
         },
         templateUrl: './static/templates/educator_labels.html',
         controller: function($scope) {
           $scope.newLabel = {
             name: ''
           };
           $scope.newLabelMethods = {
             onUpdate: function() {
               var newLabelName = $scope.newLabel.name;
               if (newLabelName) {
                 $scope.labels.subjectAreas.Custom.push(newLabelName);
                 $scope.activeLabels[newLabelName] = true;
               }
               $scope.newLabel.name = '';
             }
           };
           $scope.labels = labels
           $scope.toggleLabel = function(label) {
             if ($scope.activeLabels[label]) {
               $scope.activeLabels[label] = false;
             } else {
               $scope.activeLabels[label] = true;
             }
           }
         }
       };
     });
  
})();
