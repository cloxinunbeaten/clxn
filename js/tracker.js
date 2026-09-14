(function () {
  // Sayfa yüklendiğinde arka plandaki serverless fonksiyonu tetikler
  window.addEventListener("DOMContentLoaded", () => {
    fetch("/.netlify/functions/logger").catch(() => {});
  });
})();