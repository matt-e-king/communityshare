(function() {
  'use strict';
  
  var module = angular.module('communityshare.directives.labels', [
  ]);

  var labels = {
    // Grade levels
    gradeLevels: [
      'K-3', '4-5', '6-8', '9-12'],
    // Subject area
    subjectAreas: [
      'STEM', 'Arts',
      'Science', 'Technology', 'Engineering', 'Math',
      'Visual Arts', 'Digital Media', 'Film & Photography', 'Literature',
      'Performing Arts'],
    // Level of Engagement
    engagementLevels: [
      'Guest Speaker', 'Field Trip Host', 'Student Competition Judget',
      'Individual Mentor', 'Small Group Mentor', 'Curriculuum Development',
      'Career Day Participant', 'Classroom Materials Provider',
      'Short-term', 'Long-term'
    ]}

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
     function(Session) {
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
               $scope.labels.subjectAreas.push(newLabelName);
               $scope.activeLabels[newLabelName] = true;
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
