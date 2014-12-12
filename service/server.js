/*
*   A simple webserver that demonstrates a H3T Service Provider.
*/

// Include necessary libraries.
var http = require('http'),
    url = require('url'),
    querystring = require('querystring'),
    fs = require('fs'),
    readline = require('readline'),
    crypto = require('crypto'),
    util = require('util');

// List of participating website domains and corresponding secret keys.
var domainsPath = 'domains.csv';
// Database of user IDs and passwords.
var usersPath = 'users.csv';
// Database of logs.
var logPath = 'log.csv';

// Declare globals for later use.
var domains = {};
var users = {};

// Load domains.csv.
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

// Load users.csv.
function loadUsers() {
  readline.createInterface({
    input: fs.createReadStream(usersPath),
    output: process.stdout,
    terminal: false
  }).on('line', function (line) {
    data = line.split(',');
    users[data[0]] = {hash: data[1], cookie: data[2]};
  }).on('close', function () {
    return;
  });
}

// Tirivally verify users.
function validateUser(req) {
  return true;
}

// Method for parsing server requests.
function parseRequest(req) {
  var parsedUrl = url.parse(req.url);
  var path = parsedUrl.pathname;
  if (path == '/') {
    return 'home';
  }
  if (path == '/token') {
    return 'token';
  }
  if (path == '/log') {
    return 'log';
  }
  if (path == '/register') {
    return 'register';
  }
  if (path == '/login') {
    return 'login';
  }
  if (path == '/logout') {
    return 'logout';
  }
  return '404';
}

// Method for rendering HTML.
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

// Render index.html.
function respondHome(req, res) {
  renderHtml(req, res, 'index.html');
}

// Response to token requests.
function respondToken(req, res) {

  var tokenRequest = parseQuery(req);
  console.log(tokenRequest);

  var cookie = querystring.parse(req.headers.cookie).id;
  var found = false;
  var user;
  console.log("cookie: " + cookie);
  for (var user_ in users) {
    if (users[user_].cookie == cookie) {
      found = true;
      user = user_;
      break;
    }
  }
  if (!found) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({}));
    return;
  }
  // Generate token and encrypt it.
  var message = makeToken(tokenRequest, user);
  var expiration = new Date();
  expiration.setSeconds(expiration.getSeconds() + 10);
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({
    "message": message,
    "domain": tokenRequest.domain,
    "expiration": expiration.getTime(),
  }));
}

// Output logs.
function respondLog(req, res) {
  if (req.method == 'POST') {
    var body = '';
    req.on('data', function (chunk) {
      body += chunk;
    }).on('end', function () {
      var args = querystring.parse(body);
      var domain = args.domain;
      var count = args.count;
      var output = domain + ',' + count + '\n';
      fs.appendFile(usersPath, output, function (err) {
        console.log(err);
      });
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({}));
    });
  }
  else if (req.method == 'GET') {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end("this page should not be accessed with get");
  }
}

// Response to user registration.
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
        renderHtml(req, res, 'register_failure.html');
        return;
      }
      var cookie = crypto.randomBytes(32).toString('hex');
      users[username] = {hash: hash, cookie: cookie};
      var output = username + ',' + hash + ',' + cookie + '\n';
      fs.appendFile(usersPath, output, function (err) {
        console.log(err);
      });
      renderHtml(req, res, 'register_success.html', ['id=' + cookie]);
    });
  }
}

// Response to user login.
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
        cookie = users[username].cookie;
        console.log("setting cookie to " + cookie);
        renderHtml(req, res, 'login_success.html', ['id=' + cookie]);
        return;
      }
      respond500(req, res);
    });
  }
}

// Response to user logout.
function respondLogout(req, res) {
  renderHtml(req, res, 'logout.html', ['id=']);
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

// Method for parsing queries.
function parseQuery(req) {
  var parsedUrl = url.parse(req.url);
  var pathName = parsedUrl.pathname;
  var parsedQuery = querystring.parse(parsedUrl.query);
  parsedQuery.domain = parsedQuery.domain.toLowerCase();
  return parsedQuery;
}

// Method for generating tokens.
function makeToken(tokenRequest, user) {

  var domain = tokenRequest.domain;
  if (!(domain in domains)) {
    return console.log("ERROR: domain is not supported");
  }
  var expiration = new Date();
  expiration.setMonth(expiration.getMonth() + 1);

  token = {
    'user': user,
    'domain': domain,
    'expiration': expiration,
  }
  return cipherEncrypt(JSON.stringify(token), domain);
}

// Method for encrypting tokens using AES-256.
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

// Main
loadDomains();
loadUsers();

http.createServer(function (req, res) {
  var responses = {
    'home': respondHome,
    'token': respondToken,
    'log': respondLog,
    'register': respondRegister,
    'login': respondLogin,
    'logout': respondLogout,
    '404': respond404,
  }
  var requestType = parseRequest(req);
  responses[requestType](req, res);
  return;

}).listen(process.env.PORT || 5000);

