exports.handler = async (event, context) => {
  // İstemci IP adresini yakala
  const clientIp = event.headers['x-nf-client-connection-ip'] || 
                   event.headers['x-forwarded-for'] || 
                   'Bilinmiyor';

  try {
    // IP bilgilerini sorgula
    const geoRes = await fetch(`https://ipapi.co/${clientIp}/json/`);
    const geoData = await geoRes.json();

    const embed = {
      title: "🚀 Yeni Ziyaretçi Tespit Edildi",
      color: 4690392,
      fields: [
        { name: "IP Adresi", value: clientIp, inline: true },
        { name: "Ülke / Şehir", value: `${geoData.country_name || 'Bilinmiyor'} / ${geoData.city || 'Bilinmiyor'}`, inline: true },
        { name: "İnternet Sağlayıcı (ISP)", value: geoData.org || 'Bilinmiyor', inline: false },
        { name: "User-Agent", value: event.headers['user-agent'] || 'Bilinmiyor', inline: false }
      ],
      timestamp: new Date().toISOString()
    };

    // Environment Variable üzerinden Webhook URL'ini çağır
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