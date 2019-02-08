var app = angular.module('BeerApp', []);

app.constant('API_BASE', 'https://api.punkapi.com/v2/');

app.controller('MainCtrl', function ($scope, Beer, Utils) {

  $scope.getRandomBeer = function () {
    Beer.getRandomBeer(function (err, beer) {
      if(err){
        console.log("err : ", err);
      }
      $scope.beer = beer;
    });
  }

  $scope.getRandomBeer();
  $scope.getNonAlcoholicBeer = function () {
    var filter = {};
    filter.where = {
      abv_lt : 5
    };

    Beer.get(filter, function (err, nonAlcoholicBeers) {
        $scope.beer = Utils.getRandomArrItem(nonAlcoholicBeers);
    });
  }

  $scope.search = function (query, searchIn) {
    Beer.search(query, searchIn, function (err, searchResults) {
      $scope.searchResults = searchResults;
    });
  }

  $scope.clearSearch = function () {
    $scope.searchResults = null;
  }

});

app.service('Beer', function ($http, API_BASE, Utils) {

  this.getRandomBeer = function (cb) {
    var resourceUrl = 'beers';
    Utils.makeHttpReq({url : resourceUrl}, function (err, data) {
      cb(err, Utils.getRandomArrItem(data));
    })
  }

  this.get = function (filter, cb) {
    var resourceUrl = "beers";

    if(Utils.objectExists(filter)){
      if(Utils.objectExists(filter.where)){
        var where = filter.where;
        for(key in where){
          resourceUrl += "?"+key+"="+where[key]+"&";
        }
      }
    }

    if(resourceUrl[resourceUrl.length-1] === '&') resourceUrl =resourceUrl.substring(0, resourceUrl.length-1);

    Utils.makeHttpReq({url : resourceUrl}, function (err, data) {
      cb(err, data);
    })
  }

  this.search = function (query, searchIn, cb) {
    var resourceUrl = 'beers'
    Utils.makeHttpReq({url : resourceUrl}, function (err, data) {
      var searchResults = Utils.searchInObjArr(data, searchIn, query);
      cb(err, searchResults);
    })
  }
})

app.service('CacheStore', function () {
  var cacheMap = {};
  this.get = function (url) {
    return cacheMap[url];
  }

  this.put = function (url, data) {
    cacheMap[url] = data;
  }
})

app.factory('Utils', function ($http, $timeout, API_BASE, CacheStore) {
  return {
    objectExists : function (obj) {
      return obj && Object.prototype.toString.call(obj) === "[object Object]"
    },

    getRandomArrItem : function (arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },

    searchInObjArr : function (arr, key, val) {
      var regex = new RegExp(".*"+val+".*","gi");
      return arr.filter(function (item) {
        return item[key].match(regex);
      });
    },

    makeHttpReq : function (options, cb) {
      if(CacheStore.get(options.url)){
        $timeout(function () {
          cb(null, CacheStore.get(options.url));
        },0)
      } else{
        var opts = {};
        opts.method = options.method || 'GET';
        opts.url = API_BASE + (options.url || "");
        if(opts.url.indexOf('?') === -1) opts.url += "?";
        opts.url += "&";
        opts.url += "page=1&per_page=80"
        if(opts.method !== 'GET' ){
          if(options.body){
            opts.body = options.body;
          }
        }
        if(options.headers){
          opts.headers = options.headers;
        }

        $http(opts).then(function (results) {
          CacheStore.put(options.url, results.data);
          cb(null, results.data);
        }, function (err) {
          cb(err);
        })
      }

    }
  }
})
