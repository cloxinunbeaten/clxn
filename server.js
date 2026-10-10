import http from 'node:http';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, GatewayIntentBits, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8787);
const stateFile = process.env.SITE_STATE_FILE || path.join(root, 'site-state.json');
const allowedGuild = process.env.DISCORD_GUILD_ID || '';
const publicRoot = root;
// Sadece bu dosyalar disariya servis edilir (.git, .github, .env, server.js vb. asla).
const publicFiles = new Set(['index.html', 'closed.html', 'maintenance.html', 'music.mp3']);
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://cdn.discordapp.com https://media.discordapp.net https://i.scdn.co",
    "media-src 'self'",
    "connect-src 'self' https://api.lanyard.rest",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'"
  ].join('; ')
};
const activeVisitors = new Map();
const visitorTimeoutMs = 45_000;
const maxVisitors = 5000;

const defaults = {
  mode: 'live',
  title: 'Bakımdayız',
  message: 'Sitede planlı bir bakım çalışması yürütüyoruz. Kısa süre içinde tekrar buradayız.',
  profileId: '1368780659484528702'
};

async function readState() {
  try {
    return { ...defaults, ...JSON.parse(await fs.readFile(stateFile, 'utf8')) };
  } catch {
    return defaults;
  }
}

async function writeState(nextState) {
  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  await fs.writeFile(stateFile, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
}

async function sendFile(request, response, filePath, contentType, cacheControl = 'no-cache') {
  const { size } = await fs.stat(filePath);
  const headers = { 'Content-Type': contentType, 'Cache-Control': cacheControl, 'Accept-Ranges': 'bytes' };
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
  createReadStream(filePath, { start, end })
    .on('error', () => response.destroy())
    .pipe(response);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[character]));
}

async function sendStatusPage(response, page, state) {
  let html = await fs.readFile(path.join(publicRoot, page), 'utf8');
  html = html.replace(/(<h1[^>]*id="title"[^>]*>)[\s\S]*?(<\/h1>)/, `$1${escapeHtml(state.title)}$2`);
  html = html.replace(/(<p[^>]*id="message"[^>]*>)[\s\S]*?(<\/p>)/, `$1${escapeHtml(state.message)}$2`);
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(html);
}

async function sendPublicPage(response, filePath, state) {
  let html = await fs.readFile(filePath, 'utf8');
  html = html.replaceAll('__DISCORD_ID__', escapeHtml(state.profileId));
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(html);
}

function contentTypeFor(filePath) {
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mp3': 'audio/mpeg',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return types[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

async function handleRequest(request, response) {
  for (const [name, value] of Object.entries(securityHeaders)) response.setHeader(name, value);
  const requestUrl = new URL(request.url, 'http://localhost');

  if (request.method === 'GET' && requestUrl.pathname === '/api/status') {
    const state = await readState();
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    response.end(JSON.stringify({ ...state, onlineVisitors: activeVisitors.size }));
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/heartbeat') {
    const rawId = requestUrl.searchParams.get('id') || '';
    const visitorId = /^[A-Za-z0-9-]{8,64}$/.test(rawId)
      ? rawId
      : String(request.headers['x-real-ip'] || request.socket.remoteAddress || 'unknown');
    const cutoff = Date.now() - visitorTimeoutMs;
    for (const [id, lastSeen] of activeVisitors) {
      if (lastSeen < cutoff) activeVisitors.delete(id);
    }
    // Bellek sismesini engelle: limit doluysa yeni kimlikler eklenmez.
    if (activeVisitors.has(visitorId) || activeVisitors.size < maxVisitors) {
      activeVisitors.set(visitorId, Date.now());
    }
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    response.end(JSON.stringify({ onlineVisitors: activeVisitors.size }));
    return;
  }

  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('ok');
    return;
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    const state = await readState();
    const forcedPage = state.mode === 'closed' ? 'closed.html' :
      state.mode === 'maintenance' ? 'maintenance.html' : null;
    let requestedPath = requestUrl.pathname;
    try { requestedPath = decodeURIComponent(requestedPath); } catch { requestedPath = ''; }
    const relativePath = forcedPage || (requestedPath === '/' ? 'index.html' : requestedPath.slice(1));

    if (publicFiles.has(relativePath)) {
      const filePath = path.join(publicRoot, relativePath);
      try {
        if (forcedPage) {
          await sendStatusPage(response, forcedPage, state);
        } else if (relativePath === 'index.html') {
          await sendPublicPage(response, filePath, state);
        } else {
          await sendFile(request, response, filePath, contentTypeFor(filePath), 'no-cache');
        }
        return;
      } catch {
        if (!response.headersSent) {
          response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          response.end('Not found');
        }
        return;
      }
    }
  }

  response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end('Not found');
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch(error => {
    console.error('Istek islenemedi:', error);
    if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Server error');
  });
});
server.requestTimeout = 30_000;
server.headersTimeout = 15_000;


