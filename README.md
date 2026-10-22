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
  admin.html       yalnızca /admin adresinden, giriş sonrası kullanılır
deploy/            nginx ve systemd örnek dosyaları
docs/              VPS kurulum notları
.github/workflows/ main'e push edilince VPS'e deploy
deploy.bat         Windows'tan commit + push kısayolu
```
)
