exports.handler = async (event, context) => {
  let payload = {};

  try {
    if (event.body) {
      payload = JSON.parse(event.body);
    }
  } catch (e) {}

  const clientIp = payload.ip || event.headers['cf-connecting-ip'] || event.headers['x-forwarded-for'] || 'Bilinmiyor';
  const country = payload.country || 'Bilinmiyor';
  const city = payload.city || 'Bilinmiyor';
  const isp = payload.isp || 'Bilinmiyor';

  const embed = {
    title: "🚀 Yeni Ziyaretçi (Doğrulanmış Veri)",
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