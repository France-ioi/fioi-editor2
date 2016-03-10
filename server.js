var fs = require('fs');
var path = require('path');
var http2 = require('http2');
var URL = require('url-parse');

function onRequest (request, response) {
  var url = new URL(request.url);
  var filename = path.join(__dirname, url.pathname);

  // Reading file from disk if it exists and is safe.
  if (filename.indexOf(__dirname) !== 0) {
    response.writeHead(403);
    response.end();
    return;
  }
  if (!fs.existsSync(filename)) {
    response.writeHead(404);
    response.end();
    return;
  }
  if (!fs.statSync(filename).isFile()) {
    response.writeHead(403);
    response.end();
    return;
  }

  var contentType;
  if (/.html$/.test(request.url))
    contentType = 'text/html';
  else if (/.js$/.test(request.url))
    contentType = 'application/javascript';
  else if (/.css$/.test(request.url))
    contentType = 'text/css';
  else
    contentType = 'application/octet-stream';
  response.writeHead(200, 'OK', {
    'Content-Type': contentType
  });
  var fileStream = fs.createReadStream(filename);
  fileStream.pipe(response);
  fileStream.on('finish', response.end);
}

// Creating the server in plain or TLS mode (TLS mode is the default)
var server;
server = http2.createServer({
  key: fs.readFileSync(path.join(__dirname, '/server.key')),
  cert: fs.readFileSync(path.join(__dirname, '/server.crt'))
}, onRequest);
server.listen(process.env.HTTP2_PORT || 8000);
