import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const host = '127.0.0.1';
const port = Number(process.env.PORT || 8787);
const webRoot = path.resolve(process.env.WEB_ROOT || path.dirname(fileURLToPath(import.meta.url)));
const settingsFile = process.env.SITE_SETTINGS_FILE || '/var/lib/cloxin/site-settings.json';
const viewsFile = process.env.VIEW_COUNT_FILE || '/var/lib/cloxin/views.json';
const sessionMaxAgeMs = 8 * 60 * 60 * 1000;
const bodyLimit = 32 * 1024;
const sessions = new Map();
const loginAttempts = new Map();
const allowedIcons = new Set(['discord', 'github', 'instagram', 'tiktok', 'twitter', 'youtube', 'link']);
const blockedPublicFiles = new Set(['admin.html', 'cloxin-site.service.example', 'nginx.conf.example', 'server.mjs', 'VPS-SETUP.md']);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const defaults = {
  profileId: '1368780659484528702',
  displayName: '',
  bio: '',
  avatarUrl: '',
  musicUrl: 'music.mp3',
  volume: 30,
  colors: {
    background: '#4b4b4b',
    card: '#3b3b3b',
    button: '#333333',
    border: '#626262',
    text: '#f4f5f7',
    muted: '#d0d0d0',
    accent: '#a0a0a0'
  },
  socials: [
    { iconKey: 'discord', label: 'discord', url: 'https://discord.com/users/1368780659484528702', enabled: true },
    { iconKey: 'github', label: 'github', url: 'https://github.com/cloxinunbeaten', enabled: true },
    { iconKey: 'tiktok', label: 'tiktok', url: 'https://tiktok.com/@clxnunbetaen', enabled: true },
    { iconKey: 'instagram', label: 'instagram', url: 'https://www.instagram.com/cloxingood?stkn=MXdtaWQ2cWZzaHFscA==', enabled: true }
  ]
};

let settings = structuredClone(defaults);
let viewCount = 0;
let viewsWriteQueue = Promise.resolve();

function sendJson(response, status, payload, extraHeaders = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders
  });
  response.end(JSON.stringify(payload));
}

function safeText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function safeHttpsUrl(value) {
  const result = safeText(value, 500);
  if (!result) return '';
  try {
    const url = new URL(result);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

function safeMusicUrl(value) {
  const result = safeText(value, 500);
  const safeRelativePath = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[a-z\d._/-]+$/i.test(result);
  if (safeRelativePath || (result.startsWith('/') && !result.startsWith('//'))) return result;
  return safeHttpsUrl(result);
}

function normalizeSettings(input = {}) {
  const colors = input.colors && typeof input.colors === 'object' ? input.colors : {};
  const links = Array.isArray(input.socials) ? input.socials.slice(0, 12) : defaults.socials;

  return {
    profileId: /^\d{17,20}$/.test(input.profileId || '') ? input.profileId : defaults.profileId,
    displayName: safeText(input.displayName, 60),
    bio: safeText(input.bio, 600),
    avatarUrl: safeHttpsUrl(input.avatarUrl),
    musicUrl: safeMusicUrl(input.musicUrl || defaults.musicUrl) || defaults.musicUrl,
    volume: Number.isFinite(Number(input.volume)) ? Math.min(100, Math.max(0, Math.round(Number(input.volume)))) : defaults.volume,
    colors: Object.fromEntries(Object.entries(defaults.colors).map(([key, fallback]) => [
      key,
      /^#[\da-f]{6}$/i.test(colors[key] || '') ? colors[key] : fallback
    ])),
    socials: links.map(link => ({
      iconKey: allowedIcons.has(link?.iconKey) ? link.iconKey : 'link',
      label: safeText(link?.label, 24) || 'link',
      url: safeHttpsUrl(link?.url),
      enabled: Boolean(link?.enabled)
    })).filter(link => link.url)
  };
}

function digest(value) {
  return createHash('sha256').update(value).digest();
}

function passwordMatches(value) {
  const expected = process.env.ADMIN_PASSWORD || '';
  return timingSafeEqual(digest(value), digest(expected)) && expected.length > 0;
}

function requestIp(request) {
  return request.headers['x-real-ip'] || request.socket.remoteAddress || 'unknown';
}

function sameOrigin(request) {
  const origin = request.headers.origin;
  const requestHost = request.headers['x-forwarded-host'] || request.headers.host;
  if (!origin || !requestHost) return false;
  try {
    return new URL(origin).host === requestHost;
  } catch {
    return false;
  }
}

async function readJson(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > bodyLimit) throw new Error('Request body too large');
  }
  return JSON.parse(body || '{}');
}

function sessionToken(request) {
  const cookieHeader = request.headers.cookie || '';
  const sessionCookie = cookieHeader.split(';').map(item => item.trim()).find(item => item.startsWith('cloxin_admin_session='));
  return sessionCookie?.slice('cloxin_admin_session='.length) || '';
}

