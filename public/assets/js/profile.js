/* ============================================================
   SOSYAL HESAPLAR — açmak/kapatmak için sadece enabled: true/false yap.
   url alanına kendi profil linkini yaz. Sırayı değiştirmek istersen
   dizideki sırayı değiştirmen yeterli.
   ============================================================ */
const DEFAULT_SOCIALS = [
  {
    name: 'discord',
    enabled: true,
    url: 'https://discord.com/users/1368780659484528702',
    icon: `<path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.04.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.673-3.548-13.66a.061.061 0 0 0-.031-.028ZM8.02 15.33c-1.183 0-2.157-1.086-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.211 0 2.176 1.096 2.157 2.42 0 1.334-.946 2.42-2.157 2.42Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.42 0-1.333.955-2.42 2.157-2.42 1.211 0 2.176 1.096 2.157 2.42 0 1.334-.946 2.42-2.157 2.42Z"/>`
  },
  {
    name: 'github',
    enabled: true,
    url: 'https://github.com/cloxinunbeaten',
    icon: `<path d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.87-1.36-3.87-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.78 1.19 1.78 1.19 1.03 1.77 2.72 1.26 3.38.96.1-.74.4-1.26.72-1.55-2.56-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.7.41.36.78 1.08.78 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z"/>`
  },
  {
  name: 'tiktok',
  enabled: true,
  url: 'https://tiktok.com/@clxnunbetaen',
  icon: `<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>`
},
  {
    name: 'twitter',
    enabled: false,
    url: '',
    icon: `<path d="M18.9 2H22l-7 8 7.6 12h-6.3L11 14.9 5.3 22H2.2l7.5-8.6L2 2h6.4l4.9 6.5L18.9 2Z"/>`
  },
  {
  name: 'instagram',
  enabled: true,
  url: 'https://www.instagram.com/cloxingood?stkn=MXdtaWQ2cWZzaHFscA==',
  icon: `<path d="M12 0C8.74 0 8.333.014 7.053.072 5.775.13 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.014 8.333 0 8.74 0 12s.014 3.667.072 4.947c.058 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.986 8.74 24 12 24s3.667-.014 4.947-.072c1.277-.058 2.148-.261 2.913-.558.788-.306 1.459-.717 2.126-1.384.666-.667 1.079-1.336 1.384-2.126.296-.765.499-1.636.558-2.913.058-1.28.072-1.687.072-4.947s-.014-3.667-.072-4.947c-.058-1.277-.261-2.148-.558-2.913-.306-.788-.717-1.459-1.384-2.126C21.319 1.347 20.65.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.014 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>`
},
  {
    name: 'youtube',
    enabled: false,
    url: '',
    icon: `<path d="M23.5 7.2s-.23-1.64-.94-2.36c-.9-.94-1.9-.94-2.36-1C16.9 3.6 12 3.6 12 3.6h-.01s-4.9 0-8.2.24c-.46.06-1.46.06-2.36 1-.71.72-.94 2.36-.94 2.36S.25 9.1.25 11v1.79c0 1.9.24 3.8.24 3.8s.23 1.64.94 2.36c.9.94 2.08.9 2.6 1 1.9.18 8.02.24 8.02.24s4.9 0 8.2-.25c.46-.06 1.46-.06 2.36-1 .71-.72.94-2.36.94-2.36s.24-1.9.24-3.8V11c0-1.9-.24-3.8-.24-3.8ZM9.7 15V8.4l6.3 3.3-6.3 3.3Z"/>`
  }
];

/* ============================================================ */

