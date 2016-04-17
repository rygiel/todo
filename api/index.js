var fs = require('fs');
var url = require('url');
var Route = require('route-parser');
var _ = require('underscore');
var Promise = require('promise');

function api(){

  var db = JSON.parse(fs.readFileSync('api/db.json', 'utf8'));
  _.each(db, function(route,key){
    route.route = new Route(key);
  });

  function findResponse(url){
    var promise = new Promise(function (resolve, reject) {

      var result = {};

      _.each(db, function(route){
        if (route.route.match(url)){
          result = route;
          resolve(result);
        }
      });

      if (_.isEmpty(result)){
        reject();
      }

    });
    return promise;
  }

  return function (req, res, next) {
    var parsedUrl = url.parse(req.url, true);
    findResponse(parsedUrl.pathname).then(function(route){
      res.writeHead(route.code);
      res.write(JSON.stringify(route.response));
      res.end();
      console.log(parsedUrl.pathname+' response: '+route.code);

    }, next);
  };
}

module.exports = api;
