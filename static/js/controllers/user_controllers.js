(function() {
  'use strict';

  var module = angular.module(
    'communityshare.controllers.user',
    [
      'communityshare.services.user',
      'communityshare.directives.user',
      'communityshare.directives.institutions',
      'angularFileUpload'
    ]);

  // User Views
  
  module.controller(
    'UserController',
    function($scope, $routeParams, User, Session, Question) {
      $scope.Session = Session;
      var userId = $routeParams.userId;
      var userPromise = User.get(userId);
      $scope.message = 'Loading user...'
      userPromise.then(
        function(user) {
          $scope.message = '';
          $scope.user = user;
          if ($scope.communityPartnerViewMethods.onUserUpdate) {
            $scope.communityPartnerViewMethods.onUserUpdate(user);
          }
          if ($scope.educatorViewMethods.onUserUpdate) {
            $scope.educatorViewMethods.onUserUpdate(user);
          }
        },
        function(response) {
          $scope.message = 'Could not find user with id=' + userId;
        });
      $scope.communityPartnerViewMethods = {};
      $scope.educatorViewMethods = {};
      var questionsPromise = Question.get_many_with_answers(
        userId,
        {question_type: 'signup_community_partner'}
      );
      questionsPromise.then(
        function(questions) {
          $scope.questions = [];
          for (var i=0; i<questions.length; i++) {
            var question = questions[i];
            if (question.answer.text) {
              $scope.questions.push(question);
            }
          }
        });
    });

  // User Signups

  var commonSignupLogic = function($scope, Session, Messages, User, signUp,
                                   $location, $q) {
    $scope.Session = Session;
    $scope.editedUser = new User();
    $scope.newSearch.makeLabelDisplay()

    // passwordMethods hooks up the password matching directives.
    $scope.passwordMethods = {};

    $scope.submit = function() {
      var userPromise = signUp($scope.editedUser, $scope.editedUser.password);
      userPromise.then(
        function(user) {
          // After use is created save the passive search.
          $scope.newSearch.processLabelDisplay();
          $scope.newSearch.searcher_user_id = user.id;
          $scope.newSearch.zipcode = user.zipcode;
          var searchPromise = $scope.newSearch.save();
          var allPromises = [searchPromise];
          // And save the answers to questions.
          for (var i=0; i<$scope.questions.length; i++) {
            var question = $scope.questions[i];
            if (question.answer.text) {
              allPromises.push(question.answer.save());
            }
          }
          $q.all(allPromises).then(
            function(data) {
              var search = data[0];
              $location.path('/search/' + search.id + '/results');
            },
            function(message) {
              Messages.error(message);
            });
        },
        function(message) {
          Messages.error(message);
        });
    };
  };

  module.controller(
    'SignupCommunityPartnerController',
    function($scope, Session, Messages, User, signUp, $location, $q, Search,
             Question, Answer) {
      $scope.newSearch = new Search({
          searcher_user_id: undefined,
          searcher_role: 'partner',
          searching_for_role: 'educator',
          active: true,
          labels: [],
          latitude: undefined,
          longitude: undefined,
          distance: undefined
        });
      // Get questions to display during signup.
      $scope.questions = [];
      var questionsPromise = Question.get_many({
        question_type: 'signup_community_partner'
      });
      questionsPromise.then(
        function(questions) {
          $scope.questions = questions;
          for (var i=0; i<$scope.questions.length; i++) {
            var question = $scope.questions[i];
            question.answer = new Answer({question_id: question.id});
          }
        });
      // Signup logic common to Community Partners and Educators
      commonSignupLogic($scope, Session, Messages, User, signUp, $location, $q);
    });
  
  module.controller(
    'SignupEducatorController',
    function($scope, Session, Messages, User, signUp, $location, $q, Search) {
      $scope.newSearch = new Search({
        searcher_user_id: undefined,
        searcher_role: 'educator',
        searching_for_role: 'partner',
        active: true,
        labels: [],
        latitude: undefined,
        longitude: undefined,
        distance: undefined
      });
      $scope.questions = [];
      // Signup logic common to Community Partners and Educators
      commonSignupLogic($scope, Session, Messages, User, signUp, $location, $q);
    });

  // Settings Controller

  module.controller(
    'SettingsController',
    function($scope, $location, Session, Messages, $q, CommunityPartnerUtils,
             Question, Answer, $fileUploader, $http, makeDialog, Authenticator) {
      $scope.Session = Session;
      if (!Session.activeUser) {
        return;
      }
      $scope.user = Session.activeUser;
      $scope.properties = {};
      $scope.settingsTabSet = {};
      // passwordMethods hooks up the password matching directives.
      $scope.passwordMethods = {};
      // Get the questions
      if ($scope.user && $scope.user.is_community_partner) {
        var questionsPromise = Question.get_many_with_answers(
          $scope.user.id,
          {question_type: 'signup_community_partner'}
        );
        questionsPromise.then(
          function(questions) {
            $scope.questions = questions;
          });
      };
      // Grab a community partner's passive search.
      if ($scope.user && $scope.user.is_community_partner) {
        var searchesPromise = $scope.user.getSearches();
        var searchPromise = CommunityPartnerUtils.searchesPromiseToSearchPromise(
          searchesPromise);
        searchPromise.then(
          function(search) {
            if (search) {
              $scope.search = search;
              search.makeLabelDisplay();
            } else {
              // Apparently the user didn't have a search.
              $scope.search = new Search({
                searcher_user_id: $scope.user.id,
                searcher_role: 'partner',
                searching_for_role: 'educator',
                active: true,
                labels: [],
                latitude: undefined,
                longitude: undefined,
                distance: undefined
              });
            }
            $scope.search.makeLabelDisplay();
          },
          function(message) {
            Messages.error(message);
          });
      }

      if (Session.activeUser) {
        $scope.editedUser = Session.activeUser.clone();
      }
      $scope.$on('personalSettingsForm', function(event, value) {
        $scope.personalSettingsForm = value.personalSettingsForm;
      });
      $scope.$on('accountSettingsForm', function(event, value) {
        $scope.accountSettingsForm = value.accountSettingsForm;
      });

      var onError = function(message) {
        var msg = '';
        if (message) {
          msg = ': ' + message;
        }
        var msg = 'Failed to update settings' + msg;
        $scope.errorMessage = msg;
        $scope.successMessage = '';
      };

      $scope.validImage = true;
      var uploader = $scope.uploader = $fileUploader.create({
        scope: $scope,
        url: '/api/user/'+$scope.user.id+'/picture',
        headers: $http.defaults.headers.common,
        filters: [
          function (item) {
            var is_image = (item.type.substring(0, 5) == 'image');
            $scope.validImage = is_image;
            uploader.queue.splice(0, uploader.queue.length);
            return is_image;
          }
        ]
      });

      // Make sure we only have one file in the uploader queue
      uploader.bind('afteraddingfile', function (event, item) {
        if (uploader.queue.length > 1) {
          uploader.queue.splice(0, uploader.queue.length-1);
        }
      });

      $scope.deleteAccount = function() {
        var title = 'Delete Account';
          var msg = 'Do you really want to delete your Community Share account?';
        var btns = [{result:'yes', label: 'Yes'},
                    {result:'no', label: 'No', cssClass: 'btn-primary'}];
        var d = makeDialog(title, msg, btns);
        d.result.then(
          function(result) {
            if (result === 'yes') {
              var deletePromise = Session.activeUser.destroy();
              deletePromise.then(
                function() {
                  Authenticator.clean();
                  $location.path('/');
                },
                function(message) {
                    Messages.error(message);
                });
            }
          });
      };

      $scope.resendEmailConfirmation = function() {
        var emailConfirmPromise = Authenticator.requestConfirmEmail();
        emailConfirmPromise.then(
          function() {
            Messages.info('Sent email confirmation email.');
          },
          function(errorMessage) {
            Messages.error(errorMessage);
          });
      };

      $scope.save = function() {
        var saveUserPromise = $scope.editedUser.save();
        var savedImages = uploader.uploadAll();
        var saveSearchPromise = undefined;
        var allPromises = [saveSearchPromise];
        if ($scope.search) {
          $scope.search.processLabelDisplay();
          saveSearchPromise = $scope.search.save();
          allPromises.push(saveSearchPromise);
        }
        if ($scope.questions) {
          var saveAnswerPromises = [];
          for (var i=0; i<$scope.questions.length; i++) {
            var answer = $scope.questions[i].answer;
            if (answer.text) {
              var saveAnswerPromise = answer.save();
              saveAnswerPromises.push(saveAnswerPromise);
              allPromises.push(saveAnswerPromise);
            }
          }
        }
        var combinedPromise = $q.all(allPromises);
        saveUserPromise.then(
          function(user) {
            Session.activeUser.updateFromData(user.toData());
          },
          onError);
        if (saveSearchPromise) {
          saveSearchPromise.then(
            function() {},
            onError);
        }
        combinedPromise.then(
          function() {
            $location.path('/home');
          });
      };
      
    });

})();
