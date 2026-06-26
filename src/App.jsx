import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HalamanIsi from './pages/halaman_isi.jsx';
import InputData from './pages/input_data.jsx';
import DataRekapPerkara from './pages/data_rekap_perkara.jsx';
import PerkaraKesatuan from './pages/perkara_kesatuan.jsx';
import PerkaraPersonel from './pages/perkara_personel.jsx';
import Login from './pages/login.jsx';
import EditData from './pages/edit_data.jsx';

// Route protection guard
function ProtectedRoute({ children }) {
  const isAuthenticated = sessionStorage.getItem('main_auth') === 'true';
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <HalamanIsi />
          </ProtectedRoute>
        } />
        
        <Route path="/input-data" element={
          <ProtectedRoute>
            <InputData />
          </ProtectedRoute>
        } />
        
        <Route path="/rekap-perkara" element={
          <ProtectedRoute>
            <DataRekapPerkara />
          </ProtectedRoute>
        } />
        
        <Route path="/edit-data/:id" element={
          <ProtectedRoute>
            <EditData />
          </ProtectedRoute>
        } />
        
        <Route path="/perkara-kesatuan" element={
          <ProtectedRoute>
            <PerkaraKesatuan />
          </ProtectedRoute>
        } />
        
        <Route path="/perkara-personel" element={
          <ProtectedRoute>
            <PerkaraPersonel />
          </ProtectedRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
