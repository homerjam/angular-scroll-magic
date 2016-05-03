(function () {
  angular.module('hj.scrollMagic', [])

    .provider('scrollMagic', function () {
      var self = this;

      self.addIndicators = false;

      self.$get = ['$rootScope', function ($rootScope) {
        return {
          addIndicators: self.addIndicators,
        };
      }];
    })

    .service('ScrollMagicService', ['scrollMagic', function (scrollMagic) {
      var service = {};

      service.controller = new ScrollMagic.Controller();

      var scenes = {};
      var sceneObservers = {};

      var notifySceneObservers = function (id) {
        var args = Array.prototype.slice.call(arguments, 1);

        sceneObservers[id].forEach(function (fn, i, arr) {
          arr.splice(i, 1)[0].apply(null, args);
        });
      };

      service.onSceneAdded = function (id, fn) {
        if (scenes[id]) {
          fn(scenes[id]);
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
        scenes[id].destroy();

        delete sceneObservers[id];
        delete scenes[id];
      };

      return service;
    }])

    .directive('smScene', ['$document', '$timeout', 'scrollMagic', 'ScrollMagicService', function ($document, $timeout, scrollMagic, ScrollMagicService) {
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          var sceneId = ScrollMagicService.getSceneIds(attrs.smScene)[0];

          if (ScrollMagicService.getScene(sceneId)) {
            return;
          }

          var init = function () {
            var triggerElement = attrs.triggerElement ? scope.$eval(attrs.triggerElement) : element[0];
            var duration = attrs.duration && attrs.duration.indexOf('%') !== -1 ? attrs.duration : scope.$eval(attrs.duration);
            var offset = attrs.offset && attrs.offset.indexOf('%') !== -1
              ? triggerElement ? triggerElement.clientHeight * (parseFloat(attrs.offset) / 100) : $document.scrollHeight
              : scope.$eval(attrs.offset);
            var triggerHook = scope.$eval(attrs.triggerHook);

            if (typeof duration === 'function') {
              duration = duration.bind(null, sceneId, triggerElement, offset, triggerHook);
            }

            var scene = new ScrollMagic.Scene({
              triggerElement: triggerElement,
              duration: duration !== undefined ? duration : 0,
              offset: offset !== undefined ? offset : 0,
              triggerHook: triggerHook !== undefined ? triggerHook : 0.5,
            });

            if (scrollMagic.addIndicators) {
              scene.addIndicators({
                name: sceneId,
              });
            }

            scene.addTo(ScrollMagicService.controller);

            ScrollMagicService.setScene(sceneId, scene);
          };

          $timeout(init);

          scope.$on('$destroy', function () {
            ScrollMagicService.destroyScene(sceneId);
          });
        },
      };
    }])

    .directive('smPin', ['ScrollMagicService', function (ScrollMagicService) {
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          var sceneIds = ScrollMagicService.getSceneIds(scope.$eval(attrs.smPin) || attrs.smPin);

          sceneIds.forEach(function (sceneId) {
            var init = function (scene) {
              scene.setPin(element[0]);
            };

            ScrollMagicService.onSceneAdded(sceneId, init);
          });
        },
      };
    }])

    .directive('smClassToggle', ['ScrollMagicService', function (ScrollMagicService) {
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          var sceneIds = ScrollMagicService.getSceneIds(scope.$eval(attrs.smClassToggle) || attrs.smClassToggle);

          sceneIds.forEach(function (sceneId, i) {
            var classes = scope.$eval(attrs.classes) || attrs.classes;

            if (Object.prototype.toString.call(classes) === '[object Array]') {
              classes = classes[i];
            }

            var init = function (scene) {
              scene.setClassToggle(element[0], classes);
            };

            ScrollMagicService.onSceneAdded(sceneId, init);
          });
        },
      };
    }])

    .directive('smTween', ['ScrollMagicService', function (ScrollMagicService) {
      return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          var sceneId = ScrollMagicService.getSceneIds(attrs.smTween)[0];

          var duration = scope.$eval(attrs.duration);
          var fromVars = scope.$eval(attrs.fromVars);
          var toVars = scope.$eval(attrs.toVars || attrs.vars);

          var method = fromVars && toVars ? 'fromTo' : fromVars ? 'from' : 'to';

          var tween = TweenMax[method](element[0], duration || 1, fromVars || toVars, toVars);

          var init = function (scene) {
            if (!scene.timeline) {
              scene.timeline = new TimelineMax();
            }

            scene.timeline.add([tween], 'normal');

            scene.setTween(scene.timeline);
          };

          ScrollMagicService.onSceneAdded(sceneId, init);
        },
      };
    }]);

})();