function renderSocials(){
  const wrap = document.getElementById('socials');
  wrap.innerHTML = '';
  SOCIALS.filter(s => s.enabled && s.url).forEach(s => {
    const a = document.createElement('a');
    a.className = 'social-btn';
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${s.icon}</svg>`;
    a.title = s.label || s.name;
    a.setAttribute('aria-label', s.label || s.name);
    wrap.appendChild(a);
  });
}

const SOCIAL_ICONS = Object.fromEntries(DEFAULT_SOCIALS.map(social => [social.name, social.icon]));
const LINK_ICON = '<path fill="none" stroke="currentColor" stroke-width="2" d="M10 13a5 5 0 0 0 7.07 0l3-3A5 5 0 0 0 13 2.93l-1.72 1.71M14 11a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.71-1.71"/>';
let SOCIALS = DEFAULT_SOCIALS;
let DISCORD_ID = '1368780659484528702';
let profileSettings = {
  profileId: DISCORD_ID,
  displayName: '',
  bio: '',
  avatarUrl: '',
  musicUrl: 'music.mp3',
  volume: 30,
  colors: { background: '#4b4b4b', card: '#3b3b3b', button: '#333333', border: '#626262', text: '#f4f5f7', muted: '#d0d0d0', accent: '#a0a0a0' },
  socials: DEFAULT_SOCIALS.filter(social => social.enabled).map(social => ({ iconKey: social.name, label: social.name, url: social.url, enabled: true }))
};
let lastPresenceData = null;
const isAdminPreview = new URLSearchParams(location.search).get('adminPreview') === '1';
const STATUS_LABEL = { online:'Çevrimiçi', idle:'Boşta', dnd:'Rahatsız etmeyin', offline:'Çevrimdışı' };
const STATUS_COLOR = { online:'#23a55a', idle:'#f0b232', dnd:'#f23f43', offline:'#80848e' };

function applyProfileSettings(settings){
  profileSettings = {
    ...profileSettings,
    ...settings,
    colors: { ...profileSettings.colors, ...(settings.colors || {}) },
    socials: Array.isArray(settings.socials) ? settings.socials : profileSettings.socials
  };
  DISCORD_ID = profileSettings.profileId;

  const cssColors = {
    background: '--bg-0',
    card: '--card-bg',
    button: '--button-bg',
    border: '--border',
    text: '--text-0',
    muted: '--text-1',
    accent: '--accent'
  };
  for(const [key, variable] of Object.entries(cssColors)){
    document.documentElement.style.setProperty(variable, profileSettings.colors[key]);
  }
  document.documentElement.style.setProperty('--bg-1', profileSettings.colors.button);
  document.documentElement.style.setProperty('--text-2', profileSettings.colors.muted);

  document.getElementById('bgMusic').src = profileSettings.musicUrl || 'music.mp3';
  document.getElementById('bgMusic').volume = profileSettings.volume / 100;
  const volumeSlider = document.getElementById('volumeSlider');
  if(volumeSlider) volumeSlider.value = String(profileSettings.volume);
  SOCIALS = profileSettings.socials.map(social => ({
    name: social.label,
    label: social.label,
    enabled: social.enabled,
    url: social.url,
    icon: SOCIAL_ICONS[social.iconKey] || LINK_ICON
  }));
  const currentUser = lastPresenceData?.discord_user;
  document.getElementById('displayName').textContent = profileSettings.displayName || currentUser?.global_name || currentUser?.username || 'Cloxin';
  setAvatar(profileSettings.avatarUrl || (currentUser ? avatarUrl(currentUser) : 'https://cdn.discordapp.com/embed/avatars/0.png'));
  if(lastPresenceData){
    applyStatus(lastPresenceData.discord_status);
    applyActivity(lastPresenceData);
    applyBio(lastPresenceData);
  }
  document.title = profileSettings.displayName ? `${profileSettings.displayName} | Profile` : 'Cloxin | Profile';
}

async function loadProfileSettings(){
  try{
    const response = await fetch('/api/profile', { cache: 'no-store' });
    if(response.ok) applyProfileSettings(await response.json());
  }catch{}
}

async function loadViewCount(){
  try{
    const visitorId = getViewVisitorId();
    const response = await fetch('/api/views', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId })
    });
    if(!response.ok) throw new Error('View counter unavailable');
    const data = await response.json();
    document.getElementById('viewCount').textContent = String(Math.max(0, Math.floor(Number(data.views) || 0)));
  }catch{
    document.getElementById('viewCount').textContent = '0';
  }
}

function getViewVisitorId(){
  try{
    const key = 'cloxinViewVisitorId';
    let visitorId = localStorage.getItem(key);
    if(!/^[\da-f-]{36}$/i.test(visitorId || '')){
      visitorId = crypto.randomUUID();
      localStorage.setItem(key, visitorId);
    }
    return visitorId;
  }catch{
    return '';
  }
}

function setAvatar(src){
  document.getElementById('avatar').src = src;
}

function avatarUrl(user){
  if(user.avatar){
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=256`;
  }
  const idx = Number(BigInt(user.id) >> 22n) % 6;
  return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
}

function applyStatus(status){
  const color = STATUS_COLOR[status] || STATUS_COLOR.offline;
  const dot = document.getElementById('statusDot');
  const pip = document.getElementById('statusPip');
  dot.style.background = color;
  document.querySelector('.avatar-wrap').style.setProperty('--status-color', color);
  pip.style.background = color;
  document.getElementById('statusText').textContent = STATUS_LABEL[status] || 'Çevrimdışı';
}

function applyActivity(data){
  const box = document.getElementById('activityBox');
  const img = document.getElementById('activityImg');
  const title = document.getElementById('activityTitle');
  const sub = document.getElementById('activitySub');

  if(data.listening_to_spotify && data.spotify){
    box.classList.add('show');
    img.style.display = '';
    img.src = data.spotify.album_art_url || '';
    title.textContent = data.spotify.song || 'Spotify';
    sub.textContent = data.spotify.artist ? `${data.spotify.artist} · Spotify'da dinliyor` : "Spotify'da dinliyor";
    return;
  }

  const game = (data.activities || []).find(a => a.type === 0);
  if(game){
    box.classList.add('show');
    if(game.assets && game.assets.large_image){
      img.style.display = '';
      const asset = game.assets.large_image;
      img.src = asset.startsWith('mp:')
        ? `https://media.discordapp.net/${asset.replace('mp:', '')}`
        : `https://cdn.discordapp.com/app-assets/${game.application_id}/${asset}.png`;
    } else {
      img.style.display = 'none';
    }
    title.textContent = game.name || 'Oyun';
    sub.textContent = game.details || game.state || 'oynuyor';
    return;
  }

  const custom = (data.activities || []).find(a => a.type === 4);
  if(custom && custom.state){
    box.classList.add('show');
    img.style.display = 'none';
    title.textContent = custom.state;
    sub.textContent = 'Özel durum';
    return;
  }

  box.classList.remove('show');
}

let typedBio = '';
function typeText(el, text){
  if(typedBio === text) return;
  typedBio = text;
  clearInterval(typeText.timer);
  if(isAdminPreview || window.matchMedia('(prefers-reduced-motion: reduce)').matches){ el.textContent = text; return; }
  let i = 0;
  el.textContent = '';
  el.classList.add('typing');
  typeText.timer = setInterval(() => {
    el.textContent = text.slice(0, ++i);
    if(i >= text.length){ clearInterval(typeText.timer); el.classList.remove('typing'); }
  }, 45);
}

function applyBio(data){
  const wrap = document.getElementById('bioWrap');
  const text = document.getElementById('bioText');
  const kv = data.kv || {};
  const bio = profileSettings.bio || kv.bio || kv.about || '';
  if(bio){
    typeText(text, bio);
    wrap.classList.add('show');
  }else{
    wrap.classList.remove('show');
  }
}

async function loadPresence(){
  try{
    const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
    const json = await res.json();
    if(!json.success) throw new Error('Lanyard isteği başarısız');

    const data = json.data;
    const user = data.discord_user;
    lastPresenceData = data;

    setAvatar(profileSettings.avatarUrl || avatarUrl(user));
    document.getElementById('displayName').textContent = profileSettings.displayName || user.global_name || user.username;
    document.getElementById('userTag').textContent = '@' + user.username;

    applyStatus(data.discord_status);
    applyActivity(data);
    applyBio(data);
  }catch(err){
    document.getElementById('statusText').textContent = 'Durum şu an alınamıyor';
    document.getElementById('userTag').textContent = '@cloxin';
    console.error(err);
  }
}

function setupMusicAndEnter(){
  const enterScreen = document.getElementById('enterScreen');
  const bgMusic = document.getElementById('bgMusic');
  const musicControl = document.getElementById('musicControl');
  const musicToggle = document.getElementById('musicToggle');
  const volumeSlider = document.getElementById('volumeSlider');
  let musicStarted = false;

  bgMusic.volume = Number(volumeSlider.value) / 100;

  function updateSliderFill(){
    volumeSlider.style.setProperty('--vol', volumeSlider.value + '%');
  }
  updateSliderFill();

  // Tıkla ve gir ekranı — tarayıcılar kullanıcı etkileşimi olmadan
  // otomatik ses çalmasına izin vermiyor, bu yüzden müzik bu tıklamayla başlıyor.
  enterScreen.addEventListener('click', () => {
    if(!musicStarted){
      bgMusic.play().catch(()=>{});
      musicStarted = true;
    }
    enterScreen.classList.add('hide');
    document.body.classList.add('entered');
    musicToggle.classList.add('show', 'playing');
    musicControl.classList.add('expanded');
    setTimeout(() => enterScreen.remove(), 700);
  });

  enterScreen.addEventListener('keydown', event => {
    if(event.key === 'Enter' || event.key === ' '){
      event.preventDefault();
      enterScreen.click();
    }
  });

  // Düğme: sesi tamamen kapat/aç (mute toggle)
  musicToggle.addEventListener('click', () => {
    bgMusic.muted = !bgMusic.muted;
    musicToggle.classList.toggle('muted', bgMusic.muted);
    musicToggle.classList.toggle('playing', !bgMusic.muted);
  });

  // Kaydırıcı: ses seviyesini ayarla (0 -> otomatik sessize alır)
  volumeSlider.addEventListener('input', () => {
    const vol = Number(volumeSlider.value) / 100;
    bgMusic.volume = vol;
    updateSliderFill();

    if(vol === 0){
      bgMusic.muted = true;
      musicToggle.classList.add('muted');
      musicToggle.classList.remove('playing');
    } else {
      if(bgMusic.muted){
        bgMusic.muted = false;
      }
      musicToggle.classList.remove('muted');
      musicToggle.classList.add('playing');
    }
  });
}

/* ============================================================
   KART PARALLAX — fare hareketine göre profil kartı hafifçe
   döner ve kayar. Dokunmatik cihazlarda ve "reduced motion"
   tercihinde devre dışı kalır.
   ============================================================ */
function setupCardParallax(){
  const card = document.querySelector('.card');
  if(!card) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAX_SHIFT = 6;
  const EASE = 0.12;

  let targetX = 0, targetY = 0, curX = 0, curY = 0, raf = null;

  function onMove(e){
    const dx = (e.clientX / window.innerWidth) * 2 - 1;
    const dy = (e.clientY / window.innerHeight) * 2 - 1;
    targetX = Math.max(-1, Math.min(1, dx));
    targetY = Math.max(-1, Math.min(1, dy));
    if(!raf) raf = requestAnimationFrame(tick);
  }

  function onLeave(){
    targetX = 0;
    targetY = 0;
    if(!raf) raf = requestAnimationFrame(tick);
  }

  function tick(){
    curX += (targetX - curX) * EASE;
    curY += (targetY - curY) * EASE;

    const shiftX = curX * MAX_SHIFT;
    const shiftY = curY * MAX_SHIFT;

    card.style.transform =
      `perspective(900px) rotateX(${(-curY * 5).toFixed(2)}deg) rotateY(${(curX * 5).toFixed(2)}deg) translate3d(${shiftX.toFixed(1)}px, ${shiftY.toFixed(1)}px, 0)`;

    if(Math.abs(targetX - curX) > 0.001 || Math.abs(targetY - curY) > 0.001){
      raf = requestAnimationFrame(tick);
    } else {
      raf = null;
    }
  }

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseleave', onLeave);
}

function setupBackgroundVideo(){
  const video = document.getElementById('bgVideo');
  if(!video) return;
  const root = document.documentElement;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    video.remove();
    return;
  }
  // Video dosyası yoksa/yüklenemezse eski gradient arka plan kalır.
  function onFail(){ video.remove(); root.classList.remove('has-video'); }
  function onReady(){
    root.classList.add('has-video');
    video.play().catch(()=>{});
  }
  video.addEventListener('error', onFail, { once: true });
  video.addEventListener('loadeddata', onReady, { once: true });
  // Olaylar script çalışmadan önce tetiklenmiş olabilir, mevcut durumu da kontrol et
  if(video.error) onFail();
  else if(video.readyState >= 2) onReady();
  video.muted = true;
  video.play().catch(()=>{});
  // Sekme arka plandayken durdur, pil/CPU tasarrufu
  document.addEventListener('visibilitychange', () => {
    if(document.hidden) video.pause(); else video.play().catch(()=>{});
  });
  // Tarayıcı autoplay'i engellediyse ilk tıklamada başlat
  window.addEventListener('pointerdown', () => { if(video.paused) video.play().catch(()=>{}); }, { once: true });
}

