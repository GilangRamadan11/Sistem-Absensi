const mysql = require('mysql2/promise');

async function initDB() {
  console.log('Menghubungkan ke MySQL...');
  try {
    // Koneksi ke server MySQL tanpa memilih database spesifik
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
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
        ['Ahmad Fauzi', '20240001', 'Kelas 1'],
        ['Siti Nurhaliza', '20240002', 'Kelas 1'],
        ['Budi Santoso', '20240003', 'Kelas 2'],
        ['Rina Wulandari', '20240004', 'Kelas 2'],
        ['Dimas Prasetyo', '20240005', 'Kelas 3'],
        ['Anisa Rahma', '20240006', 'Kelas 3'],
        ['Rizki Ramadhan', '20240007', 'Kelas 4'],
        ['Dewi Lestari', '20240008', 'Kelas 4'],
        ['Fajar Nugroho', '20240009', 'Kelas 5'],
        ['Putri Ayu', '20240010', 'Kelas 5'],
        ['Hendra Wijaya', '20240011', 'Kelas 6'],
        ['Lina Marlina', '20240012', 'Kelas 6'],
        ['Andi Saputra', '20240013', 'Kelas 1'],
        ['Mega Puspita', '20240014', 'Kelas 2'],
        ['Yusuf Hakim', '20240015', 'Kelas 3'],
        ['Nur Aisyah', '20240016', 'Kelas 4'],
        ['Rendi Kurniawan', '20240017', 'Kelas 5'],
        ['Citra Dewi', '20240018', 'Kelas 6'],
        ['Bagus Setiawan', '20240019', 'Kelas 1'],
        ['Wulan Sari', '20240020', 'Kelas 2'],
        ['Taufik Hidayat', '20240021', 'Kelas 3'],
        ['Sri Wahyuni', '20240022', 'Kelas 4'],
        ['Gilang Ramadhan', '20240023', 'Kelas 5'],
        ['Indah Permata', '20240024', 'Kelas 6']
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
