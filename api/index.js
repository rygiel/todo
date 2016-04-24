var fs = require('fs');
var url = require('url');
var Route = require('route-parser');
var _ = require('underscore');
var Promise = require('promise');
var qs = require('querystring');

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

          if (route.collection){
            result = db[route.collection];
          } else {
            result = route;
          }


          resolve({
            route: result,
            pathParams: route.route.match(url)
          });

        }
      });
      if (_.isEmpty(result)){
        reject();
      }
    });
    return promise;
  }

  function doAction(route, pathParams, action, req, res){

    var actions = {
      'POST': function(){

        var body = '';
        req.on('data', function (data) {
          body += data;
        });
        req.on('end', function () {

          var max = _.max(route.response, function(item){ return item.id });
          var maxId = +max.id + 1;
          var newItem = JSON.parse(body);
          newItem['id'] = maxId;
          route.response.push(newItem);
          res.writeHead(200);
          res.write(JSON.stringify(route.response));
          res.end();

        });

      },
      'PUT': function(){

        var body = '';
        req.on('data', function (data) {
          body += data;
        });
        req.on('end', function () {
          if (index>-1){
            var found = _.where(route.response, {id: pathParams.id});
            var index = route.response.indexOf(found[0]);
            route.response[index] = JSON.parse(body);
            res.writeHead(200);
            res.write(JSON.stringify(route.response));
          } else {
            res.writeHead(404);
            res.end();
          }

        });
      },

      'DELETE': function(){
        var found = _.where(route.response, {id: pathParams.id});
        var index = route.response.indexOf(found[0]);
        if (index>-1){
          route.response.splice(index,1);
          res.writeHead(200);
        } else {
          res.writeHead(404);
        }
        res.end();
      },

      'default': function(){

        if (_.isEmpty(pathParams)){

          res.writeHead(route.code);
          res.write(JSON.stringify(route.response));
          res.end();
        } else {

          var found = _.where(route.response, {id: pathParams.id});
          if (!found.length){
            res.writeHead(404);
          } else {
            res.writeHead(route.code);
            res.write(JSON.stringify(found[0]));
          }
          res.end();


        }
      }
    };

    if (actions[action]){
      actions[action]();
    } else {
      actions['default']();
    }

  }

  return function (req, res, next) {
    var parsedUrl = url.parse(req.url, true);
    findResponse(parsedUrl.pathname).then(function(response){
      doAction(response.route, response.pathParams, req.method, req, res);
      console.log(parsedUrl.pathname+' '+req.method+' response: '+route.code);
    }, next);
  };
}

module.exports = api;
