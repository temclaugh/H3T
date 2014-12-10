var http = require('http'),
    url = require('url'),
    querystring = require('querystring'),
    fs = require('fs'),
    readline = require('readline');
    crypto = require('crypto');

var domains = {};

function initDomains() {
  var domainPath = 'domains.txt';

  readline.createInterface({
    input: fs.createReadStream(domainPath),
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
  console.log(req.headers.cookie);
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

  parsedQuery.domain = parsedQuery.domain.toLowerCase();
  return parsedQuery;
}

function getToken(tokenRequest) {

  var domain = tokenRequest.domain;
  if (!(domain in domains)) {
    return console.log("ERROR: domain is not supported");
  }

  var expiration = new Date();
  expiration.setMonth(expiration.getMonth() + 1);

  token = {
    'user': 1,
    'domain': domain,
    'expiration': expiration,
  }
  return JSON.stringify(token);
}

initDomains();

http.createServer(function (req, res) {
  var tokenRequest = parseRequest(req);
  var token = getToken(tokenRequest);
  console.log(token);

  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(1337, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');
