var http = require('http'),
    url = require('url'),
    querystring = require('querystring'),
    fs = require('fs'),
    readline = require('readline'),
    crypto = require('crypto'),
    util = require('util');

var domains = {};

function initDomains() {
  var domainPath = 'domains.csv';

  readline.createInterface({
    input: fs.createReadStream(domainPath),
    output: process.stdout,
    terminal: false
  }).on('line', function (line) {
    data = line.split(',');
    domains[data[0]] = {key: data[1]};
  }).on('close', function () {
    return;
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


function validateUser(req) {
  return true;
}

function parseRequest(req) {
  var parsedUrl = url.parse(req.url);
  var path = parsedUrl.pathname;
  console.log(path);
  if (path == '/token') {
    return 'token';
  }
  if (path == '/register') {
    return 'register';
  }
  if (path == '/login') {
    return 'login';
  }
  return null;

}

function error404(res) {
  console.log("error");
  res.writeHead(404, {'content-type': 'text/html'});
  var rs = fs.createReadStream('404.html');
  rs.pipe(res);
}

function parseQuery(req) {

  var parsedUrl = url.parse(req.url);
  var pathName = parsedUrl.pathname;
  if (pathName == '/token') {
    var parsedQuery = querystring.parse(parsedUrl.query);
    if (!('domain' in parsedQuery)) {
      return console.log('ERROR: no domain specified');
    }

    parsedQuery.domain = parsedQuery.domain.toLowerCase();
    return parsedQuery;
  }
  if (pathName == '/register') {
    return console.log('ERROR: token not requested');
  }

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

function cipherEncrypt(token, domain) {

  var algorithm = 'aes-256-cbc';
  key = domains[domain].key;

  var cipher = crypto.createCipher(algorithm, key);
  var decipher = crypto.createDecipher(algorithm, key);

  var encryptedToken = cipher.update(token, 'utf8', 'base64');
  encryptedToken += cipher.final('base64');

  var decryptedToken = decipher.update(encryptedToken, 'base64', 'utf8');
  decryptedToken += decipher.final('utf8');

  return encryptedToken;

}

initDomains();

http.createServer(function (req, res) {

  var requestType = parseRequest(req);
  if (requestType == null) {
    error404(res);
    return;
  }
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(message);
  return;
  var tokenRequest = parseQuery(req);
  var message = getToken(tokenRequest);
  message = cipherEncrypt(message, tokenRequest.domain);

}).listen(8080, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');
