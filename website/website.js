var http = require('http'),
    url = require('url'),
    querystring = require('querystring'),
    fs = require('fs'),
    readline = require('readline'),
    crypto = require('crypto'),
    util = require('util');

var usersPath = 'users.csv';
var keyPath = 'key.txt';

var domain = 'google.com'
var users = {};
var user;
var key;

function loadUsers() {
  readline.createInterface({
    input: fs.createReadStream(usersPath),
    output: process.stdout,
    terminal: false
  }).on('line', function (line) {
    data = line.split(',');
    users[data[0]] = {hash: data[1], cookie: data[2], token_expire: Date.parse(data[3])};
  }).on('close', function () {
    return;
  });
}

function loadKey() {
  readline.createInterface({
    input: fs.createReadStream(keyPath),
    output: process.stdout,
    terminal: false
  }).on('line', function (line) {
    key = line;
  }).on('close', function () {
    return;
  });}

function validateUser(req) {
  return true;
}

function parseRequest(req) {
  var parsedUrl = url.parse(req.url);
  var path = parsedUrl.pathname;
  if (path == '/') {
    return 'content';
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

function respondContent(req, res) {
  if (!user) {
    renderHtml(req, res, 'index.html');
    return;
  }
  console.log(user.token_expire);
  console.log(Date.parse(new Date()));
  if (user.token_expire > Date.parse(new Date())) {
    renderHtml(req, res, 'content.html');
    return;
  }
  requestToken(req, res);
}

// TODO (junsuplee): implement token request properly.
function requestToken(req, res) {
  if (req.method == 'GET') {
    renderHtml(req, res, 'verify.html');
    return;
  }
  if (req.method == 'POST') {
    var body = '';
    req.on('data', function (chunk) {
      body += chunk;
    }).on('end', function () {
      var reg = querystring.parse(body);
      var message = reg.token;
      var token = JSON.parse(cipherDecrypt(message));

      if (token.domain != domain || Date.parse(token.expire) > user.token_expire) {
        renderHtml(req, res, 'verify_failure.html');
        return;
      }
      user.token_expire = Date.parse(token.expire);
      // UPDATE user.csv
      renderHtml(req, res, 'verify_success.html', ['id=' + cookie]);
    });
  }
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
      var token_expire = new Date();
      token_expire.setDate(token_expire.getDate() - 1);
      users[username] = {hash: hash, cookie: cookie, token_expire: Date.parse(token_expire)};
      var output = username + ',' + hash + ',' + cookie + ',' + token_expire + '\n';
      fs.appendFile(usersPath, output, function (err) {
        console.log(err);
      });
      user = users[username];
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
        user = users[username];
        renderHtml(req, res, 'login_success.html', ['id=' + cookie]);
        return;
      }
      respond500(req, res);
    });
  }
}

function respondLogout(req, res) {
  user = null;
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

function cipherDecrypt(encryptedToken) {

  var algorithm = 'aes-256-cbc';

  var cipher = crypto.createCipher(algorithm, key);
  var decipher = crypto.createDecipher(algorithm, key);

  var decryptedToken = decipher.update(encryptedToken, 'base64', 'utf8');
  decryptedToken += decipher.final('utf8');

  return decryptedToken;
}

loadKey();
loadUsers();

http.createServer(function (req, res) {
  var responses = {
    'content': respondContent,
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
}).listen(process.env.PORT || 5000);

