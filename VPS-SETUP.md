# VPS kurulumu

## Gereksinimler

VPS'te Node.js 20+, Nginx ve HTTPS sertifikaları kurulu olmalı. Etkin Nginx site bağlantısı `/etc/nginx/sites-enabled/cloxin` üzerinden `/etc/nginx/sites-available/cloxin` dosyasını göstermeli. İlk kurulumda:

```bash
sudo ln -s /etc/nginx/sites-available/cloxin /etc/nginx/sites-enabled/cloxin
```

## Admin parolası

GitHub repository ayarlarında **Settings → Secrets and variables → Actions** bölümüne `ADMIN_PASSWORD` adında bir repository secret ekle. Parolayı yalnızca secret değerine gir; kaynak dosyaya veya commit'e yazma. Aynı bölümde deploy için `VDS_HOST`, `VDS_USER` ve `VDS_SSH_KEY` secret'ları da tanımlı olmalı.

`main` branch'ine push edildiğinde workflow uygulamayı `/var/www/html` altına kopyalar, `ADMIN_PASSWORD` değerini root-okunur `/etc/cloxin/site.env` dosyasına yazar, Node servisini kurar ve Nginx'i yeniden yükler. Secret eksikse deploy Nginx veya çalışan servis üzerinde değişiklik yapmadan durur.

## Kullanım

Admin paneli `https://cloxinunbeaten.xyz/admin` adresindedir. Profil adı, bio, Discord ID'si, avatar URL'si, renkler, müzik, ses seviyesi ve sosyal butonlar panelden düzenlenebilir. Değişiklikler `/var/lib/cloxin/site-settings.json` altında kalıcıdır; görüntülenme sayısı `/var/lib/cloxin/views.json` içinde tutulur.

`deploy.bat` değişiklikleri commit edip `main` branch'ine force kullanmadan push eder. Discord bot servisi dağıtım sırasında kapatılır ve kaldırılır.