function setupCustomCursor(){
  if(!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);

  let targetX = -100, targetY = -100, x = -100, y = -100, running = false;
  const interactive = 'a,button,[role="button"],input,.social-btn';

  function tick(){
    x += (targetX - x) * 0.2;
    y += (targetY - y) * 0.2;
    ring.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    if(Math.abs(targetX - x) > 0.1 || Math.abs(targetY - y) > 0.1){
      requestAnimationFrame(tick);
    }else{
      running = false;
    }
  }

  window.addEventListener('mousemove', e => {
    targetX = e.clientX;
    targetY = e.clientY;
    ring.classList.add('visible');
    ring.classList.toggle('active', !!(e.target.closest && e.target.closest(interactive)));
    if(!running){ running = true; requestAnimationFrame(tick); }
  }, { passive: true });
  window.addEventListener('mousedown', () => ring.classList.add('down'));
  window.addEventListener('mouseup', () => ring.classList.remove('down'));
  document.addEventListener('mouseleave', () => ring.classList.remove('visible'));
  document.addEventListener('mouseenter', () => ring.classList.add('visible'));
}

async function startSite(){
  await loadProfileSettings();
  renderSocials();
  if(isAdminPreview){
    document.body.classList.add('admin-preview', 'entered');
    document.documentElement.style.overflow = 'hidden';
    document.getElementById('enterScreen').remove();
    document.getElementById('musicControl').remove();
    document.getElementById('bgMusic').preload = 'none';
    document.getElementById('bgVideo')?.remove();
  }else{
    setupBackgroundVideo();
    setupCustomCursor();
    setupMusicAndEnter();
    setupCardParallax();
  }
  loadPresence();
  if(!isAdminPreview) loadViewCount();
  setInterval(loadPresence, 20000);
}

window.addEventListener('message', event => {
  if(!isAdminPreview || event.origin !== location.origin || event.data?.type !== 'cloxin-profile-preview') return;
  const previousId = DISCORD_ID;
  const previousName = profileSettings.displayName;
  applyProfileSettings(event.data.settings || {});
  renderSocials();
  if((DISCORD_ID !== previousId || profileSettings.displayName !== previousName) && /^\d{17,20}$/.test(DISCORD_ID)){
    loadPresence();
  }
});

startSite();