server.listen(port, '127.0.0.1', () => {
  console.log(`Site control API listening on 127.0.0.1:${port}`);
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const command = new SlashCommandBuilder()
  .setName('site')
  .setDescription('Site durumunu degistirir')
  .addStringOption(option => option
    .setName('mode')
    .setDescription('Site modu')
    .setRequired(true)
    .addChoices(
      { name: 'Acik', value: 'live' },
      { name: 'Bakim', value: 'maintenance' },
      { name: 'Kapali', value: 'closed' }
    ))
  .addStringOption(option => option.setName('title').setDescription('Baslik').setMaxLength(80))
  .addStringOption(option => option.setName('message').setDescription('Ziyaretci mesaji').setMaxLength(240));
const visitorCommand = new SlashCommandBuilder().setName('ziyaretci').setDescription('Aktif ziyaretci sayisini gosterir');
const statusCommand = new SlashCommandBuilder().setName('durum').setDescription('Site durumunu gosterir');
const pingCommand = new SlashCommandBuilder().setName('ping').setDescription('Site API gecikmesini olcer');
const profileCommand = new SlashCommandBuilder()
  .setName('profil')
  .setDescription('Profil kartindaki Discord kullanicisini degistirir')
  .addStringOption(option => option.setName('id').setDescription('Discord kullanici ID').setRequired(true).setMinLength(17).setMaxLength(20));
const commands = [command, visitorCommand, statusCommand, pingCommand, profileCommand];

client.once('clientReady', async readyClient => {
  try {
    if (allowedGuild) {
      await readyClient.application.commands.set(commands, allowedGuild);
    } else {
      await readyClient.application.commands.set(commands);
    }
    console.log(`Discord bot hazir: ${readyClient.user.tag}`);
  } catch (error) {
    console.error('Slash komutu kaydedilemedi:', error);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
    if (!isAdmin) {
      await interaction.editReply('Bu komut icin sunucu yonetici yetkisi gerekiyor.');
      return;
    }

    if (interaction.commandName === 'ziyaretci') {
      await interaction.editReply(`Aktif ziyaretci: **${activeVisitors.size}**`);
      return;
    }

    if (interaction.commandName === 'durum') {
      const state = await readState();
      await interaction.editReply(`Mod: **${state.mode}**\nAktif ziyaretci: **${activeVisitors.size}**\nProfil ID: **${state.profileId}**`);
      return;
    }

    if (interaction.commandName === 'ping') {
      const startedAt = Date.now();
      await fetch(`http://127.0.0.1:${port}/health`);
      await interaction.editReply(`API yaniti: **${Date.now() - startedAt} ms**\nDiscord websocket: **${client.ws.ping} ms**`);
      return;
    }

    if (interaction.commandName === 'profil') {
      const profileId = interaction.options.getString('id', true);
      if (!/^\d{17,20}$/.test(profileId)) {
        await interaction.editReply('Gecerli bir Discord kullanici ID gir.');
        return;
      }
      const state = await readState();
      await writeState({ ...state, profileId });
      await interaction.editReply(`Profil ID **${profileId}** olarak degistirildi.`);
      return;
    }

    if (interaction.commandName !== 'site') return;

    const mode = interaction.options.getString('mode', true);
    const current = await readState();
    const nextState = {
      ...current,
      mode,
      title: interaction.options.getString('title') || (mode === 'closed' ? 'Site kapali' : defaults.title),
      message: interaction.options.getString('message') || (mode === 'closed' ? 'Site su anda erisime kapali.' : defaults.message)
    };
    await writeState(nextState);
    await interaction.editReply(`Site modu **${mode}** olarak ayarlandi.`);
  } catch (error) {
    console.error('Slash komutu islenemedi:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('Komut islenirken bir sunucu hatasi olustu. Journal logunu kontrol et.').catch(replyError => {
        console.error('Hata mesaji gonderilemedi:', replyError);
      });
    } else {
      await interaction.reply({ content: 'Komut islenirken bir sunucu hatasi olustu.', flags: MessageFlags.Ephemeral }).catch(replyError => {
        console.error('Hata mesaji gonderilemedi:', replyError);
      });
    }
  }
});

client.on('error', error => console.error('Discord client hatasi:', error));
client.on('shardError', error => console.error('Discord gateway hatasi:', error));
process.on('unhandledRejection', error => console.error('Yakalanmamis Promise hatasi:', error));
process.on('uncaughtException', error => console.error('Yakalanmamis process hatasi:', error));

if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN tanimli degil. Bot baslatilmadi.');
} else {
  client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('Discord girisi basarisiz:', error.message);
    process.exitCode = 1;
  });
}
