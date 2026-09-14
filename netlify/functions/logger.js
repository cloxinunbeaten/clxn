exports.handler = async (event, context) => {
  // 1. IP Tespiti (Client-side IP -> Cloudflare -> Netlify -> Header)
  const queryIp = event.queryStringParameters ? event.queryStringParameters.ip : null;
  const rawIp = queryIp || 
                event.headers['cf-connecting-ip'] || 
                event.headers['x-nf-client-connection-ip'] || 
                event.headers['x-forwarded-for'] || 
                'Bilinmiyor';

  const clientIp = rawIp.split(',')[0].trim();

  let country = event.headers['x-country'] || 'Bilinmiyor';
  let city = event.headers['x-city'] || 'Bilinmiyor';
  let isp = 'Bilinmiyor';

  if (clientIp !== 'Bilinmiyor') {
    try {
      // HTTP üzerinden limitsiz ve ultra hızlı ip-api.com sorgusu
      const geoRes = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,city,isp,org`);
      const geoData = await geoRes.json();

      if (geoData.status === 'success') {
        country = geoData.country || country;
        city = geoData.city || city;
        isp = geoData.isp || geoData.org || 'Bilinmiyor';
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