const mysql = require('mysql2/promise');

async function testDB() {
  try {
    const c = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: ''
    });
    console.log('MySQL connection: OK');

    const [r] = await c.query("SHOW DATABASES LIKE 'db_absensi_sd'");
    console.log('DB exists:', r.length > 0);

    if (r.length > 0) {
      await c.query('USE db_absensi_sd');
      const [t] = await c.query('SHOW TABLES');
      console.log('Tables:', JSON.stringify(t));
      const [s] = await c.query('SELECT COUNT(*) as count FROM siswa');
      console.log('Siswa count:', s[0].count);
      
      // Check if tahun_ajaran column exists
      const [cols] = await c.query("SHOW COLUMNS FROM siswa LIKE 'tahun_ajaran'");
      console.log('tahun_ajaran column exists:', cols.length > 0);
    }

    await c.end();
  } catch (e) {
    console.error('ERROR:', e.message);
  }
}

testDB();
