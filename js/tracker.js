(async function () {
  try {
    // AdBlocker'lara takılmayan güvenilir IP servisi
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();

    if (data.ip) {
      await fetch(`/.netlify/functions/logger?ip=${encodeURIComponent(data.ip)}`);
    }
  } catch (e) {
    await fetch("/.netlify/functions/logger");
  }
})();