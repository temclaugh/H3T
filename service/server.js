var http = require('http'),
    url = require('url'),
    querystring = require('querystring'),
    fs = require('fs'),
    readline = require('readline');

var domains = {};

function getDomains() {
  readline.createInterface({
    input: fs.createReadStream('domains.txt'),
    output: process.stdout,
    terminal: false
  }).on('line', function (line) {
    domains[line] = {};
  }).on('close', function () {
    console.log(domains);
  });
}

function displayRequest(req) {
  var u = url.parse('h3t' + req.url);
  console.log(Object.keys(req));
  console.log('*** headers ***');
  console.log(req.headers);
  console.log('*** domain ***');
  console.log(req.domain);
  console.log('*** url ***');
  console.log(req.url);
  console.log('*** method ***');
  console.log(req.method);
  console.log(u);
}

function parseRequest(req) {
  var parsedUrl = url.parse(req.url);

  var pathName = parsedUrl.pathname;
  if (pathName != '/get_token') {
    console.log('ERROR: token not requested');
  }

  var parsedQuery = querystring.parse(parsedUrl.query);
  if (!('domain' in parsedQuery)) {
    console.log('ERROR: no domain specified');
  }
  var domain = parsedQuery
  console.log(parsedQuery);
}

getDomains();

http.createServer(function (req, res) {
  displayRequest(req);
  parseRequest(req);
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');
