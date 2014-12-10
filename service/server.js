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
    users[data[0]] = {hash: data[1], cookie: data[2]};
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
  if (path == '/logout') {
    return 'logout';
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
  var message = makeToken(tokenRequest, user);
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({"message": message, "domain": tokenRequest.domain}));
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

function parseQuery(req) {
  var parsedUrl = url.parse(req.url);
  var pathName = parsedUrl.pathname;
  var parsedQuery = querystring.parse(parsedUrl.query);
  parsedQuery.domain = parsedQuery.domain.toLowerCase();
  return parsedQuery;
}

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
    'logout': respondLogout,
    '404': respond404,
  }
  var requestType = parseRequest(req);
  responses[requestType](req, res);
  return;

  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(message);
  return;
  var tokenRequest = parseQuery(req);
  var message = makeToken(tokenRequest);
  message = cipherEncrypt(message, tokenRequest.domain);

}).listen(process.env.PORT || 5000);

