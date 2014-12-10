var http = require('http'),
    url = require('url'),
    querystring = require('querystring'),
    fs = require('fs'),
    readline = require('readline'),
    crypto = require('crypto'),
    util = require('util');

var keyPath = 'key.txt';
var domain = 'generic-h3t.herokuapp.com'
var key = 'ADAwK9N2qhrpDuRQnD9pRb8DEpLA0o9rIGzOMP0w';

function parseRequest(req) {
  var parsedUrl = url.parse(req.url);
  var path = parsedUrl.pathname;
  console.log("path: " + path);
  if (path == '/') {
    return 'home';
  }
  if (path == '/content') {
    return 'content'
  }
  return '404';
}

function renderHtml(req, res, path, cookie) {
  fs.readFile(path, function (err, data) {
    if (err) {
      console.log(err);
      respond500(req, res);
      return;
    }
    var header = {'Content-Type': 'text/html', 'Content-Length': data.length};
    if (cookie != null) {
      header['Set-Cookie'] = cookie;
    }
    res.writeHead(200, header);
    res.write(data);
    res.end();
  });
  return;
}

function respondHome(req, res) {
  renderHtml(req, res, 'index.html');
}

// TODO (junsuplee): implement token request properly.
function respondContent(req, res) {
  var cookies = parseCookies(req);
  console.log(cookies);
  var message = cookies['HT-Token'];
  if (message) {
    var token = JSON.parse(cipherDecrypt(message));
    if (token.domain != domain || Date.parse(token.expiration) < new Date()) {
      renderHtml(req, res, 'content.html');
      return;
    }
    renderHtml(req, res, 'verify_success.html');
    return;
  } else {
    res.writeHead(301,
      {Location: 'http://h3t.herokuapp.com/redirect'}
    );
    res.end();  
    return;
  }
}

function respond404(req, res) {
  renderHtml(req, res, '404.html');
}

function respond403(req, res) {
  renderHtml(req, res, '403.html');
}

function respond500(req, res) {
  renderHtml(req, res, '500.html');
  return;
  console.log("500");
  res.writeHead(500, {'Content-type': 'text/html'});
  var rs = fs.createReadStream('500.html');
  rs.pipe(res);
}

function parseQuery(req) {
  var parsedUrl = url.parse(req.url);
  var pathName = parsedUrl.pathname;
  var parsedQuery = querystring.parse(parsedUrl.query);
  parsedQuery.domain = parsedQuery.domain.toLowerCase();
  return parsedQuery;
}

function cipherDecrypt(encryptedToken) {

  var algorithm = 'aes-256-cbc';

  var decipher = crypto.createDecipher(algorithm, key);

  var decryptedToken = decipher.update(encryptedToken, 'base64', 'utf8');
  decryptedToken += decipher.final('utf8');

  return decryptedToken;
}

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}


http.createServer(function (req, res) {
  var responses = {
    'content': respondContent,
    'home' : respondHome,
    '404': respond404,
  }
  var requestType = parseRequest(req);
  console.log(requestType);
  responses[requestType](req, res);
  return;

  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(message);
  return;
}).listen(process.env.PORT || 5000);

