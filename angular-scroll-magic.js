/* global angular, ScrollWizardry, TweenMax, TimelineMax */

(function () {
  angular.module('hj.scrollMagic', [])

    .config(['$compileProvider', function ($compileProvider) {
      if ($compileProvider.preAssignBindingsEnabled) {
        $compileProvider.preAssignBindingsEnabled(true);
      }
      if ($compileProvider.strictComponentBindingsEnabled) {
        $compileProvider.strictComponentBindingsEnabled(true);
      }
    }])

    .provider('scrollMagic', function () {
      var self = this;

      self.addIndicators = false;

      // eslint-disable-next-line
      self.$get = ['$rootScope', function ($rootScope) {
        return {
          addIndicators: self.addIndicators,
        };
      }];
    })

    .service('ScrollMagicService', ['$document', function ($document) {
      var service = {};

      service.controller = new ScrollWizardry.Controller();

      var scenes = {};
      var sceneObservers = {};

      var notifySceneObservers = function (id) {
        var args = Array.prototype.slice.call(arguments, 1);

        args.push(id);

        sceneObservers[id].forEach(function (fn) {
          fn.apply(null, args);
        });

        sceneObservers[id] = sceneObservers[id].filter(function (fn) {
          return fn.persist;
        });
      };

      service.onSceneAdded = function (id, fn) {
        if (scenes[id]) {
          fn(scenes[id], id);
          return;
        }

        if (!sceneObservers[id]) {
          sceneObservers[id] = [];
        }

        sceneObservers[id].push(fn);
      };

      service.getSceneIds = function (id) {
        var defaultSceneId = Object.keys(scenes)[0] || 0;

        if (Object.prototype.toString.call(id) === '[object Array]') {
          return id;
        }

        return id && id.length ? [id] : [defaultSceneId];
      };

      service.getScene = function (id) {
        id = id || service.getSceneIds(id)[0];

        return scenes[id];
      };

      service.setScene = function (id, scene) {
        scenes[id] = scene;

        if (sceneObservers[id]) {
          notifySceneObservers(id, scene);
        }
      };

      service.destroyScene = function (id) {
        service.controller.removeScene(scenes[id]);

        scenes[id].destroy();

        sceneObservers[id] = sceneObservers[id].filter(function (fn) {
          return fn.persist;
        });

        if (sceneObservers[id].length === 0) {
          delete sceneObservers[id];
        }

        delete scenes[id];
      };

      service.getTargetElement = function($element, targetElement) {
        if (targetElement) {
          if (typeof targetElement === 'string') {
            if (targetElement === 'parent') {
              return $element.parent()[0];
            }
            return $document.querySelector(targetElement);
          }
          return targetElement;
        }
        return $element[0];
      };

      return service;
    }])

    .directive('smScene', ['scrollMagic', 'ScrollMagicService', function (scrollMagic, ScrollMagicService) {
      return {
        restrict: 'AE',
        scope: {
          smScene: '=?',
          sceneId: '=?',
          triggerElement: '=?',
          duration: '=?',
          offset: '=?',
          triggerHook: '=?',
          onEnter: '&?',
          onLeave: '&?',
        },
        bindToController: true,
        controllerAs: 'vm',
        controller: ['$scope', '$element', '$attrs', '$document', '$timeout', function ($scope, $element, $attrs, $document, $timeout) {
          var ctrl = this;

          ctrl.$onInit = function () {
            var scene;

            var sceneId = ScrollMagicService.getSceneIds(ctrl.smScene || ctrl.sceneId || $attrs.smScene)[0];

            if (ScrollMagicService.getScene(sceneId)) {
              ScrollMagicService.destroyScene(sceneId);
            }

            var init = function () {
              var triggerElement = ctrl.triggerElement ? ctrl.triggerElement : $element[0];

              var offset;

              if (typeof ctrl.offset === 'string') {
                offset = triggerElement.clientHeight * (parseFloat(ctrl.offset) / 100);
              }

              if (typeof ctrl.offset === 'number') {
                offset = ctrl.offset;
              }

              if (typeof ctrl.offset === 'function') {
                offset = ctrl.offset();
              }

              if (typeof ctrl.duration === 'function') {
                ctrl.duration = ctrl.duration.bind(null, sceneId, triggerElement, offset, ctrl.triggerHook);
              }

              scene = new ScrollWizardry.Scene({
                triggerElement: triggerElement,
                duration: ctrl.duration !== undefined ? ctrl.duration : 0,
                offset: offset !== undefined ? offset : 0,
                triggerHook: ctrl.triggerHook !== undefined ? ctrl.triggerHook : 0.5,
              });

              if (ctrl.onEnter) {
                scene.on('enter', function (event) {
                  var locals = {
                    $event: event,
                  };
                  $scope.$apply(function () {
                    ctrl.onEnter(locals);
                  });
                });
              }

              if (ctrl.onLeave) {
                scene.on('leave', function (event) {
                  var locals = {
                    $event: event,
                  };
                  $scope.$apply(function () {
                    ctrl.onLeave(locals);
                  });
                });
              }

              if (scrollMagic.addIndicators) {
                scene.addIndicators({
                  name: sceneId,
                });
              }

              scene.addTo(ScrollMagicService.controller);

              ScrollMagicService.setScene(sceneId, scene);
            };

            ctrl.$onDestroy = function () {
              scene.destroy();
            };

            $timeout(init);
          };
        }],
      };
    }])

    .directive('smPin', ['ScrollMagicService', function (ScrollMagicService) {
      return {
        restrict: 'AE',
        scope: {
          smPin: '=?',
          sceneId: '=?',
          targetElement: '=?',
          persist: '=?',
        },
        bindToController: true,
        controllerAs: 'vm',
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
          var ctrl = this;

          ctrl.$onInit = function () {
            var sceneIds = ScrollMagicService.getSceneIds(ctrl.smPin || ctrl.sceneId || $attrs.smPin);

            sceneIds.forEach(function (sceneId) {
              var init = function (scene) {
                scene.setPin(ScrollMagicService.getTargetElement($element, ctrl.targetElement));
              };

              init.persist = !!ctrl.persist;

              ScrollMagicService.onSceneAdded(sceneId, init);
            });
          };
        }],
      };
    }])

    .directive('smClassToggle', ['ScrollMagicService', function (ScrollMagicService) {
      return {
        restrict: 'AE',
        scope: {
          smClassToggle: '=?',
          sceneId: '=?',
          classes: '=?',
          targetElement: '=?',
          persist: '=?',
        },
        bindToController: true,
        controllerAs: 'vm',
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
          var ctrl = this;

          ctrl.$onInit = function () {
            var sceneIds = ScrollMagicService.getSceneIds(ctrl.smClassToggle || ctrl.sceneId || $attrs.smClassToggle);

            sceneIds.forEach(function (sceneId, i) {
              var classes = ctrl.classes;

              if (Object.prototype.toString.call(classes) === '[object Array]') {
                classes = classes[i];
              }

              var init = function (scene) {
                scene.setClassToggle(ScrollMagicService.getTargetElement($element, ctrl.targetElement), classes);
              };

              init.persist = !!ctrl.persist;

              ScrollMagicService.onSceneAdded(sceneId, init);
            });
          };
        }],
      };
    }])

    .directive('smTween', ['ScrollMagicService', function (ScrollMagicService) {
      return {
        restrict: 'AE',
        scope: {
          smTween: '=?',
          sceneId: '=?',
          duration: '=?',
          vars: '=?',
          fromVars: '=?',
          toVars: '=?',
          targetElement: '=?',
          persist: '=?',
        },
        bindToController: true,
        controllerAs: 'vm',
        controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
          var ctrl = this;

          ctrl.$onInit = function () {
            var sceneId = ScrollMagicService.getSceneIds(ctrl.smTween || ctrl.sceneId || $attrs.smTween)[0];

            var duration = ctrl.duration;
            var fromVars = angular.copy(ctrl.fromVars);
            var toVars = angular.copy(ctrl.toVars || ctrl.vars);
            var method = fromVars && toVars ? 'fromTo' : fromVars ? 'from' : 'to';

            var init = function (scene) {
              if (!scene.timeline) {
                scene.timeline = new TimelineMax();
              }

              var tween = TweenMax[method](ScrollMagicService.getTargetElement($element, ctrl.targetElement), duration || 1, fromVars || toVars, toVars);

              scene.timeline.add([tween], 0, 'normal');

              scene.setTween(scene.timeline);
            };

            init.persist = !!ctrl.persist;

            ScrollMagicService.onSceneAdded(sceneId, init);
          };
        }],
      };
    }]);

}());
