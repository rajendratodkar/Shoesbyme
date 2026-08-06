import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'subscribers.json');

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function writeDB(data) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/subscribe') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { email } = JSON.parse(body);
        if (!isValidEmail(email)) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid email address' }));
          return;
        }
        const subscribers = readDB();
        const normalized = email.trim().toLowerCase();
        if (subscribers.find(s => s.email === normalized)) {
          res.writeHead(409);
          res.end(JSON.stringify({ error: 'Already subscribed' }));
          return;
        }
        subscribers.push({ email: normalized, subscribedAt: new Date().toISOString() });
        writeDB(subscribers);
        res.writeHead(201);
        res.end(JSON.stringify({ success: true, message: 'Subscribed successfully' }));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/subscribers') {
    const subscribers = readDB();
    res.writeHead(200);
    res.end(JSON.stringify({ count: subscribers.length, subscribers }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Newsletter API running on port ${PORT}`);
});
