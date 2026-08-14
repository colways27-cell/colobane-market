import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 8080;
const DIST_DIR = path.join(process.cwd(), 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

// Security headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)'
};

http.createServer((req, res) => {
  // Decode URL first, then sanitize to prevent path traversal attacks (including %2e%2e encoded sequences)
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const decodedPath = decodeURIComponent(parsedUrl.pathname);
  const sanitizedUrl = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(DIST_DIR, sanitizedUrl === '/' ? 'index.html' : sanitizedUrl);

  // Ensure the resolved path is within DIST_DIR
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(DIST_DIR))) {
    res.writeHead(403, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, SECURITY_HEADERS);
      res.end('Internal Server Error');
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        ...SECURITY_HEADERS
      });
      res.end(content, 'utf-8');
    }
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Static server running at http://localhost:${PORT}/`);
});
