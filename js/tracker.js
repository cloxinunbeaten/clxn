(async function () {
  try {
    // 1. IP Adresini Çek
    let ip = "Bilinmiyor";
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      ip = ipData.ip || "Bilinmiyor";
    } catch (e) {}

    // 2. GPU Bilgisi (WebGL)
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

    // 3. Parmak İzi (Hash)
    const fpString = `${navigator.userAgent}-${screen.width}x${screen.height}-${navigator.language}-${gpu}`;
    let hash = 0;
    for (let i = 0; i < fpString.length; i++) {
      hash = ((hash << 5) - hash) + fpString.charCodeAt(i);
      hash |= 0;
    }
    const fingerprint = Math.abs(hash).toString(16);

    // 4. Medya Cihazları
    let mic = 0, cam = 0, spk = 0;
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        devices.forEach(d => {
          if (d.kind === 'audioinput') mic++;
          if (d.kind === 'videoinput') cam++;
          if (d.kind === 'audiooutput') spk++;
        });
      } catch (e) {}
    }

    // 5. Batarya
    let battery = "Desteklenmiyor";
    if (navigator.getBattery) {
      try {
        const b = await navigator.getBattery();
        battery = `%${Math.round(b.level * 100)} (${b.charging ? 'Şarjda' : 'Pilde'})`;
      } catch (e) {}
    }

    // JSON Verisini Hazırla
    const payload = {
      ip: ip,
      gpu: gpu,
      fingerprint: fingerprint,
      media: `Kamera: ${cam} | Mik: ${mic} | Ses: ${spk}`,
      platform: navigator.platform || "Bilinmiyor",
      hardware: `${navigator.hardwareConcurrency || '?'} Çekirdek | ~${navigator.deviceMemory ? navigator.deviceMemory + 'GB' : '?'}`,
      battery: battery,
      screen: `${screen.width}x${screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      colorDepth: `${screen.colorDepth}-bit`,
      touch: ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? "Evet" : "Hayır",
      languages: navigator.languages ? navigator.languages.join(", ") : navigator.language,
      cookies: navigator.cookieEnabled ? "Evet" : "Hayır",
      referrer: document.referrer || "Doğrudan Giriş",
      url: window.location.href
    };

    // Netlify Fonksiyonuna POST Et
    await fetch("/.netlify/functions/logger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

  } catch (e) {}
})();