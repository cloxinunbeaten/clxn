(async function () {
  try {
    // 1. IP Tespiti
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

    // 3. Parmak İzi (Fingerprint)
    const fpString = `${navigator.userAgent}-${screen.width}x${screen.height}-${navigator.language}-${gpu}`;
    let hash = 0;
    for (let i = 0; i < fpString.length; i++) {
      hash = ((hash << 5) - hash) + fpString.charCodeAt(i);
      hash |= 0;
    }
    const fingerprint = Math.abs(hash).toString(16);

    // 4. Medya Cihazları
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

    // 5. Batarya
    let batteryInfo = "Bilgi Yok";
    if (navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        batteryInfo = `%${Math.round(battery.level * 100)} (${battery.charging ? 'Şarj Oluyor' : 'Pilde'})`;
      } catch (e) {}
    }

    // Veri Paketleme
    const payload = {
      ip: ip,
      fingerprint: fingerprint,
      gpu: gpu,
      media: `Kamera: ${camCount} | Mik: ${micCount} | Ses: ${speakerCount}`,
      platform: navigator.platform || "Bilinmiyor",
      hardware: `${navigator.hardwareConcurrency || '?'} Çekirdek | ~${navigator.deviceMemory ? navigator.deviceMemory + 'GB RAM' : '?'}`,
      battery: batteryInfo,
      screen: `${screen.width}x${screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      colorDepth: `${screen.colorDepth}-bit (${window.devicePixelRatio || 1}x)`,
      touch: ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? "Evet" : "Hayır",
      languages: navigator.languages ? navigator.languages.join(", ") : navigator.language,
      cookies: navigator.cookieEnabled ? "Evet" : "Hayır",
      referrer: document.referrer || "Doğrudan Giriş",
      url: window.location.href
    };

    await fetch("/.netlify/functions/logger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

  } catch (e) {
    await fetch("/.netlify/functions/logger");
  }
})();