function hasSession(request) {
  const token = sessionToken(request);
  const expiresAt = sessions.get(token);
  if (!token || !expiresAt) return false;
  if (expiresAt <= Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function cookieHeader(request, token, maxAge) {
  const secure = request.headers['x-forwarded-proto'] === 'https' || request.socket.encrypted;
  return `cloxin_admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

async function serveStatic(request, response, pathname) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;

  let relativePath;
  try {
    relativePath = pathname === '/' ? 'index.html' : pathname === '/admin' ? 'admin.html' : decodeURIComponent(pathname).slice(1);
  } catch {
    sendJson(response, 400, { error: 'Invalid path' });
    return true;
  }

  if (blockedPublicFiles.has(relativePath) && pathname !== '/admin') {
    sendJson(response, 404, { error: 'Not found' });
    return true;
  }

  const filePath = path.resolve(webRoot, relativePath);
  if (!filePath.startsWith(`${webRoot}${path.sep}`) || relativePath.split(/[\\/]/).some(part => part.startsWith('.'))) {
    sendJson(response, 404, { error: 'Not found' });
    return true;
  }

  try {
    const contents = await fs.readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': filePath.endsWith('.html') ? 'no-store' : 'no-cache',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(request.method === 'HEAD' ? undefined : contents);
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw error;
    sendJson(response, 404, { error: 'Not found' });
  }
  return true;
}

async function saveSettings(nextSettings) {
  const normalized = normalizeSettings(nextSettings);
  await fs.mkdir(path.dirname(settingsFile), { recursive: true });
  const temporaryFile = `${settingsFile}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(normalized, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temporaryFile, settingsFile);
  settings = normalized;
}

async function persistViews() {
  const currentCount = viewCount;
  viewsWriteQueue = viewsWriteQueue.catch(() => {}).then(async () => {
    await fs.mkdir(path.dirname(viewsFile), { recursive: true });
    const temporaryFile = `${viewsFile}.tmp`;
    await fs.writeFile(temporaryFile, `${JSON.stringify({ views: currentCount })}\n`, { mode: 0o600 });
    await fs.rename(temporaryFile, viewsFile);
  });
  return viewsWriteQueue;
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url, 'http://localhost');

  if (request.method === 'GET' && requestUrl.pathname === '/api/profile') {
    sendJson(response, 200, settings);
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/views') {
    viewCount += 1;
    try {
      await persistViews();
    } catch (error) {
      console.error('View count could not be saved:', error.message);
    }
    sendJson(response, 200, { views: viewCount });
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/admin/session') {
    sendJson(response, hasSession(request) ? 200 : 401, { authenticated: hasSession(request) });
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/admin/login') {
    if (!sameOrigin(request)) {
      sendJson(response, 403, { error: 'Origin not allowed' });
      return;
    }
    if (!process.env.ADMIN_PASSWORD) {
      sendJson(response, 503, { error: 'Admin password is not configured' });
      return;
    }

    const ip = requestIp(request);
    const attempt = loginAttempts.get(ip) || { count: 0, expiresAt: 0 };
    if (attempt.expiresAt > Date.now() && attempt.count >= 5) {
      sendJson(response, 429, { error: 'Too many login attempts' });
      return;
    }

    let body;
    try {
      body = await readJson(request);
    } catch {
      sendJson(response, 400, { error: 'Invalid request body' });
      return;
    }

    if (!passwordMatches(typeof body.password === 'string' ? body.password : '')) {
      const nextAttempt = attempt.expiresAt > Date.now() ? attempt : { count: 0, expiresAt: Date.now() + 15 * 60 * 1000 };
      nextAttempt.count += 1;
      loginAttempts.set(ip, nextAttempt);
      sendJson(response, 401, { error: 'Invalid password' });
      return;
    }

    loginAttempts.delete(ip);
    const token = randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + sessionMaxAgeMs);
    sendJson(response, 200, { authenticated: true }, { 'Set-Cookie': cookieHeader(request, token, sessionMaxAgeMs / 1000) });
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/admin/logout') {
    if (!sameOrigin(request)) {
      sendJson(response, 403, { error: 'Origin not allowed' });
      return;
    }
    sessions.delete(sessionToken(request));
    sendJson(response, 200, { authenticated: false }, { 'Set-Cookie': cookieHeader(request, '', 0) });
    return;
  }

  if (requestUrl.pathname === '/api/admin/settings') {
    if (!hasSession(request)) {
      sendJson(response, 401, { error: 'Authentication required' });
      return;
    }
    if (request.method === 'GET') {
      sendJson(response, 200, settings);
      return;
    }
    if (request.method === 'PUT') {
      if (!sameOrigin(request)) {
        sendJson(response, 403, { error: 'Origin not allowed' });
        return;
      }
      let body;
      try {
        body = await readJson(request);
      } catch {
        sendJson(response, 400, { error: 'Invalid request body' });
        return;
      }
      try {
        await saveSettings(body);
        sendJson(response, 200, { settings });
      } catch (error) {
        console.error('Profile settings could not be saved:', error.message);
        sendJson(response, 500, { error: 'Settings could not be saved' });
      }
      return;
    }
  }

  if (await serveStatic(request, response, requestUrl.pathname)) return;
  sendJson(response, 404, { error: 'Not found' });
}

async function start() {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD must be configured before starting the admin API');
  }
  try {
    settings = normalizeSettings(JSON.parse(await fs.readFile(settingsFile, 'utf8')));
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Using default profile settings:', error.message);
    settings = structuredClone(defaults);
  }
  try {
    const savedViews = JSON.parse(await fs.readFile(viewsFile, 'utf8')).views;
    if (Number.isSafeInteger(savedViews) && savedViews >= 0) viewCount = savedViews;
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Starting view count at zero:', error.message);
  }

  const server = http.createServer((request, response) => {
    handleRequest(request, response).catch(error => {
      console.error('Request failed:', error.message);
      if (!response.headersSent) sendJson(response, 500, { error: 'Internal server error' });
      else response.destroy();
    });
  });
  server.listen(port, host, () => console.log(`Cloxin admin API listening on ${host}:${port}`));
}

start().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});