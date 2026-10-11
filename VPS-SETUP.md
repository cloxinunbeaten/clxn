# VPS kurulumu

## 1. Nginx

Site statik dosyalardan oluşur; Node.js, npm veya arka plan servisi gerekmez. `nginx.conf.example` dosyasını `/etc/nginx/sites-available/cloxin` olarak kopyala. TLS sertifika yolları ve domain adları farklıysa dosyada güncelle:

```bash
sudo ln -s /etc/nginx/sites-available/cloxin /etc/nginx/sites-enabled/cloxin
sudo nginx -t
sudo systemctl reload nginx
```

Nginx yapılandırması `/var/www/html` altındaki dosyaları doğrudan sunar. Eski bot servisini, bot token'ını ve durum dosyasını GitHub Actions dağıtımı kaldırır.

## 2. Otomatik dağıtım

GitHub Actions için `VDS_HOST`, `VDS_USER` ve `VDS_SSH_KEY` secret'larını tanımla. `main` branch'ine push edildiğinde site dosyaları `/var/www/html` altına kopyalanır, Nginx yapılandırması yenilenir ve eski `cloxin-bot.service` durdurulup kaldırılır. Nginx etkin yapılandırmasının `/etc/nginx/sites-available/cloxin` dosyasına bağlı ve sertifika yollarının doğru olduğundan emin ol.

`deploy.bat` değişiklikleri commit edip `main` branch'ine normal push yapar. Uzak branch yerelse push güvenli biçimde reddedilir; zorla üzerine yazılmaz.

## 3. Profil verisi

Discord botu kullanılmaz. Profil bilgileri, çevrimiçi durumu ve bio metni tarayıcıdan Lanyard API üzerinden alınır. Kullanıcı ID'si `index.html` içindeki `DISCORD_ID` sabitinden değiştirilir. Bio, Lanyard verisindeki `kv.bio` veya `kv.about` alanından gösterilir.