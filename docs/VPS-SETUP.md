# VPS kurulumu

## Gereksinimler

VPS'te Node.js 20+, Nginx ve HTTPS sertifikaları kurulu olmalı. Etkin Nginx site bağlantısı `/etc/nginx/sites-enabled/cloxin` üzerinden `/etc/nginx/sites-available/cloxin` dosyasını göstermeli. İlk kurulumda:

```bash
sudo ln -s /etc/nginx/sites-available/cloxin /etc/nginx/sites-enabled/cloxin
```

## Admin parolası

GitHub repository ayarlarında **Settings → Secrets and variables → Actions** bölümüne `ADMIN_PASSWORD` adında bir repository secret ekle. Parolayı yalnızca secret değerine gir; kaynak dosyaya veya commit'e yazma. Aynı bölümde deploy için `VDS_HOST`, `VDS_USER` ve `VDS_SSH_KEY` secret'ları da tanımlı olmalı.

`main` branch'ine push edildiğinde workflow `ADMIN_PASSWORD` değerini systemd ortam dosyasına yazmadan önce Base64 ile kodlar; uygulama başlangıçta çözüp kullanır. Böylece tırnak, dolar işareti ve benzeri özel karakterler ortam dosyasının sözdizimini bozamaz. Kodlanmış değer root-okunur `/etc/cloxin/site.env` dosyasında saklanır. Secret eksikse deploy Nginx veya çalışan servis üzerinde değişiklik yapmadan durur.

## Kullanım

Admin paneli `https://cloxinunbeaten.xyz/admin` adresindedir. Sol üstteki menüden **Traffic** ve **Customize** bölümlerine geçilir. Trafik paneli saatlik, günlük, haftalık ve aylık ziyaret grafiği ile IP başına ziyaret sayısı, cihaz/tarayıcı ve son ziyareti gösterir; ziyaretçinin IP'sine tıklandığında kaydedilmiş User-Agent'tan çıkarılabilen cihaz modeli, işletim sistemi, tarayıcı ve ISS ayrıntıları açılır. User-Agent her zaman tam model bilgisini vermeyebilir. ISS, her IP için bir kez `ipwho.is` servisine sorgulanır ve sonuç trafik kayıtlarında saklanır; bu işlem ziyaretçinin IP adresini üçüncü tarafa iletir. Görüntülenen eski kayıtlar da sorgu kuyruğuna alınır; yeni sonuçlar trafik panelinin otomatik yenilemesinde görünür. IP geolokasyonundaki VPN/proxy kullanımı ve veritabanı farklılıkları ISS sonucunu etkileyebilir. Pil seviyesi toplanmaz. `213.154.17.2` ilk kurulumda whitelist'tedir; bu IP ve Traffic bölümünde whitelist'e eklenen diğer adresler parolasız, salt-okunur trafik erişimi alır. Whitelist ekleme/kaldırma, IP engelleme ve site durumunu değiştirme admin parolasıyla açılan oturum gerektirir. Whitelist `/var/lib/cloxin/traffic-whitelist.json`, IP engel listesi `/var/lib/cloxin/traffic-blacklist.json`, açık/kapalı site durumu `/var/lib/cloxin/site-status.json` dosyalarında kalıcıdır. Site kapatıldığında ziyaretçiler “Site Offline” bakım ekranını görür; `/admin` paneli açık kalır. Eski `/traffic` adresi Traffic bölümüne yönlendirilir.

Profil ayarları `/var/lib/cloxin/site-settings.json` altında kalıcıdır. Görüntülenme sayısı ve hash'lenmiş ziyaretçi kimlikleri `/var/lib/cloxin/views.json` içinde tutulur; tarayıcı kimliği ile yinelenen görüntülenmeler genel sayaçta bir kez sayılır. Trafik ekranının ziyaret kayıtları IP, cihaz/tarayıcı, zaman, varsa ülke kodu ve ISS bilgisini içeren `/var/lib/cloxin/traffic.jsonl` dosyasında 90 gün saklanır. Nginx, Cloudflare `CF-Connecting-IP` ve `CF-IPCountry` başlıklarını uygulamaya iletir; ülke bayrağı ancak Cloudflare ülke başlığını sağladığında gösterilir. Ham IP sunucuda tutulur ve ISS sorgusu için ipwho.is servisine iletilir.

`deploy.bat` değişiklikleri commit edip `main` branch'ine force kullanmadan push eder. Discord bot servisi dağıtım sırasında kapatılır ve kaldırılır.
