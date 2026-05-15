import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { getTodayStr } from '../utils/dateUtils';
import { useToast } from './ToastContext';

const DataContext = createContext(null);

const api = axios.create({
  baseURL: '/api'
});

export function DataProvider({ children }) {
  const [siswaList, setSiswaList] = useState([]);
  const [absensiList, setAbsensiList] = useState([]);
  const [todayStats, setTodayStats] = useState({ total: 0, hadir: 0, tidakHadir: 0, absensiHariIni: [] });
  const { addToast } = useToast();

  // Load initial data
  const fetchData = useCallback(async () => {
    try {
      const [siswaRes, absensiRes, statsRes] = await Promise.all([
        api.get('/siswa'),
        api.get('/absensi'),
        api.get('/dashboard/stats')
      ]);
      setSiswaList(siswaRes.data);
      setAbsensiList(absensiRes.data);
      setTodayStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      addToast('Gagal memuat data dari server', 'error');
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---- SISWA CRUD ----
  const addSiswa = useCallback(async (siswa) => {
    try {
      const res = await api.post('/siswa', siswa);
      setSiswaList(prev => [...prev, res.data]);
      fetchData(); // Refresh stats
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.error || 'Gagal menambah siswa';
      addToast(msg, 'error');
      throw error;
    }
  }, [addToast, fetchData]);

  const updateSiswa = useCallback(async (id, data) => {
    try {
      await api.put(`/siswa/${id}`, data);
      setSiswaList(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
      fetchData(); // refresh in case it affects absensi names
    } catch (error) {
      addToast('Gagal mengupdate siswa', 'error');
    }
  }, [addToast, fetchData]);

  const deleteSiswa = useCallback(async (id) => {
    try {
      await api.delete(`/siswa/${id}`);
      setSiswaList(prev => prev.filter(s => s.id !== id));
      setAbsensiList(prev => prev.filter(a => a.siswa_id !== id && a.siswaId !== id)); // Handle both casing
      fetchData();
    } catch (error) {
      addToast('Gagal menghapus siswa', 'error');
    }
  }, [addToast, fetchData]);

  const uploadSiswaBulk = useCallback(async (dataArray) => {
    try {
      const res = await api.post('/siswa/bulk', dataArray);
      addToast(res.data.message, 'success');
      fetchData(); // Refresh list from server
      return res.data;
    } catch (error) {
      addToast(error.response?.data?.error || 'Gagal mengupload data massal', 'error');
      throw error;
    }
  }, [addToast, fetchData]);

  const getSiswaByNis = useCallback((nis) => {
    return siswaList.find((s) => s.nis === nis);
  }, [siswaList]);

  // ---- ABSENSI ----
  const addAbsensi = useCallback(async (siswaId, status = 'Hadir', tanggal = null) => {
    try {
      const siswa = siswaList.find(s => s.id === siswaId);
      if (!siswa) return { success: false, message: 'Siswa tidak ditemukan' };

      const payload = { nis: siswa.nis, status };
      if (tanggal) payload.tanggal = tanggal;

      const res = await api.post('/absensi', payload);
      setAbsensiList(prev => [res.data.data, ...prev]);
      fetchData(); // Refresh stats
      return { success: true, message: res.data.message, data: res.data.data };
    } catch (error) {
      if (error.response?.status === 400) {
        return { success: false, message: error.response.data.message, data: error.response.data.data };
      }
      return { success: false, message: 'Gagal mencatat absensi' };
    }
  }, [siswaList, fetchData]);

  const updateAbsensiStatus = useCallback(async (absensiId, newStatus) => {
    try {
      await api.put(`/absensi/${absensiId}`, { status: newStatus });
      setAbsensiList(prev =>
        prev.map(a => (a.id === absensiId ? { ...a, status: newStatus } : a))
      );
      fetchData();
    } catch (error) {
      addToast('Gagal mengupdate status absensi', 'error');
    }
  }, [addToast, fetchData]);

  const getAbsensiByDate = useCallback((date) => {
    return absensiList.filter((a) => a.tanggal === date);
  }, [absensiList]);

  const getAbsensiRange = useCallback((startDate, endDate) => {
    return absensiList.filter((a) => a.tanggal >= startDate && a.tanggal <= endDate);
  }, [absensiList]);

  const getTodayStats = useCallback(() => {
    return todayStats;
  }, [todayStats]);

  return (
    <DataContext.Provider
      value={{
        siswaList,
        absensiList,
        addSiswa,
        updateSiswa,
        deleteSiswa,
        uploadSiswaBulk,
        getSiswaByNis,
        addAbsensi,
        updateAbsensiStatus,
        getAbsensiByDate,
        getAbsensiRange,
        getTodayStats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData harus di dalam DataProvider');
  return ctx;
}
