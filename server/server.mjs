import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const host = '127.0.0.1';
const port = Number(process.env.PORT || 8787);
const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(process.env.WEB_ROOT || path.join(serverDirectory, '..', 'public'));
const adminFile = path.join(serverDirectory, 'admin.html');
const legacyAliases = { 'music.mp3': 'assets/music.mp3' };
const settingsFile = process.env.SITE_SETTINGS_FILE || '/var/lib/cloxin/site-settings.json';
const viewsFile = process.env.VIEW_COUNT_FILE || '/var/lib/cloxin/views.json';
const uploadsDirectory = path.join(path.dirname(settingsFile), 'uploads');
const uploadedMusicFile = path.join(uploadsDirectory, 'background.mp3');
const sessionMaxAgeMs = 8 * 60 * 60 * 1000;
const bodyLimit = 32 * 1024;
const musicUploadLimit = 20 * 1024 * 1024;
const sessions = new Map();
const loginAttempts = new Map();
const allowedIcons = new Set(['discord', 'github', 'instagram', 'tiktok', 'twitter', 'youtube', 'link']);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

async function streamMedia(request, response, filePath, contentType) {
  const stat = await fs.stat(filePath);
  if (!stat.isFile()) {
    const error = new Error('Not a file');
    error.code = 'EISDIR';
    throw error;
  }
  const size = stat.size;
  const headers = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400',
    'X-Content-Type-Options': 'nosniff'
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range || '');
  let start = 0;
  let end = size - 1;
  let status = 200;
  if (range && (range[1] || range[2])) {
    if (range[1]) {
      start = Number(range[1]);
      if (range[2]) end = Math.min(Number(range[2]), size - 1);
    } else {
      start = Math.max(size - Number(range[2]), 0);
    }
    if (start > end || start >= size) {
      response.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` });
      response.end();
      return;
    }
    status = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  }
  headers['Content-Length'] = end - start + 1;
  response.writeHead(status, headers);
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  const stream = createReadStream(filePath, { start, end });
  stream.on('error', () => response.destroy());
  response.on('close', () => stream.destroy());
  stream.pipe(response);
}

const defaults = {
  profileId: '1368780659484528702',
  displayName: '',
  bio: '',
  avatarUrl: '',
  musicUrl: 'assets/music.mp3',
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
const countedViewers = new Set();
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

async function readMp3Upload(request) {
  const fileName = decodeURIComponent(request.headers['x-file-name'] || '');
  const contentType = (request.headers['content-type'] || '').split(';')[0].toLowerCase();
  if (!fileName.toLowerCase().endsWith('.mp3') || !['audio/mpeg', 'application/octet-stream'].includes(contentType)) {
    throw Object.assign(new Error('Only MP3 files are accepted'), { status: 415 });
  }

  const chunks = [];
  let bytesRead = 0;
  for await (const chunk of request) {
    bytesRead += chunk.length;
    if (bytesRead > musicUploadLimit) {
      throw Object.assign(new Error('MP3 exceeds 20 MB'), { status: 413 });
    }
    chunks.push(chunk);
  }

  const file = Buffer.concat(chunks);
  const hasId3Header = file.subarray(0, 3).toString('ascii') === 'ID3';
  const hasMpegFrame = file[0] === 0xff && (file[1] & 0xe0) === 0xe0;
  if (!file.length || (!hasId3Header && !hasMpegFrame)) {
    throw Object.assign(new Error('File is not a valid MP3'), { status: 415 });
  }
  return file;
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
    relativePath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).slice(1);
  } catch {
    sendJson(response, 400, { error: 'Invalid path' });
    return true;
  }

  const isAdmin = pathname === '/admin';
  const isUploadedMusic = pathname === '/uploads/background.mp3';
  const filePath = isAdmin ? adminFile : isUploadedMusic ? uploadedMusicFile : path.resolve(webRoot, legacyAliases[relativePath] || relativePath);
  if (!isAdmin && !isUploadedMusic && (!filePath.startsWith(`${webRoot}${path.sep}`) || relativePath.split(/[\\/]/).some(part => part.startsWith('.')))) {
    sendJson(response, 404, { error: 'Not found' });
    return true;
  }

  try {
    const extension = path.extname(filePath).toLowerCase();
    if (extension === '.mp4' || extension === '.webm') {
      await streamMedia(request, response, filePath, contentTypes[extension]);
      return true;
    }
    const contents = await fs.readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': filePath.endsWith('.html') || isUploadedMusic ? 'no-store' : 'no-cache',
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
  viewsWriteQueue = viewsWriteQueue.catch(() => {}).then(async () => {
    await fs.mkdir(path.dirname(viewsFile), { recursive: true });
    const temporaryFile = `${viewsFile}.tmp`;
    const state = { views: viewCount, visitors: [...countedViewers] };
    await fs.writeFile(temporaryFile, `${JSON.stringify(state)}\n`, { mode: 0o600 });
    await fs.rename(temporaryFile, viewsFile);
  });
  return viewsWriteQueue;
}

function viewVisitorKey(request, visitorId) {
  const validVisitorId = typeof visitorId === 'string' && /^[\da-f-]{36}$/i.test(visitorId);
  const identity = validVisitorId
    ? `browser:${visitorId.toLowerCase()}`
    : `network:${requestIp(request)}|${request.headers['user-agent'] || ''}`;
  return createHash('sha256').update(identity).digest('hex');
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url, 'http://localhost');

  if (request.method === 'GET' && requestUrl.pathname === '/api/profile') {
    sendJson(response, 200, settings);
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/views') {
    let body = {};
    try {
      body = await readJson(request);
    } catch {
      body = {};
    }

    const visitorKey = viewVisitorKey(request, body.visitorId);
    if (!countedViewers.has(visitorKey)) {
      countedViewers.add(visitorKey);
      viewCount += 1;
      try {
        await persistViews();
      } catch (error) {
        console.error('View count could not be saved:', error.message);
      }
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

  if (request.method === 'POST' && requestUrl.pathname === '/api/admin/music') {
    if (!hasSession(request)) {
      sendJson(response, 401, { error: 'Authentication required' });
      return;
    }
    if (!sameOrigin(request)) {
      sendJson(response, 403, { error: 'Origin not allowed' });
      return;
    }

    let musicFile;
    try {
      musicFile = await readMp3Upload(request);
    } catch (error) {
      sendJson(response, error.status || 400, { error: error.message });
      return;
    }

    try {
      await fs.mkdir(uploadsDirectory, { recursive: true });
      const temporaryFile = `${uploadedMusicFile}.tmp`;
      await fs.writeFile(temporaryFile, musicFile, { mode: 0o640 });
      await fs.rename(temporaryFile, uploadedMusicFile);
      await saveSettings({ ...settings, musicUrl: '/uploads/background.mp3' });
      sendJson(response, 200, { musicUrl: settings.musicUrl });
    } catch (error) {
      console.error('Uploaded music could not be saved:', error.message);
      sendJson(response, 500, { error: 'Music upload could not be saved' });
    }
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
    const savedViewState = JSON.parse(await fs.readFile(viewsFile, 'utf8'));
    const savedViews = savedViewState.views;
    if (Number.isSafeInteger(savedViews) && savedViews >= 0) viewCount = savedViews;
    if (Array.isArray(savedViewState.visitors)) {
      for (const visitorKey of savedViewState.visitors) {
        if (typeof visitorKey === 'string' && /^[\da-f]{64}$/i.test(visitorKey)) countedViewers.add(visitorKey);
      }
    }
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