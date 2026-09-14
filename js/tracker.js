(async function () {
  try {
    // Sadece tarayıcıdan güvenli IP adresini çekip fonksiyona yolluyoruz
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();

    if (data.ip) {
      await fetch(`/.netlify/functions/logger?ip=${encodeURIComponent(data.ip)}`);
    } else {
      await fetch("/.netlify/functions/logger");
    }
  } catch (e) {
    await fetch("/.netlify/functions/logger");
  }
})();