# VPS kurulumu

## 1. Dosyalar ve Node

Ubuntu/Debian VPS'te Node.js 20+ kurulu olsun. Projeyi `/var/www/html` altına aldıktan sonra:

```bash
cd /var/www/html
npm ci --omit=dev
sudo mkdir -p /etc/cloxin /var/lib/cloxin
sudo cp cloxin-bot.service.example /etc/systemd/system/cloxin-bot.service
sudo nano /etc/cloxin/cloxin.env
```

`cloxin.env` içeriği:

```env
DISCORD_TOKEN=bot-token
DISCORD_GUILD_ID=sunucu-id
PORT=8787
SITE_STATE_FILE=/var/lib/cloxin/site-state.json
```

Sonra servisi başlat:

```bash
sudo chown -R www-data:www-data /var/lib/cloxin
sudo systemctl daemon-reload
sudo systemctl enable --now cloxin-bot.service
```

Discord Developer Portal'da botu sunucuya `applications.commands` ve `bot` scope'larıyla ekle. `/site` komutu sunucu yöneticileri için kullanılabilir:

```text
/site mode:Bakim
/site mode:Kapali title:Site kapali message:Kisa bir aciklama
/site mode:Acik
```

## 2. Nginx

`nginx.conf.example` içeriğini site domainine göre `/etc/nginx/sites-available/cloxin` olarak kopyala. `server_name` değerini değiştirip etkinleştir:

```bash
sudo ln -s /etc/nginx/sites-available/cloxin /etc/nginx/sites-enabled/cloxin
sudo nginx -t
sudo systemctl reload nginx
```

Nginx statik siteyi sunar, `/api/status` isteklerini bot/API servisine aktarır.

## 3. Otomatik deploy

GitHub Actions için `VDS_HOST`, `VDS_USER` ve `VDS_SSH_KEY` secret'ları tanımlı olmalı. `main` branch'e push edildiğinde dosyalar kopyalanır, bağımlılıklar kurulur ve `cloxin-bot.service` yeniden başlatılır.

`/etc/cloxin/cloxin.env` sunucuda tutulur; repoya eklenmez.
