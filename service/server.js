var http = require('http'),
    url = require('url'),
    querystring = require('querystring'),
    fs = require('fs'),
    readline = require('readline'),
    crypto = require('crypto'),
    util = require('util');

var domainsPath = 'domains.csv';
var usersPath = 'users.csv';

var domains = {};
var users = {};

function loadDomains() {
  readline.createInterface({
    input: fs.createReadStream(domainsPath),
    output: process.stdout,
    terminal: false
  }).on('line', function (line) {
    data = line.split(',');
    domains[data[0]] = {key: data[1]};
  }).on('close', function () {
    return;
  });
}

function loadUsers() {
  readline.createInterface({
    input: fs.createReadStream(usersPath),
    output: process.stdout,
    terminal: false
  }).on('line', function (line) {
    data = line.split(',');
    users[data[0]] = {hash: data[1]};
  }).on('close', function () {
    return;
  });
}

function validateUser(req) {
  return true;
}

function parseRequest(req) {
  var parsedUrl = url.parse(req.url);
  var path = parsedUrl.pathname;
  console.log(path);
  if (path == '/') {
    return 'home';
  }
  if (path == '/token') {
    return 'token';
  }
  if (path == '/register') {
    return 'register';
  }
  if (path == '/login') {
    return 'login';
  }
  return '404';
}

function renderHtml(req, res, path) {
  fs.readFile(path, function (err, data) {
    if (err) {
      console.log(err);
      respond500(req, res);
      return;
    }
    res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': data.length});
    res.write(data);
    res.end();
  });
  return;
}

function respondHome(req, res) {
  renderHtml(req, res, 'home.html');
}

function respondToken(req, res) {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end('token');
}

function respondRegister(req, res) {
  if (req.method == 'GET') {
    renderHtml(req, res, 'register.html');
    return;
  }
  if (req.method == 'POST') {
    var body = '';
    req.on('data', function (chunk) {
      body += chunk;
    }).on('end', function () {
      var reg = querystring.parse(body);
      var username = reg.username;
      var password = reg.password;
      var hash = crypto.createHash('md5').update(password).digest('hex');
      if (username in users || username == null || password == null) {
        respond500(req, res);
        return;
      }
      users[username] = hash;
      var output = username + ',' + hash + '\n';
      fs.appendFile(usersPath, output, function (err) {
        console.log(err);
      });
      renderHtml(req, res, 'register_success.html');
    });
  }
}

function respondLogin(req, res) {
  if (req.method == 'GET') {
    renderHtml(req, res, 'login.html');
    return;
  }
  if (req.method == 'POST') {
    var body = '';
    req.on('data', function (chunk) {
      body += chunk;
    }).on('end', function () {
      var reg = querystring.parse(body);
      var username = reg.username;
      var password = reg.password;
      var hash = crypto.createHash('md5').update(password).digest('hex');
      if (username in users && users[username].hash == hash) {
        renderHtml(req, res, 'login_success.html');
        return;
      }
      respond500(req, res);
    });
  }
}

function respond404(req, res) {
  renderHtml(req, res, '404.html');
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

loadDomains();
loadUsers();

http.createServer(function (req, res) {
  var responses = {
    'home': respondHome,
    'token': respondToken,
    'register': respondRegister,
    'login': respondLogin,
    '404': respond404,
  }
  var requestType = parseRequest(req);
  responses[requestType](req, res);
  return;

  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(message);
  return;
  var tokenRequest = parseQuery(req);
  var message = getToken(tokenRequest);
  message = cipherEncrypt(message, tokenRequest.domain);

}).listen(8080, '127.0.0.1');

console.log('Server running at http://127.0.0.1:1337/');
