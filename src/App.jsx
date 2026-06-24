import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HalamanIsi from './pages/halaman_isi.jsx';
import InputData from './pages/input_data.jsx';
import DataRekapPerkara from './pages/data_rekap_perkara.jsx';
import PerkaraKesatuan from './pages/perkara_kesatuan.jsx';
import PerkaraPersonel from './pages/perkara_personel.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Main page matching the requested Halaman Isi */}
        <Route path="/" element={<HalamanIsi />} />
        
        {/* Input Data Perkara page */}
        <Route path="/input-data" element={<InputData />} />
        
        {/* Rekapitulasi Data Perkara page */}
        <Route path="/rekap-perkara" element={<DataRekapPerkara />} />
        
        {/* Perkara Kesatuan page */}
        <Route path="/perkara-kesatuan" element={<PerkaraKesatuan />} />
        
        {/* Perkara Personel page */}
        <Route path="/perkara-personel" element={<PerkaraPersonel />} />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
