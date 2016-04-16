var fs = require('fs');
var url = require('url');
//todo: route-parser
function api(){
  return function (req, res, next) {
    if (req.url.indexOf('api') > -1){

      var db = JSON.parse(fs.readFileSync('api/db.json', 'utf8'));

      var parsed = url.parse(req.url, true);
      if (db[parsed.pathname]){
        res.writeHead(db[parsed.pathname].code);
        res.write(JSON.stringify(db[parsed.pathname].response));
        res.end();
        console.log('api - response 200');
      } else {
        res.writeHead(404);
        res.end();
        console.log('api - response 404');
      }

    } else {
      next();
    }
  };
}

module.exports = api;
