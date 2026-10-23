# cloxinunbeaten.xyz

Discord (Lanyard) profil kartı + admin paneli.

```
public/            Herkese açık site (nginx/Node bunu servis eder)
  index.html
  assets/css/      profile.css
  assets/js/       profile.js
  assets/          music.mp3 (varsayılan müzik)
server/            Node API ve admin paneli (sunucuda /opt/cloxin altına kurulur)
  server.mjs
  admin.html       /admin altında Traffic ve Customize panelleri
  traffic.html     /admin altında tam sayfa Traffic görünümü
  offline.html     site kapalıyken ziyaretçiye gösterilen bakım ekranı
deploy/            nginx ve systemd örnek dosyaları
docs/              VPS kurulum notları
.github/workflows/ main'e push edilince VPS'e deploy
deploy.bat         Windows'tan commit + push kısayolu
```

`/admin` panelinde sol menüden **Traffic** ve **Customize** bölümleri açılır. Traffic görünümünde saatlik, günlük, haftalık ve aylık ziyaret analizi bulunur; IP whitelist'ine eklenen adresler parolasız, salt-okunur erişebilir. Whitelist ve site durumu yönetimi admin oturumu gerektirir. Traffic bölümündeki site anahtarı herkese açık siteyi kapatıp aynı temadaki “Site Offline” ekranını gösterir; `/admin` yönetimi açık kalır.
