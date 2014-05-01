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
           methods: '='
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
     function(Session) {
       return {
         scope: {
           search: '=',
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
                 $scope.search.displayLabelsAll.subjectAreas.Custom.push(newLabelName);
                 $scope.search.activeLabels[newLabelName] = true;
               }
               $scope.newLabel.name = '';
             }
           };
           $scope.toggleLabel = function(label) {
             if ($scope.search.activeLabels[label]) {
               $scope.search.activeLabels[label] = false;
             } else {
               $scope.search.activeLabels[label] = true;
             }
           }
         }
       };
     });
  
})();