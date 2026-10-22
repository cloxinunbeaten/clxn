import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';

const DAY = 24 * 60 * 60 * 1000;
const RETENTION_MS = 400 * DAY;
const MAX_RECORDS = 200000;
const RECENT_LIMIT = 200;
const DEDUPE_MS = 10 * 1000;
const GEO_TTL_MS = 24 * 60 * 60 * 1000;
const GEO_FIELDS = 'status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,mobile,proxy,hosting,query';
const INTERVALS = {
  day: { buckets: 30, label: 'Daily' },
  week: { buckets: 12, label: 'Weekly' },
  month: { buckets: 12, label: 'Monthly' }
};

const startOfDay = t => { const d = new Date(t); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
const startOfWeek = t => { const s = startOfDay(t); const dow = (new Date(s).getUTCDay() + 6) % 7; return s - dow * DAY; };
const startOfMonth = t => { const d = new Date(t); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); };
const bucketStart = { day: startOfDay, week: startOfWeek, month: startOfMonth };

function previousBucket(interval, start) {
  if (interval === 'day') return start - DAY;
  if (interval === 'week') return start - 7 * DAY;
  const d = new Date(start);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1);
}

export function normalizeIp(value) {
  let ip = String(value || '').split(',')[0].trim();
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  return net.isIP(ip) ? ip : 'unknown';
}

function isPrivateIp(ip) {
  if (!net.isIP(ip)) return true;
  if (net.isIPv6(ip)) return /^(::1$|fc|fd|fe80)/i.test(ip);
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127);
}

function cleanCountryCode(value) {
  return /^[a-z]{2}$/i.test(value || '') ? value.toUpperCase() : '';
}

