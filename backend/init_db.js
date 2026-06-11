const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  console.log('Menghubungkan ke MySQL...');
  try {
    // Koneksi ke server MySQL tanpa memilih database spesifik
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
    });

    console.log('Membuat database db_absensi_sd jika belum ada...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS db_absensi_sd`);
    
    // Gunakan database tersebut
    await connection.query(`USE db_absensi_sd`);

    console.log('Membuat tabel siswa...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS siswa (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        nis VARCHAR(20) NOT NULL UNIQUE,
        kelas VARCHAR(20) NOT NULL,
        foto VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Membuat tabel users...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Membuat tabel absensi...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS absensi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        siswa_id INT NOT NULL,
        tanggal DATE NOT NULL,
        status ENUM('Hadir', 'Izin', 'Sakit', 'Alpha') NOT NULL,
        jam_masuk TIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (siswa_id) REFERENCES siswa(id) ON DELETE CASCADE,
        UNIQUE KEY unique_absensi_harian (siswa_id, tanggal)
      )
    `);

    console.log('Memeriksa apakah data siswa sudah ada...');
    const [rows] = await connection.query(`SELECT COUNT(*) as count FROM siswa`);
    
    if (rows[0].count === 0) {
      console.log('Memasukkan data dummy siswa...');
      const dummySiswa = [
        ['Ahmad Fauzi', '20240001', '1A'],
        ['Siti Nurhaliza', '20240002', '1B'],
        ['Budi Santoso', '20240003', '2A'],
        ['Rina Wulandari', '20240004', '2B'],
        ['Dimas Prasetyo', '20240005', '3A'],
        ['Anisa Rahma', '20240006', '3B'],
        ['Rizki Ramadhan', '20240007', '4A'],
        ['Dewi Lestari', '20240008', '4B'],
        ['Fajar Nugroho', '20240009', '5A'],
        ['Putri Ayu', '20240010', '5B'],
        ['Hendra Wijaya', '20240011', '6A'],
        ['Lina Marlina', '20240012', '6B'],
        ['Andi Saputra', '20240013', '1C'],
        ['Mega Puspita', '20240014', '2C'],
        ['Yusuf Hakim', '20240015', '3C'],
        ['Nur Aisyah', '20240016', '4C'],
        ['Rendi Kurniawan', '20240017', '5C'],
        ['Citra Dewi', '20240018', '6C'],
        ['Bagus Setiawan', '20240019', '1D'],
        ['Wulan Sari', '20240020', '2D'],
        ['Taufik Hidayat', '20240021', '3D'],
        ['Sri Wahyuni', '20240022', '4D'],
        ['Gilang Ramadhan', '20240023', '5D'],
        ['Indah Permata', '20240024', '6D']
      ];

      for (const siswa of dummySiswa) {
        await connection.query(`INSERT INTO siswa (nama, nis, kelas) VALUES (?, ?, ?)`, siswa);
      }
      console.log('Berhasil memasukkan 24 data siswa dummy.');

      // Insert some dummy attendance for today
      console.log('Memasukkan data dummy absensi hari ini...');
      const today = new Date().toISOString().split('T')[0];
      const [siswaRows] = await connection.query(`SELECT id FROM siswa LIMIT 15`);
      
      for (const s of siswaRows) {
        const rand = Math.random();
        let status = 'Hadir';
        let jam = null;
        
        if (rand > 0.8) {
          status = rand > 0.9 ? 'Sakit' : 'Izin';
        } else {
          // random time between 06:45 and 07:15
          const h = 7;
          const m = Math.floor(Math.random() * 30);
          jam = `0${h}:${m.toString().padStart(2, '0')}:00`;
        }

        await connection.query(`INSERT INTO absensi (siswa_id, tanggal, status, jam_masuk) VALUES (?, ?, ?, ?)`, [s.id, today, status, jam]);
      }
      console.log('Berhasil memasukkan data absensi awal.');
    } else {
      console.log(`Sudah ada ${rows[0].count} data siswa, melewati insert dummy.`);
    }

    await connection.end();
    console.log('Inisialisasi database selesai dengan sukses!');
    process.exit(0);
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    process.exit(1);
  }
}

initDB();
