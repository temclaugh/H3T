var http = require('http');
var url = require('url');


function displayRequest(req) {
  console.log(Object.keys(req));
  console.log("*** headers ***");
  console.log(req.headers);
  console.log("*** domain ***");
  console.log(req.domain);
  console.log("*** url ***");
  console.log(req.url);
  console.log("*** method ***");
  console.log(req.method);
}

http.createServer(function (req, res) {
  displayRequest(req);
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');
