(async function () {
  try {
    // ipwho.is üzerinden hem IP hem de tüm detayları tarayıcıdan çekiyoruz
    const res = await fetch("https://ipwho.is/");
    const data = await res.json();

    if (data.success) {
      // Elde edilen güvenilir verileri sunucuya gönderiyoruz
      await fetch("/.netlify/functions/logger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: data.ip,
          country: data.country,
          city: data.city,
          isp: data.connection ? data.connection.isp : "Bilinmiyor",
          org: data.connection ? data.connection.org : "Bilinmiyor"
        })
      });
    }
  } catch (e) {
    // Hata durumunda varsayılan tetikleme
    await fetch("/.netlify/functions/logger");
  }
})();