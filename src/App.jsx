import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { DataProvider } from './context/DataContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScanAbsensiPage from './pages/ScanAbsensiPage';
import DataSiswaPage from './pages/DataSiswaPage';
import RiwayatAbsensiPage from './pages/RiwayatAbsensiPage';
import RekapMingguanPage from './pages/RekapMingguanPage';
import RekapBulananPage from './pages/RekapBulananPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <DataProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="scan" element={<ScanAbsensiPage />} />
                <Route path="siswa" element={<DataSiswaPage />} />
                <Route path="riwayat" element={<RiwayatAbsensiPage />} />
                <Route path="rekap-mingguan" element={<RekapMingguanPage />} />
                <Route path="rekap-bulanan" element={<RekapBulananPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </DataProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
