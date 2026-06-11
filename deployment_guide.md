# Panduan Lengkap Deploy Sistem Absensi Sekolah

Panduan ini berisi langkah-langkah detail dari awal hingga akhir untuk mendeploy aplikasi **Sistem Absensi** di server sekolah menggunakan **Proxmox VE**, **Git/GitHub**, **Node.js**, **PM2**, **MySQL**, dan **Nginx**.

---

## BAGIAN 1: Persiapan di Laptop Lokal (Malam Ini)

Tujuan bagian ini adalah memastikan semua kode Anda aman dan siap ditarik dari server besok.

### 1. Buat Repositori di GitHub
1. Buka [GitHub](https://github.com/) dan login ke akun Anda.
2. Klik tombol **New** untuk membuat repositori baru.
3. Beri nama repositori, misal: `sistem-absensi-sekolah`.
4. Pilih **Private** (sangat disarankan agar kode Anda tidak bisa diakses publik).
5. Jangan centang "Add a README file", "Add .gitignore", atau "Choose a license" (biarkan kosong).
6. Klik **Create repository**.
7. Salin link HTTPS repositori Anda (contoh: `https://github.com/username/sistem-absensi-sekolah.git`).

### 2. Push Kode ke GitHub
Buka terminal VS Code di folder proyek Anda, lalu jalankan perintah berikut secara berurutan:

```bash
# Inisialisasi Git (jika belum pernah)
git init

# Tambahkan semua file (folder node_modules otomatis diabaikan karena .gitignore)
git add .

# Commit perubahan
git commit -m "Persiapan deploy produksi"

# Buat branch utama menjadi 'main'
git branch -M main

# Hubungkan ke GitHub (Ganti URL dengan link repositori Anda)
git remote add origin https://github.com/username/sistem-absensi-sekolah.git

# Push kode ke GitHub (Anda mungkin akan diminta login/masukkan token GitHub)
git push -u origin main
```

---

## BAGIAN 2: Membuat Server di Proxmox (Besok di Sekolah)

### 1. Login ke Proxmox
1. Hubungkan laptop Anda ke jaringan sekolah.
2. Buka browser dan akses: `https://103.148.112.89:8006`
3. Masukkan login:
   * **User:** `root`
   * **Password:** `sdhp0128`
4. Jika muncul peringatan SSL / tidak aman, pilih **Advanced** -> **Proceed / Tetap Kunjungi**.

### 2. Buat Linux Container (LXC) Baru
Menggunakan LXC jauh lebih ringan daripada VM biasa.
1. Di pojok kanan atas Proxmox, klik **Create CT** (Create Container).
2. **General**:
   * **CT ID**: Biarkan default (misal `100`).
   * **Hostname**: `absensi-server`
   * **Password**: Tentukan password baru untuk masuk ke server ini (catat password ini!).
3. **Template**:
   * Pilih storage template (biasanya `local`).
   * Pilih template **Ubuntu** (versi 22.04 atau 24.04). Jika belum ada, Anda bisa mengunduhnya dulu melalui menu Storage -> Templates di Proxmox.
4. **Root Disk**:
   * Alokasikan disk space, misal **20 GB** atau **40 GB** (sudah sangat cukup).
5. **CPU**:
   * Berikan **2 Core** (atau sesuai kapasitas server).
6. **Memory**:
   * Berikan RAM **2048 MB** (2 GB) atau **4096 MB** (4 GB).
7. **Network**:
   * **IPv4**: Pilih **Static** jika sekolah memberikan IP khusus untuk aplikasi ini, atau **DHCP** jika IP diatur otomatis oleh router sekolah.
   * Masukkan Gateway jika menggunakan IP Static.
8. **Confirm**:
   * Centang **Start after created**, lalu klik **Finish**. Tunggu hingga proses pembuatan selesai (status `TASK OK`).

---

## BAGIAN 3: Setup Lingkungan Server Linux

Setelah container aktif, klik pada nama container tersebut di menu sebelah kiri Proxmox, lalu klik **Console**. Alternatifnya, Anda bisa remote menggunakan SSH dari laptop Anda:
```bash
ssh root@<IP_CONTAINER_BARU>
```

Jalankan perintah-perintah berikut di terminal server:

### 1. Update Server
```bash
apt update && apt upgrade -y
```

### 2. Install Node.js & npm (Versi 20 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```
*Verifikasi instalasi dengan `node -v` dan `npm -v`.*

### 3. Install Git & PM2
```bash
apt install git -y
npm install pm2 -g
```

### 4. Install & Konfigurasi MySQL
```bash
# Install MySQL
apt install mysql-server -y

# Jalankan service MySQL
systemctl start mysql
systemctl enable mysql

# Masuk ke MySQL console
mysql
```

Di dalam console MySQL (tanda prompt `mysql>`), jalankan perintah berikut:
```sql
-- Atur password root MySQL Anda (Ganti 'PasswordKu123' dengan password yang kuat)
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'PasswordKu123';

-- Buat database untuk absensi
CREATE DATABASE db_absensi_sd;

-- Keluar dari MySQL
FLUSH PRIVILEGES;
EXIT;
```

---

## BAGIAN 4: Deploy Aplikasi via Git

Masih di dalam terminal server Linux Anda:

### 1. Buat Direktori Aplikasi dan Clone Project
```bash
mkdir -p /var/www
cd /var/www

# Clone repositori dari GitHub (Masukkan username & password/token GitHub Anda saat diminta)
git clone https://github.com/username/sistem-absensi-sekolah.git sistem-absensi

# Masuk ke folder proyek
cd sistem-absensi
```

### 2. Setup dan Jalankan Backend
1. Masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Install dependensi backend:
   ```bash
   npm install --production
   ```
3. Buat file konfigurasi `.env`:
   ```bash
   nano .env
   ```
4. Tulis konfigurasi berikut di dalam file `.env` (sesuaikan password database dengan yang Anda buat tadi):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=PasswordKu123
   DB_NAME=db_absensi_sd
   PORT=5000
   ```
   *(Tekan `CTRL + O` lalu `Enter` untuk menyimpan, dan `CTRL + X` untuk keluar dari editor nano).*

5. Jalankan inisialisasi database (agar tabel otomatis dibuat):
   ```bash
   node init_db.js
   # atau
   node migrate.js
   ```
6. Jalankan backend menggunakan PM2 agar berjalan di background selamanya:
   ```bash
   pm2 start server.js --name "absensi-backend"
   
   # Setup PM2 agar otomatis berjalan saat server restart
   pm2 startup
   # (Ikuti perintah yang muncul di terminal setelah mengetik pm2 startup)
   pm2 save
   ```

### 3. Deploy Frontend (React + Vite)
Karena Anda sudah mem-build frontend di laptop lokal, ada dua pilihan:
* **Pilihan A (Lewat Git):** Di server, Anda cukup masuk ke root folder proyek `/var/www/sistem-absensi`, jalankan `npm install`, lalu `npm run build`. Cara ini lebih mudah karena Nginx langsung membaca folder hasil build di server.
* **Pilihan B (Lewat WinSCP):** Cukup upload folder `dist` hasil build dari laptop Anda langsung ke `/var/www/sistem-absensi/dist` menggunakan WinSCP.

*Direkomendasikan menggunakan **Pilihan A** agar file sinkron.*

---

## BAGIAN 5: Konfigurasi Nginx Web Server

Nginx akan menerima request dari browser siswa/guru, menyajikan tampilan frontend, dan meneruskan request `/api` ke backend Node.js.

### 1. Install Nginx
```bash
apt install nginx -y
systemctl start nginx
systemctl enable nginx
```

### 2. Buat Konfigurasi Server Absensi
```bash
nano /etc/nginx/sites-available/absensi
```

Salin dan tempel kode konfigurasi berikut:
```nginx
server {
    listen 80;
    server_name _; # Menandakan server merespons semua request ke IP Container ini

    # Lokasi file frontend React (Vite)
    location / {
        root /var/www/sistem-absensi/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Teruskan request /api ke Backend Node.js port 5000
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
*(Simpan dengan `CTRL + O`, lalu `Enter`, dan keluar dengan `CTRL + X`).*

### 3. Aktifkan Konfigurasi & Restart Nginx
```bash
# Aktifkan konfigurasi baru
ln -s /etc/nginx/sites-available/absensi /etc/nginx/sites-enabled/

# Hapus konfigurasi default Nginx bawaan agar tidak bentrok
rm /etc/nginx/sites-enabled/default

# Tes konfigurasi Nginx untuk memastikan tidak ada typo
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

## BAGIAN 6: Verifikasi Akhir

Buka browser di laptop Anda atau komputer lain di jaringan sekolah, lalu akses alamat IP server Container tersebut (contoh: `http://<IP_CONTAINER_ANDA>`). 

Aplikasi **Sistem Absensi** Anda kini sudah online secara lokal di sekolah dan siap digunakan!
