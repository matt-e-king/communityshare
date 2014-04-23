(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.search',
    [
      'communityshare.services.item'
    ])

  module.factory(
    'Search',
    function(ItemFactory, $q, $http) {
      var Search = ItemFactory('search');
      return Search;
    });

  module.factory(
    'labels',
    function() {
      var labels = {
        // Grade levels
        gradeLevels: [
          'K-3', '4-5', '6-8', '9-12'],
        // Subject area
        subjectAreas: {
          STEM: ['Science', 'Technology', 'Engineering', 'Math'],
          Arts: ['Visual Arts', 'Digital Media', 'Film & Photography', 'Literature',
                 'Performing Arts'],
          Custom: []
        },
        // Level of Engagement
        engagementLevels: [
          'Guest Speaker', 'Field Trip Host', 'Student Competition Judget',
          'Individual Mentor', 'Small Group Mentor', 'Curriculuum Development',
          'Career Day Participant', 'Classroom Materials Provider',
          'Short-term', 'Long-term'
        ]}
      return labels;
    });

  module.factory(
    'sortLabels',
    function(labels) {
      var labellists = {
        gradeLevels: labels.gradeLevels,
        subjectAreas: labels.subjectAreas.STEM.concat(
          labels.subjectAreas.Arts, labels.subjectAreas.Custom),
        engagementLevels: labels.engagementLevels
      };
      var mapping = {};
      for (var key in labellists) {
        for (var i=0; i<labellists[key]; i++) {
          var label = labellists[key][i];
          mapping[label] = key;
        }
      }
      var sortLabels = function(labellist) {
        var newLabels = {
          gradeLevels: [],
          subjectAreas: [],
          engagementLevels: []
        };
        for (var i=0; i<labellist.length; i++) {
          var label = labellist[i];
          var key = mapping[label];
          if (key === undefined) {
            key = 'subjectAreas';
          }
          newLabels[key].push(label);
        }
        return newLabels;
      };
      return sortLabels;
    });

})();
