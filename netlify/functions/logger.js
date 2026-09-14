exports.handler = async (event, context) => {
  const queryIp = event.queryStringParameters ? event.queryStringParameters.ip : null;
  const rawIp = queryIp || 
                event.headers['cf-connecting-ip'] || 
                event.headers['x-nf-client-connection-ip'] || 
                event.headers['x-forwarded-for'] || 
                'Bilinmiyor';

  const clientIp = rawIp.split(',')[0].trim();

  let country = 'Bilinmiyor';
  let city = 'Bilinmiyor';
  let isp = 'Bilinmiyor';
  let coords = null;

  if (clientIp !== 'Bilinmiyor') {
    try {
      const geoRes = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,city,isp,org,lat,lon,as`);
      const geoData = await geoRes.json();

      if (geoData.status === 'success') {
        country = geoData.country || 'Bilinmiyor';
        city = geoData.city || 'Bilinmiyor';
        isp = `${geoData.isp || geoData.org || 'Bilinmiyor'} (${geoData.as || ''})`;
        coords = `https://www.google.com/maps?q=${geoData.lat},${geoData.lon}`;
      }
    } catch (e) {}
  }

  const embed = {
    title: "🎯 Yeni Ziyaretçi Tespit Edildi",
    color: 5814783, // Mavi/Blurple
    fields: [
      {
        name: "🌐 Ağ & Konum",
        value: 
          `• **IP Adresi:** \`${clientIp}\`\n` +
          `• **Konum:** ${city} / ${country}\n` +
          `• **İnternet Sağlayıcı:** ${isp}\n` +
          (coords ? `• **Harita:** [Konuma Git](${coords})` : `• **Harita:** Bulunamadı`),
        inline: false
      },
      {
        name: "📌 Tarayıcı & Sistem (User-Agent)",
        value: `\`${event.headers['user-agent'] || 'Bilinmiyor'}\``,
        inline: false
      }
    ],
    footer: {
      text: "cloxinunbeaten.xyz • Güvenlik Logu"
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