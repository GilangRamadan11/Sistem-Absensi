// Dummy data & constants for Sistem Absensi SDN 128 Haurpancuh

// Daftar kelas: satu sumber data untuk seluruh aplikasi
export const KELAS_LIST = [
  '1A', '1B', '1C', '1D',
  '2A', '2B', '2C', '2D',
  '3A', '3B', '3C', '3D',
  '4A', '4B', '4C', '4D',
  '5A', '5B', '5C', '5D',
  '6A', '6B', '6C', '6D',
];

export const STATUS_LIST = ['Hadir', 'Izin', 'Sakit', 'Alpha'];

export const STATUS_COLORS = {
  Hadir: 'hadir',
  Izin: 'izin',
  Sakit: 'sakit',
  Alpha: 'alpha',
};

export const HARI_SEKOLAH = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export const DUMMY_SISWA = [
  { id: 1, nama: 'Ahmad Fauzi', nis: '20240001', kelas: '1A', foto: null },
  { id: 2, nama: 'Siti Nurhaliza', nis: '20240002', kelas: '1B', foto: null },
  { id: 3, nama: 'Budi Santoso', nis: '20240003', kelas: '2A', foto: null },
  { id: 4, nama: 'Rina Wulandari', nis: '20240004', kelas: '2B', foto: null },
  { id: 5, nama: 'Dimas Prasetyo', nis: '20240005', kelas: '3A', foto: null },
  { id: 6, nama: 'Anisa Rahma', nis: '20240006', kelas: '3B', foto: null },
  { id: 7, nama: 'Rizki Ramadhan', nis: '20240007', kelas: '4A', foto: null },
  { id: 8, nama: 'Dewi Lestari', nis: '20240008', kelas: '4B', foto: null },
  { id: 9, nama: 'Fajar Nugroho', nis: '20240009', kelas: '5A', foto: null },
  { id: 10, nama: 'Putri Ayu', nis: '20240010', kelas: '5B', foto: null },
  { id: 11, nama: 'Hendra Wijaya', nis: '20240011', kelas: '6A', foto: null },
  { id: 12, nama: 'Lina Marlina', nis: '20240012', kelas: '6B', foto: null },
  { id: 13, nama: 'Andi Saputra', nis: '20240013', kelas: '1C', foto: null },
  { id: 14, nama: 'Mega Puspita', nis: '20240014', kelas: '2C', foto: null },
  { id: 15, nama: 'Yusuf Hakim', nis: '20240015', kelas: '3C', foto: null },
  { id: 16, nama: 'Nur Aisyah', nis: '20240016', kelas: '4C', foto: null },
  { id: 17, nama: 'Rendi Kurniawan', nis: '20240017', kelas: '5C', foto: null },
  { id: 18, nama: 'Citra Dewi', nis: '20240018', kelas: '6C', foto: null },
  { id: 19, nama: 'Bagus Setiawan', nis: '20240019', kelas: '1D', foto: null },
  { id: 20, nama: 'Wulan Sari', nis: '20240020', kelas: '2D', foto: null },
  { id: 21, nama: 'Taufik Hidayat', nis: '20240021', kelas: '3D', foto: null },
  { id: 22, nama: 'Sri Wahyuni', nis: '20240022', kelas: '4D', foto: null },
  { id: 23, nama: 'Gilang Ramadhan', nis: '20240023', kelas: '5D', foto: null },
  { id: 24, nama: 'Indah Permata', nis: '20240024', kelas: '6D', foto: null },
];

// Generate dummy absensi for the past 30 days
function generateDummyAbsensi(siswaList) {
  const absensi = [];
  const today = new Date();
  let id = 1;

  for (let d = 29; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    
    // Skip Sunday (0)
    if (date.getDay() === 0) continue;

    for (const siswa of siswaList) {
      const rand = Math.random();
      let status;
      if (rand < 0.82) status = 'Hadir';
      else if (rand < 0.90) status = 'Izin';
      else if (rand < 0.96) status = 'Sakit';
      else status = 'Alpha';

      const jam = `0${7 + Math.floor(Math.random() * 2)}`.slice(-2);
      const menit = `0${Math.floor(Math.random() * 30)}`.slice(-2);

      absensi.push({
        id: id++,
        siswaId: siswa.id,
        nama: siswa.nama,
        nis: siswa.nis,
        kelas: siswa.kelas,
        tanggal: date.toISOString().split('T')[0],
        status: status,
        jamMasuk: status === 'Hadir' ? `${jam}:${menit}` : null,
      });
    }
  }

  return absensi;
}

export const DUMMY_ABSENSI = generateDummyAbsensi(DUMMY_SISWA);

export const GURU_CREDENTIALS = {
  username: 'guru',
  password: 'guru123',
  nama: 'Ibu Sari',
};
