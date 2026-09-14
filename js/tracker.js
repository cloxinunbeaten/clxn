(async function () {
  try {
    // 1. Doğrudan tarayıcıdan gerçek IP'yi çek
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();

    if (data.ip) {
      // 2. Gerçek IP'yi sunucuya gönder
      await fetch(`/.netlify/functions/logger?ip=${encodeURIComponent(data.ip)}`);
    }
  } catch (e) {
    // Hata durumunda yedek çağrı
    await fetch("/.netlify/functions/logger");
  }
})();