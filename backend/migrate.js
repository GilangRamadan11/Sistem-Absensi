const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  console.log('Menghubungkan ke MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'db_absensi_sd',
    });

    console.log('Menambahkan kolom tahun_ajaran ke tabel siswa...');
    await connection.query(`
      ALTER TABLE siswa 
      ADD COLUMN tahun_ajaran VARCHAR(20) DEFAULT '2024/2025'
    `);
    
    console.log('Migrasi berhasil!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Kolom tahun_ajaran sudah ada. Melewati migrasi.');
      process.exit(0);
    } else {
      console.error('Terjadi kesalahan:', error);
      process.exit(1);
    }
  }
}

runMigration();
