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

  if (clientIp !== 'Bilinmiyor') {
    try {
      // Backend tarafında ipapi.co ile detaylı sorgu
      const geoRes = await fetch(`https://ipapi.co/${clientIp}/json/`);
      const geoData = await geoRes.json();

      if (!geoData.error) {
        country = geoData.country_name || 'Bilinmiyor';
        city = geoData.city || 'Bilinmiyor';
        isp = geoData.org || geoData.asn || 'Bilinmiyor';
      }
    } catch (e) {
      console.error("GeoIP hatasi:", e);
    }
  }

  const embed = {
    title: "🚀 Yeni Ziyaretçi Tespit Edildi",
    color: 4690392,
    fields: [
      { name: "IP Adresi", value: clientIp, inline: true },
      { name: "Ülke / Şehir", value: `${country} / ${city}`, inline: true },
      { name: "İnternet Sağlayıcı (ISP)", value: isp, inline: false },
      { name: "User-Agent", value: event.headers['user-agent'] || 'Bilinmiyor', inline: false }
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