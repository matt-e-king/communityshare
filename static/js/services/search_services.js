(function() {
  'use strict';
  
  var module = angular.module(
    'communityshare.services.search',
    [
      'communityshare.services.item',
      'communityshare.services.user'
    ])

  module.factory(
    'Search',
    function(ItemFactory, $q, $http, makeBaseLabels) {
      var baseLabels = makeBaseLabels();
      var labellists = {
        gradeLevels: baseLabels.gradeLevels,
        subjectAreas: baseLabels.subjectAreas.STEM.concat(
          baseLabels.subjectAreas.Arts, baseLabels.subjectAreas.Custom),
        engagementLevels: baseLabels.engagementLevels
      };
      var labelMapping = {};
      for (var key in labellists) {
        for (var i=0; i<labellists[key]; i++) {
          var label = labellists[key][i];
          labelMapping[label] = key;
        }
      }
      var Search = ItemFactory('search');
      Search.prototype.makeLabelDisplay = function() {
        this.displayLabelsAll = makeBaseLabels();
        this.displayLabelsActive = {
          gradeLevels: [],
          subjectAreas: [],
          engagementLevels: []
        };
        this.activeLabels = {};
        if (this.labels) {
          for (var i=0; i<this.labels.length; i++) {
            var label = this.labels[i];
            this.activeLabels[label] = true;
            var key = labelMapping[label];
            if (key === undefined) {
              this.displayLabelsAll.subjectAreas.Custom.push(label);
              key = 'subjectAreas'
            }
            this.displayLabelsActive[key].push(label);
          }
        }
      };
      Search.prototype.processLabelDisplay = function() {
        this.labels = [];
        for (var key in this.activeLabels) {
          if (this.activeLabels[key]) {
            this.labels.push(key);
          }
        }
      }
      return Search;
    });

  module.factory(
    'makeBaseLabels',
    function() {
      var makeBaseLabels = function() {
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
      };
      return makeBaseLabels;
    });

})();
