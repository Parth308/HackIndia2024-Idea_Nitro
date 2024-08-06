
angular.element(document.body).ready(function () {
    angular.bootstrap(document.body, ['app'])
});

angular
    .module('app', [
        'ngRoute'
    ])
    .component('app', {
        templateUrl: 'app.html'
    })
    .config(routeConfig)
    .run(run);
