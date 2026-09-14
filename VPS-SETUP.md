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

Nginx, API ve tüm site isteklerini Node servisine aktarır. Node modu sunucu tarafında kontrol ettiği için JavaScript kapalı olsa bile bakım/kapalı ekranı aşılamaz.

Cloudflare HTTPS kullandigi için `/api/status` location'i mutlaka `443 ssl` ile gelen aktif server blogunda da bulunmali. Certbot genellikle 80 ve 443 bloglarini ayri olusturur. Aktif konfigurasyonlari bul:

```bash
sudo nginx -T | grep -n -A25 -B5 'server_name.*cloxinunbeaten.xyz'
sudo nginx -T | grep -n -A8 -B2 'location = /api/status'
```

HTTPS server blogunda (`listen 443 ssl` olan blog) su location yoksa ekle:

```nginx
location = /api/status {
	proxy_pass http://127.0.0.1:8787;
	proxy_http_version 1.1;
	proxy_set_header Host $host;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_no_cache 1;
}
```

`location /` blogu da statik dosya yerine Node'a proxy yapmali:

```nginx
location / {
	proxy_pass http://127.0.0.1:8787;
	proxy_http_version 1.1;
	proxy_set_header Host $host;
	proxy_set_header X-Real-IP $remote_addr;
	proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
	proxy_set_header X-Forwarded-Proto $scheme;
	proxy_no_cache 1;
}
```

Sonra konfigurasyonu kontrol edip yenile:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -i http://127.0.0.1:8787/api/status
curl -i https://cloxinunbeaten.xyz/api/status
```

Son iki komut da `200` ve `mode` içeren JSON dönmelidir. Public domain hâlâ `404` dönüyorsa istek başka bir Nginx server bloguna gidiyordur; `nginx -T` çıktısındaki `server_name` ve `listen 443 ssl` blogunu düzenle.

## 3. Otomatik deploy

GitHub Actions için `VDS_HOST`, `VDS_USER` ve `VDS_SSH_KEY` secret'ları tanımlı olmalı. `main` branch'e push edildiğinde dosyalar kopyalanır, bağımlılıklar kurulur ve `cloxin-bot.service` yeniden başlatılır.

`/etc/cloxin/cloxin.env` sunucuda tutulur; repoya eklenmez.

## Paket hatasi onarimi

`Cannot find package .../node_modules/discord.js/index.js` görürsen paket kurulumu bozulmustur. Proje klasöründe su komutlari calistir:

```bash
cd /var/www/html
rm -rf node_modules
npm cache verify
npm ci --omit=dev
node -e "const p=require('./node_modules/discord.js/package.json'); console.log(p.version, p.main)"
sudo systemctl reset-failed cloxin-bot.service
sudo systemctl restart cloxin-bot.service
sudo systemctl status cloxin-bot.service --no-pager
```

Beklenen paket girisi `14.27.0` ve `./src/index.js` olmalidir. `package-lock.json` dosyasini silme; deploy bu dosyayi kullanarak ayni sürümü kurar.
