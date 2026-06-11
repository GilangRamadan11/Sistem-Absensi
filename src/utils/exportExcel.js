// Export utilities for Excel
import * as XLSX from 'xlsx-js-style';

export function exportToExcel(data, filename, sheetName = 'Sheet1', title = null) {
  let worksheet;

  if (title) {
    // Jika ada judul, buat baris pertama berisi judul, baris kedua kosong
    worksheet = XLSX.utils.aoa_to_sheet([[title], []]);
    // Gabungkan (merge) sel judul agar memanjang (misal dari A1 sampai F1, tergantung jumlah data)
    const colCount = Object.keys(data[0] || {}).length;
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(colCount - 1, 0) } }];
    
    // Tambahkan style untuk teks Judul di baris pertama (Sel A1)
    if (worksheet['A1']) {
      worksheet['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { vertical: 'center', horizontal: 'center' }
      };
    }
    
    // Masukkan data JSON mulai dari baris ketiga (A3)
    XLSX.utils.sheet_add_json(worksheet, data, { origin: 'A3', skipHeader: false });
  } else {
    // Jika tidak ada judul, langsung render JSON
    worksheet = XLSX.utils.json_to_sheet(data);
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.max(key.length, ...data.map((row) => String(row[key] || '').length)) + 2,
  }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