function clip(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

export function createTraffic({ file }) {
  let records = [];
  let writeQueue = Promise.resolve();
  const lastSeen = new Map();
  const geoCache = new Map();
  const geoInflight = new Map();
  let geoWindowStart = 0;
  let geoWindowCount = 0;

  async function load() {
    try {
      const raw = await fs.readFile(file, 'utf8');
      const cutoff = Date.now() - RETENTION_MS;
      const parsed = [];
      for (const line of raw.split('\n')) {
        if (!line) continue;
        try {
          const row = JSON.parse(line);
          if (Number.isFinite(row.t) && row.t >= cutoff && typeof row.ip === 'string') parsed.push(row);
        } catch {}
      }
      records = parsed.slice(-MAX_RECORDS);
      if (records.length !== raw.split('\n').filter(Boolean).length) {
        const tmp = `${file}.tmp`;
        await fs.writeFile(tmp, records.map(r => JSON.stringify(r)).join('\n') + (records.length ? '\n' : ''), { mode: 0o600 });
        await fs.rename(tmp, file);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') console.error('Traffic log could not be loaded:', error.message);
      records = [];
    }
  }

  function persist(row) {
    writeQueue = writeQueue.catch(() => {}).then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.appendFile(file, `${JSON.stringify(row)}\n`, { mode: 0o600 });
    });
    return writeQueue;
  }

  function normalizeGeo(ip, data, source) {
    if (source === 'ip-api') {
      if (data.status !== 'success') return null;
      return {
        ip,
        countryCode: cleanCountryCode(data.countryCode),
        country: clip(data.country, 80),
        region: clip(data.regionName, 80),
        city: clip(data.city, 80),
        zip: clip(data.zip, 20),
        lat: Number.isFinite(data.lat) ? data.lat : null,
        lon: Number.isFinite(data.lon) ? data.lon : null,
        timezone: clip(data.timezone, 60),
        isp: clip(data.isp, 120),
        org: clip(data.org, 120),
        as: clip(data.as, 160),
        asName: clip(data.asname, 80),
        reverse: clip(data.reverse, 255),
        mobile: Boolean(data.mobile),
        proxy: Boolean(data.proxy),
        hosting: Boolean(data.hosting),
        source
      };
    }
    if (data.error) return null;
    return {
      ip,
      countryCode: cleanCountryCode(data.country_code),
      country: clip(data.country_name, 80),
      region: clip(data.region, 80),
      city: clip(data.city, 80),
      zip: clip(data.postal, 20),
      lat: Number.isFinite(data.latitude) ? data.latitude : null,
      lon: Number.isFinite(data.longitude) ? data.longitude : null,
      timezone: clip(data.timezone, 60),
      isp: clip(data.org, 120),
      org: clip(data.org, 120),
      as: clip(`${data.asn || ''} ${data.org || ''}`.trim(), 160),
      asName: clip(data.org, 80),
      reverse: '',
      mobile: false,
      proxy: false,
      hosting: false,
      source
    };
  }

  async function fetchGeo(ip) {
    const now = Date.now();
    if (now - geoWindowStart > 60 * 1000) { geoWindowStart = now; geoWindowCount = 0; }
    if (geoWindowCount < 40) {
      geoWindowCount += 1;
      try {
        const response = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=${GEO_FIELDS}`, { signal: AbortSignal.timeout(4000) });
        if (response.ok) {
          const geo = normalizeGeo(ip, await response.json(), 'ip-api');
          if (geo) return geo;
        }
      } catch (error) {
        console.error('ip-api lookup failed:', error.message);
      }
    }
    try {
      const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, { signal: AbortSignal.timeout(4000), headers: { 'User-Agent': 'cloxin-traffic/1.0' } });
      if (response.ok) return normalizeGeo(ip, await response.json(), 'ipapi.co');
    } catch {}
    return null;
  }

  async function lookupIp(ip) {
    if (isPrivateIp(ip)) return null;
    const cached = geoCache.get(ip);
    if (cached && Date.now() - cached.at < GEO_TTL_MS) return cached.data;
    if (geoInflight.has(ip)) return geoInflight.get(ip);
    const pending = fetchGeo(ip).then(data => {
      if (data) geoCache.set(ip, { at: Date.now(), data });
      if (geoCache.size > 5000) geoCache.delete(geoCache.keys().next().value);
      return data;
    }).finally(() => geoInflight.delete(ip));
    geoInflight.set(ip, pending);
    return pending;
  }

  function applyGeo(ip, geo) {
    if (!geo) return;
    for (const row of records) {
      if (row.ip !== ip) continue;
      if (!row.cc && geo.countryCode) row.cc = geo.countryCode;
      if (!row.as && (geo.asName || geo.isp)) row.as = geo.asName || geo.isp;
    }
  }

  function backfill(ips) {
    for (const ip of ips.slice(0, 10)) {
      if (isPrivateIp(ip) || geoInflight.has(ip)) continue;
      lookupIp(ip).then(geo => applyGeo(ip, geo)).catch(() => {});
    }
  }

  const flagCache = new Map();
  async function flag(cc) {
    if (!/^[a-z]{2}$/i.test(cc || '')) return null;
    const code = cc.toLowerCase();
    if (flagCache.has(code)) return flagCache.get(code);
    try {
      const response = await fetch(`https://browserleaks.com/img/flags/${code}.png`, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', Referer: 'https://browserleaks.com/' }
      });
      if (!response.ok || !(response.headers.get('content-type') || '').startsWith('image/')) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length > 200 * 1024) return null;
      flagCache.set(code, buffer);
      return buffer;
    } catch {
      return null;
    }
  }

  async function record({ ip, userAgent, host, pathname, countryHint }) {
    const cleanIp = normalizeIp(ip);
    const ua = clip(userAgent || '', 400);
    const key = `${cleanIp}|${ua}`;
    const now = Date.now();
    if (now - (lastSeen.get(key) || 0) < DEDUPE_MS) return;
    lastSeen.set(key, now);
    if (lastSeen.size > 5000) lastSeen.delete(lastSeen.keys().next().value);

    const geo = await lookupIp(cleanIp).catch(() => null);
    const row = {
      t: now,
      ip: cleanIp,
      ua,
      cc: geo?.countryCode || cleanCountryCode(countryHint),
      as: geo?.asName || geo?.isp || '',
      host: clip(host || '', 120),
      path: clip(pathname || '/', 200)
    };
    records.push(row);
    if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS);
    await persist(row);
  }

  function top(map, limit = 10) {
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
  }

  function bump(map, key) {
    if (key) map.set(key, (map.get(key) || 0) + 1);
  }

  function summary(intervalName) {
    const interval = INTERVALS[intervalName] ? intervalName : 'day';
    const config = INTERVALS[interval];
    const now = Date.now();
    const startOf = bucketStart[interval];

    const starts = [];
    let cursor = startOf(now);
    for (let i = 0; i < config.buckets; i += 1) {
      starts.unshift(cursor);
      cursor = previousBucket(interval, cursor);
    }
    const rangeStart = starts[0];
    const series = starts.map(t => ({ t, count: 0, unique: new Set() }));
    const indexByStart = new Map(series.map((bucket, index) => [bucket.t, index]));

    const ips = new Map();
    const countries = new Map();
    const asNames = new Map();
    const userAgents = new Map();
    const hosts = new Map();
    const paths = new Map();
    const uniqueIps = new Set();
    const recent = [];
    let total = 0;

    for (let i = records.length - 1; i >= 0; i -= 1) {
      const row = records[i];
      if (row.t < rangeStart) continue;
      total += 1;
      uniqueIps.add(row.ip);
      const bucket = series[indexByStart.get(startOf(row.t))];
      if (bucket) { bucket.count += 1; bucket.unique.add(row.ip); }
      bump(ips, row.ip);
      bump(countries, row.cc);
      bump(asNames, row.as);
      bump(userAgents, row.ua);
      bump(hosts, row.host);
      bump(paths, row.path);
      if (recent.length < RECENT_LIMIT) recent.push(row);
    }

    const ipCountry = new Map();
    for (const row of recent) if (row.cc && !ipCountry.has(row.ip)) ipCountry.set(row.ip, row.cc);
    for (let i = records.length - 1; i >= 0 && ipCountry.size < ips.size; i -= 1) {
      const row = records[i];
      if (row.t >= rangeStart && row.cc && ips.has(row.ip) && !ipCountry.has(row.ip)) ipCountry.set(row.ip, row.cc);
    }

    backfill([...new Set([...ips.keys()].filter(ip => !ipCountry.has(ip)))]);

    const count = since => { let n = 0; const u = new Set(); for (let i = records.length - 1; i >= 0 && records[i].t >= since; i -= 1) { n += 1; u.add(records[i].ip); } return { visits: n, unique: u.size }; };

    return {
      interval,
      label: config.label,
      generatedAt: now,
      totals: {
        today: count(startOfDay(now)),
        week: count(startOfWeek(now)),
        month: count(startOfMonth(now)),
        range: { visits: total, unique: uniqueIps.size },
        allTime: records.length
      },
      series: series.map(({ t, count: c, unique }) => ({ t, count: c, unique: unique.size })),
      topIps: top(ips).map(([ip, c]) => ({ ip, count: c, cc: ipCountry.get(ip) || '' })),
      topCountries: top(countries).map(([cc, c]) => ({ cc, count: c })),
      topAsNames: top(asNames).map(([name, c]) => ({ name, count: c })),
      topUserAgents: top(userAgents).map(([ua, c]) => ({ ua, count: c })),
      topHosts: top(hosts).map(([name, c]) => ({ name, count: c })),
      topPaths: top(paths).map(([name, c]) => ({ name, count: c })),
      recent
    };
  }

  async function ipDetails(rawIp) {
    const ip = normalizeIp(rawIp);
    if (ip === 'unknown') return null;
    const geo = await lookupIp(ip).catch(() => null);
    applyGeo(ip, geo);
    const visits = records.filter(row => row.ip === ip);
    const userAgents = new Map();
    for (const row of visits) bump(userAgents, row.ua);
    return {
      ip,
      private: isPrivateIp(ip),
      geo,
      stats: {
        visits: visits.length,
        firstSeen: visits[0]?.t || null,
        lastSeen: visits[visits.length - 1]?.t || null,
        userAgents: top(userAgents, 5).map(([ua, count]) => ({ ua, count })),
        recent: visits.slice(-20).reverse()
      }
    };
  }

  return { load, record, summary, ipDetails, flag };
}
