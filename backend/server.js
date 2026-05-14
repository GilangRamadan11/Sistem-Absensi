const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to get today's date string (YYYY-MM-DD)
const getTodayStr = () => new Date().toISOString().split('T')[0];
const bcrypt = require('bcryptjs');

// ==========================================
// AUTH ROUTES
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  const { nama, email, password } = req.body;
  
  try {
    const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
      'INSERT INTO users (nama, email, password) VALUES (?, ?, ?)',
      [nama, email, hashedPassword]
    );

    res.status(201).json({ success: true, message: 'Registrasi berhasil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ? OR nama = ?', [identifier, identifier]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau Username tidak terdaftar' });
    }
    
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Password salah' });
    }
    
    const userData = { id: user.id, nama: user.nama, email: user.email };
    res.json({ success: true, user: userData, message: 'Login berhasil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// ==========================================
// SISWA ROUTES
// ==========================================

// Get all siswa
app.get('/api/siswa', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM siswa ORDER BY nama ASC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Add new siswa
app.post('/api/siswa', async (req, res) => {
  const { nama, nis, kelas, tahun_ajaran = '2025/2026' } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO siswa (nama, nis, kelas, tahun_ajaran) VALUES (?, ?, ?, ?)',
      [nama, nis, kelas, tahun_ajaran]
    );
    const newSiswa = { id: result.insertId, nama, nis, kelas, tahun_ajaran };
    res.status(201).json(newSiswa);
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'NIS sudah terdaftar' });
    }
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Update siswa
app.put('/api/siswa/:id', async (req, res) => {
  const { id } = req.params;
  const { nama, nis, kelas, tahun_ajaran } = req.body;
  try {
    await db.query(
      'UPDATE siswa SET nama = ?, nis = ?, kelas = ?, tahun_ajaran = ? WHERE id = ?',
      [nama, nis, kelas, tahun_ajaran, id]
    );
    res.json({ success: true, message: 'Data siswa diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Bulk upsert siswa
app.post('/api/siswa/bulk', async (req, res) => {
  const students = req.body; // array of {nama, nis, kelas, tahun_ajaran}
  if (!Array.isArray(students) || students.length === 0) {
    return res.status(400).json({ error: 'Payload tidak valid' });
  }

  try {
    const values = students.map(s => [s.nama, s.nis, s.kelas, s.tahun_ajaran || '2025/2026']);
    
    const sql = `
      INSERT INTO siswa (nama, nis, kelas, tahun_ajaran) 
      VALUES ?
      ON DUPLICATE KEY UPDATE 
      nama = VALUES(nama), 
      kelas = VALUES(kelas), 
      tahun_ajaran = VALUES(tahun_ajaran)
    `;
    
    await db.query(sql, [values]);
    
    res.json({ success: true, message: `Berhasil memproses ${students.length} data siswa` });
  } catch (error) {
    console.error('Bulk insert error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses data massal' });
  }
});

// Delete siswa
app.delete('/api/siswa/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM siswa WHERE id = ?', [id]);
    res.json({ success: true, message: 'Data siswa dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// ==========================================
// ABSENSI ROUTES
// ==========================================

// Get absensi (supports optional query params: startDate, endDate, tanggal)
app.get('/api/absensi', async (req, res) => {
  const { tanggal, startDate, endDate } = req.query;
  let query = `
    SELECT a.*, a.siswa_id as siswaId, s.nama, s.nis, s.kelas 
    FROM absensi a 
    JOIN siswa s ON a.siswa_id = s.id 
  `;
  const params = [];

  if (tanggal) {
    query += ' WHERE a.tanggal = ?';
    params.push(tanggal);
  } else if (startDate && endDate) {
    query += ' WHERE a.tanggal BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  
  query += ' ORDER BY a.tanggal DESC, a.created_at DESC';

  try {
    const [rows] = await db.query(query, params);
    
    // Format tanggal ke YYYY-MM-DD
    const formattedRows = rows.map(r => {
      const d = new Date(r.tanggal);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return {
        ...r,
        jamMasuk: r.jam_masuk,
        tanggal: d.toISOString().split('T')[0]
      };
    });
    
    res.json(formattedRows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Add absensi (Scan QR)
app.post('/api/absensi', async (req, res) => {
  const { nis, status = 'Hadir' } = req.body;
  
  try {
    // Cari siswa berdasarkan NIS
    const [siswaRows] = await db.query('SELECT * FROM siswa WHERE nis = ?', [nis]);
    if (siswaRows.length === 0) {
      return res.status(404).json({ success: false, message: 'QR Code / NIS tidak dikenali' });
    }
    const siswa = siswaRows[0];

    const today = req.body.tanggal || getTodayStr();
    
    // Siapkan jam_masuk jika Hadir
    let jamMasuk = null;
    if (status === 'Hadir') {
      const now = new Date();
      jamMasuk = `0${now.getHours()}`.slice(-2) + ':' + `0${now.getMinutes()}`.slice(-2) + ':00';
    }

    try {
      const [result] = await db.query(
        'INSERT INTO absensi (siswa_id, tanggal, status, jam_masuk) VALUES (?, ?, ?, ?)',
        [siswa.id, today, status, jamMasuk]
      );
      
      const newAbsensi = {
        id: result.insertId,
        siswaId: siswa.id,
        nama: siswa.nama,
        nis: siswa.nis,
        kelas: siswa.kelas,
        tanggal: today,
        status,
        jamMasuk
      };
      
      res.status(201).json({ success: true, message: 'Absensi berhasil', data: newAbsensi, siswa });
    } catch (insertError) {
      // ER_DUP_ENTRY karena constraint UNIQUE(siswa_id, tanggal)
      if (insertError.code === 'ER_DUP_ENTRY') {
        const [existing] = await db.query('SELECT * FROM absensi WHERE siswa_id = ? AND tanggal = ?', [siswa.id, today]);
        return res.status(400).json({ 
          success: false, 
          message: 'Sudah absen hari ini', 
          data: existing[0],
          siswa
        });
      }
      throw insertError;
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
});

// Update absensi status (Manual)
app.put('/api/absensi/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE absensi SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'Status absensi diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// ==========================================
// DASHBOARD ROUTES
// ==========================================

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const today = getTodayStr();
    
    // Total Siswa
    const [totalSiswaRows] = await db.query('SELECT COUNT(*) as total FROM siswa');
    const totalSiswa = totalSiswaRows[0].total;

    // Absensi Hari Ini
    const [absensiTodayRows] = await db.query(`
      SELECT a.*, a.siswa_id as siswaId, s.nama, s.nis, s.kelas 
      FROM absensi a 
      JOIN siswa s ON a.siswa_id = s.id 
      WHERE a.tanggal = ?
      ORDER BY a.created_at DESC
    `, [today]);

    // Format tanggal
    const absensiHariIni = absensiTodayRows.map(r => {
      const d = new Date(r.tanggal);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      return {
        ...r,
        jamMasuk: r.jam_masuk,
        tanggal: d.toISOString().split('T')[0]
      };
    });

    const hadir = absensiHariIni.filter(a => a.status === 'Hadir').length;
    const tidakHadir = totalSiswa - hadir;

    res.json({
      total: totalSiswa,
      hadir,
      tidakHadir,
      absensiHariIni
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server backend berjalan di http://localhost:${PORT}`);
});
