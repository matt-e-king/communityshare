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
    'csEducatorLabels',
     function(Session) {
       return {
         scope: {
           activeLabels: '='
         },
         templateUrl: './static/templates/educator_labels.html',
         controller: function($scope) {
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
