const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function readBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 50 * 1024 * 1024) { // 50MB max
      req.connection.destroy();
    }
  });
  req.on('end', () => {
    try {
      callback(null, body ? JSON.parse(body) : {});
    } catch (e) {
      callback(e);
    }
  });
}

const server = http.createServer((req, res) => {
  const urlParts = req.url.split('?');
  const pathname = decodeURI(urlParts[0]);

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === '/api/content' && req.method === 'GET') {
    const dataPath = path.join(__dirname, 'data', 'content.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
    return;
  }

  if (pathname === '/api/save-content' && req.method === 'POST') {
    readBody(req, (err, data) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }
      const dataPath = path.join(__dirname, 'data', 'content.json');
      fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Content saved successfully' }));
      });
    });
    return;
  }

  if (pathname === '/api/images' && req.method === 'GET') {
    const imagesDir = path.join(__dirname, 'images');
    fs.readdir(imagesDir, (err, files) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      const imageFiles = files.filter(f => /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(f));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ images: imageFiles }));
    });
    return;
  }

  if (pathname === '/api/upload-image' && req.method === 'POST') {
    readBody(req, (err, body) => {
      if (err || !body.filename || !body.base64) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing filename or base64 data' }));
        return;
      }
      const safeFilename = path.basename(body.filename).replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetPath = path.join(__dirname, 'images', safeFilename);
      const base64Data = body.base64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      fs.writeFile(targetPath, buffer, (err) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, filename: safeFilename, path: 'images/' + safeFilename }));
      });
    });
    return;
  }

  if (pathname === '/api/git-push' && req.method === 'POST') {
    readBody(req, (err, body) => {
      const msg = (body && body.message) ? body.message.replace(/"/g, '\\"') : 'Update from Admin Panel';
      exec(`git add -A && git commit -m "${msg}" && git push origin main`, { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message, stderr }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, stdout }));
      });
    });
    return;
  }

  // Static File Serving
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(__dirname, safePath === '/' ? 'index.html' : safePath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        }
      } else {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}/`);
});
