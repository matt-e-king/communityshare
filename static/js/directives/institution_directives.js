(function() {
  'use strict';
  
  var module = angular.module('communityshare.directives.institutions', [
    'communityshare.services.user'
  ]);

  module.directive(
    'csInstitutions',
     function(Session, Institution) {
       return {
         scope: {
           user: '=',
           methods: '=',
           isEducator: '@',
           isCommunityPartner: '@'
         },
         templateUrl: './static/templates/institution_adder.html',
         controller: function($scope) {
           if ($scope.methods !== undefined) {
             $scope.methods.isValid = function() {
               var valid = true;
               var nIAs = 0;
               if ((!$scope.noInstitutions) && $scope.user) {
                 for (var i=0; i<$scope.user.institution_associations.length; i++) {
                   var ia = $scope.user.institution_associations[i];
                   if (!(ia.isValid && ia.isValid())) {
                     valid = false;
                   } else if (ia.role) {
                     nIAs += 1;
                   } 
                 }
                 if (nIAs === 0) {
                   valid = false;
                 }
               }
               return valid;
             };
           }
           $scope.updateInstitutions = function() {
             if ($scope.noInstitutions) {
               $scope.user.institution_associations = [];
               $scope.user.addNewInstitutionAssociation();
             }
           };
           // FIXME: Not scaleable.  Change to get the most popular.
           var institutionsPromise = Institution.get_many();
           var institutionTypes = [];
           $scope.options = {institutions: [],
                             institutionTypes: [],
                            };
           if ($scope.isCommunityPartner) {
             $scope.options.institutionTypes = [
               'Corporation', 'Freelancer', 'Nonprofit', 'Academic',
               'Government', 'Other'
               ];
             $scope.options.roles = [];
           } else if ($scope.isEducator) {
             $scope.options.institutionTypes = [
               'Public District School',
               'Public Charter',
               'Private School',
               'Home School',
               'Higher Education',
               'Nonprofit',
               'After School Program',
               'Other',
             ];
            $scope.options.roles = [
              'Classroom teacher',
              'Curriculum Coordinator',
              'Administator',
              'Parent',
              'Other',
            ];
           }
           if ($scope.user.institution_associations.length === 0) {
             $scope.user.institution_associations.push({institution: {}});
           }
           institutionsPromise.then(
             function(institutions) {
               $scope.options.institutions = institutions;
             });
         }
       };
     });

  module.directive(
    'csInstitutionAssociationEdit',
    function() {
      return {
        scope: {
          institutionAssociation: '=',
          institutions: '=',
          institutionTypes: '=',
          roles: '=',
          disabled: '=',
          index: '@'
        },
        templateUrl: 'static/templates/institution_association.html',
        controller: function($scope) {
          $scope.institutionAssociation.isValid = function() {
            var withValues = 0;
            if ($scope.institutionAssociation.role) {
              withValues += 1;
            }
            if ($scope.institutionAssociation.institution.name) {
              withValues += 1;
            }
            if ($scope.institutionAssociation.institution.institution_type) {
              withValues += 1;
            }
            var valid = ((withValues===0) || (withValues===3));
            return valid;
          }
        }
      };
    });
  
})();
