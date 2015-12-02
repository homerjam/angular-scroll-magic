angular.module('ExampleApp', ['hj.scrollMagic'])

  .config(['scrollMagicProvider', function (scrollMagicProvider) {

    scrollMagicProvider.addIndicators = true;

  }])

  .controller('ExampleCtrl', ['$scope',
    function ($scope) {
      var vm = this;

      vm.toVars = {
        left: 0,
      };

    }
  ]);
