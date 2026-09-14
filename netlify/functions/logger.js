exports.handler = async (event, context) => {
  // 1. Öncelik: Frontend'den gelen IP (Gerçek Kullanıcı IP'si)
  // 2. Öncelik: Header'lardan gelen IP
  const queryIp = event.queryStringParameters ? event.queryStringParameters.ip : null;
  const rawIp = queryIp || 
                event.headers['cf-connecting-ip'] || 
                event.headers['x-nf-client-connection-ip'] || 
                event.headers['x-forwarded-for'] || 
                'Bilinmiyor';

  const clientIp = rawIp.split(',')[0].trim();

  try {
    // ip-api.com ile sorgulama yapıyoruz
    const geoRes = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,country,city,isp,query`);
    const geoData = await geoRes.json();

    const isSuccess = geoData.status === 'success';

    const embed = {
      title: "🚀 Yeni Ziyaretçi Tespit Edildi",
      color: 4690392,
      fields: [
        { name: "IP Adresi", value: clientIp, inline: true },
        { name: "Ülke / Şehir", value: isSuccess ? `${geoData.country} / ${geoData.city}` : 'Bilinmiyor', inline: true },
        { name: "İnternet Sağlayıcı (ISP)", value: isSuccess ? geoData.isp : 'Bilinmiyor', inline: false },
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
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};