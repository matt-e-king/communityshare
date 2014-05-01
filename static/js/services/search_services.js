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
    function(ItemFactory, $q, $http, makeBaseLabels, sortLabels) {
      var baseLabels = makeBaseLabels();
      var labellists = {
        gradeLevels: baseLabels.all.gradeLevels,
        subjectAreas: baseLabels.all.subjectAreas.STEM.concat(
          baseLabels.all.subjectAreas.Arts, baseLabels.all.subjectAreas.Custom),
        engagementLevels: baseLabels.all.engagementLevels
      };
      var labelMapping = {};
      for (var key in labellists) {
        for (var i=0; i<labellists[key].length; i++) {
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
      Search.prototype.initialize = function() {
        sortLabels(this.labels);
      };
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
        this.displayLabelsAll = makeBaseLabels()['suggested'];
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
    'sortLabels',
    function(makeBaseLabels) {
      var baseLabels = makeBaseLabels()['all'];
      var sortLabels = function(labels) {
        var orderedLabels = baseLabels.gradeLevels.concat(
          baseLabels.subjectAreas.STEM, baseLabels.subjectAreas.Arts,
          baseLabels.subjectAreas.Custom, baseLabels.engagementLevels);
        var labelPositions = {};
        for (var i=0; i<orderedLabels.length; i++) {
          labelPositions[orderedLabels[i]] = i;
        }
        var getPosition = function(label) {
          var position = labelPositions[label];
          if (position === undefined) {
            position = orderedLabels.length;
          }
          return position;
        }
        var sortFn = function(labelA, labelB) {
          var result = getPosition(labelA) - getPosition(labelB);
          return result;
        }
        labels.sort(sortFn);
      }
      return sortLabels;
    });

  module.factory(
    'makeBaseLabels',
    function() {
      var makeBaseLabels = function() {
        var labels = {
          // Grade levels
          gradeLevels: {
            suggested: ['K-5', '6-8', '9-12', 'College', 'Adult'] ,
            other: ['K-3', '4-5', '6-8', '9-12', 'Preschool']
          },
          // Subject area
          subjectAreas: {
            STEM: {
              suggested: ['Science', 'Technology', 'Engineering', 'Math'],
              other: []
            },
            Arts: {
              suggested: ['Visual Arts', 'Digital Media', 'Film & Photography', 'Literature',
                          'Performing Arts'],
              other: []
            },
            Custom: {
              suggested: [],
              other: []
            }
          },
          // Level of Engagement
          engagementLevels: {
            suggested: [
              'Guest Speaker', 'Field Trip Host', 'Student Competition Judget',
              'Individual Mentor', 'Small Group Mentor', 'Curriculuum Development',
              'Career Day Participant', 'Classroom Materials Provider',
              'Short-term', 'Long-term'],
            other: []
          }
        };

        var suggestedLabels = {};
        suggestedLabels.gradeLevels = labels.gradeLevels.suggested;
        suggestedLabels.subjectAreas = {};
        suggestedLabels.subjectAreas.STEM = labels.subjectAreas.STEM.suggested;
        suggestedLabels.subjectAreas.Arts = labels.subjectAreas.Arts.suggested;
        suggestedLabels.subjectAreas.Custom = labels.subjectAreas.Custom.suggested;
        suggestedLabels.engagementLevels = labels.engagementLevels.suggested;

        var allLabels = {};
        allLabels.gradeLevels = labels.gradeLevels.suggested.concat(labels.gradeLevels.other);
        allLabels.subjectAreas = {};
        allLabels.subjectAreas.STEM = labels.subjectAreas.STEM.suggested.concat(
          labels.subjectAreas.STEM.other);
        allLabels.subjectAreas.Arts = labels.subjectAreas.Arts.suggested.concat(
          labels.subjectAreas.Arts.other);
        allLabels.subjectAreas.Custom = labels.subjectAreas.Custom.suggested.concat(
          labels.subjectAreas.Custom.other);
        allLabels.engagementLevels = labels.engagementLevels.suggested.concat(
          labels.engagementLevels.other);
        
        return {'suggested': suggestedLabels,
                'all': allLabels}
      };


      
      return makeBaseLabels;
    });

})();
