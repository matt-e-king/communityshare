(function() {
  'use strict';
  
  var module = angular.module('communityshare.directives.labels', [
    'communityshare.services.search'
  ]);

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
          subjectAreas: {
            communityPartnerSuggested: [
              'Science', 'Technology', 'Engineering', 'Match',
              'Visual Arts', 'Digital Media', 'Film & Photography', 'Literature',
              'Performing Arts'
            ],
            educatorSuggested: [
              'Social Studies', 'English/Language Arts', 'Foreign Languages', 'PE/Health/Sports',
              'Mathematics', 'Goverment', 'Science',
            ],
            other: []
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

        var allLabels = {
          gradeLevels: labels.gradeLevels.suggested.concat(
            labels.gradeLevels.other),
          engagementLevels: labels.engagementLevels.suggested.concat(
            labels.engagementLevels.other),
          subjectAreas: labels.subjectAreas.communityPartnerSuggested.concat(
            labels.subjectAreas.educatorSuggested).concat(
              labels.subjectAreas.other)
        };
        var educatorSuggestedLabels = {
          gradeLevels: labels.gradeLevels.suggested,
          engagementLevels: labels.engagementLevels.suggested,
          subjectAreas: labels.subjectAreas.educatorSuggested
        };
        var communityPartnerSuggestedLabels = {
          gradeLevels: labels.gradeLevels.suggested,
          engagementLevels: labels.engagementLevels.suggested,
          subjectAreas: labels.subjectAreas.communityPartnerSuggested
        };
        var communityPartnerAndEducatorSuggestedLabels = {
          gradeLevels: labels.gradeLevels.suggested,
          engagementLevels: labels.engagementLevels.suggested,
          subjectAreas: labels.subjectAreas.communityPartnerSuggested.concat(
            labels.subjectAreas.educatorSuggested)
        };

        
        return {'educatorSuggested': educatorSuggestedLabels,
                'communityPartnerSuggested': communityPartnerSuggestedLabels,
                'communityPartnerAndEducatorSuggested': communityPartnerAndEducatorSuggestedLabels,
                'all': allLabels}
      };

      return makeBaseLabels;
    });

  module.factory(
    'LabelDisplay',
    function(makeBaseLabels) {
      var labellists = makeBaseLabels().all;
      var labelMapping = {};
      for (var key in labellists) {
        for (var i=0; i<labellists[key].length; i++) {
          var label = labellists[key][i];
          labelMapping[label] = key;
        }
      }
      var LabelDisplay = function(search, type) {
        this.search = search;
        var baseLabels = makeBaseLabels();
        this.all = {};
        this.active = {};
        if (type == 'educator') {
          this.all = baseLabels.educatorSuggested;
        } else {
          this.all = baseLabels.communityPartnerSuggested;
        }
        for (var i=0; i<search.labels.length; i++) {
          var label = search.labels[i];
          this.active[label] = true;
          var key = labelMapping[label];
          if (key === undefined) {
            key = 'subjectAreas'
            this.all[key].push(label);
          }
        }
      };
      LabelDisplay.prototype.toggle = function(label) {
        if (this.active[label]) {
          this.active[label] = false;
          var index = this.search.labels.indexOf(label);
          if (index >= 0) {
            this.search.labels.splice(index, 1);
          }
        } else {
          this.active[label] = true;
          this.search.labels.push(label);
        }
        console.log('labels is');
        console.log(this.search.labels);
      };
      return LabelDisplay;
    });

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
         }
       };
     });

  var LabelsController = function($scope, LabelDisplay, getAllLabels) {
    console.log('scope is');
    console.log($scope);
    // Problem with search getting overridden.
    $scope.display = new LabelDisplay($scope.search, $scope.type);
    $scope.newLabel = {
      name: ''
    };
    var labelsPromise = getAllLabels();
    $scope.allLabels = [];
    labelsPromise.then(
      function(labels) {
        $scope.allLabels = labels;
      },
      function(){});
    $scope.typeaheadSelect = function() {
      $scope.newLabelMethods.onUpdate();
    };
    $scope.newLabelMethods = {
      onUpdate: function() {
        var newLabelName = $scope.newLabel.name;
        if (newLabelName) {
          $scope.display.all.subjectAreas.push(newLabelName);
          $scope.display.active[newLabelName] = true;
        }
        $scope.newLabel.name = '';
      }
    };
    $scope.toggleLabel = function(label) {
      if (!$scope.onlyShowActive) {
        $scope.display.toggle(label);
      }
    };
  };

/*
 - list of labels.

 - create directive whre you choose them (need titles, and suggested labels)

 - create directive where you display them (need classification and ordering)

  cs-choose-labels search titles suggestion-type

  cs-display-labels search

*/


  module.directive(
    'csLabels',
    function(Session) {
      return {
        scope: {
          search: '=',
          gradeLevelsTitle: '@',
          engagementLevelsTitle: '@',
          subjectAreasTitle: '@',
          type: '@',
          onlyShowActive: '@',
        },
        templateUrl: './static/templates/labels.html',
        controller: LabelsController,
      };
    });

})();
