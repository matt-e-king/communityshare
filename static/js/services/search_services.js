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

      var compareLabels = function(targetLabels, retrievedLabels) {
        var matchingLabels = {};
        var missingLabels = [];
        for (var i=0; i<targetLabels.length; i++) {
          var targetLabel = targetLabels[i];
          var index = retrievedLabels.indexOf(targetLabel);
          if (index === -1) {
            missingLabels.push(targetLabel);
          }
          matchingLabels[targetLabel] = (index >= 0);
        }
        var comparison = {
          'matching': matchingLabels,
          'missing': missingLabels
        };
        return comparison;
      }

      var Search = ItemFactory('search');
      Search.getResults = function(searchId) {
        var deferred = $q.defer();
        var url = '/api/search/' + searchId + '/results';
        var resultsPromise = $http({
          method: 'GET',
          url: url
        });
        var searchPromise = Search.get(searchId);
        var searchAndResultsPromise = $q.all([searchPromise, resultsPromise]);
        searchAndResultsPromise.then(
          function(responses) {
            console.log(responses);
            var baseSearch = responses[0];
            var resultsResponse = responses[1];
            var searches = []
            for (var i=0; i<resultsResponse.data.data.length; i++) {
              var search = new Search(resultsResponse.data.data[i]);
              var comparison = compareLabels(baseSearch.labels, search.labels);
              search.matchingLabels = comparison.matching;
              search.missingLabels = comparison.missing;
              search.targetLabels = baseSearch.labels;
              searches.push(search);
            }
            deferred.resolve(searches);
          },
          function(response) {
            var msg = '';
            if (response.message) {
              msg = response.message;
            }
            deferred.reject('Error loading search results: ' + msg);
          });
        return deferred.promise;
      };
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
