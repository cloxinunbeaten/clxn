// netlify/functions/status.js
//
// Tek işi: Netlify Environment Variables kısmında tanımlanan SITE_MODE
// değerini okuyup istemciye döndürmek. Ziyaretçiye ait HİÇBİR veri
// (IP, konum, tarayıcı bilgisi vb.) okunmaz, işlenmez veya
// dışarıya gönderilmez — sadece site sahibinin ayarladığı bayrak
// geri döner.
//
// Netlify > Site configuration > Environment variables kısmında
// tanımlanacak değişkenler:
//
//   SITE_MODE            "live" | "maintenance" | "stopped"  (varsayılan: live)
//   SITE_MESSAGE_TITLE   (opsiyonel) başlığı özelleştirir
//   SITE_MESSAGE         (opsiyonel) açıklama metnini özelleştirir
//
// SITE_MODE değerini değiştirip yeniden deploy ettiğinizde (ya da
// "Clear cache and deploy" yaptığınızda) site anında bakım/kapalı
// ekranına döner; tekrar "live" yapıp deploy ettiğinizde normale döner.

const DEFAULTS = {
  maintenance: {
    title: 'Bakımdayız',
    message: 'Sitede planlı bir bakım çalışması yürütüyoruz. Kısa süre içinde tekrar buradayız.'
  },
  stopped: {
    title: 'Site Geçici Olarak Kapalı',
    message: 'Site şu anda hizmet dışı. Lütfen daha sonra tekrar deneyin.'
  }
};

exports.handler = async () => {
  const rawMode = (process.env.SITE_MODE || 'live').toLowerCase().trim();
  const mode = (rawMode === 'maintenance' || rawMode === 'stopped') ? rawMode : 'live';

  const fallback = DEFAULTS[mode] || null;
  const title = fallback ? (process.env.SITE_MESSAGE_TITLE || fallback.title) : null;
  const message = fallback ? (process.env.SITE_MESSAGE || fallback.message) : null;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      // Bu uç nokta hiçbir kullanıcıya özel veri içermediği için
      // önbelleğe alınmaması, en güncel modun her zaman dönmesi içindir.
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify({ mode, title, message })
  };
};
