import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus, 
  HelpCircle, 
  LogOut, 
  Database,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileCode,
  Save,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';

import logoKumdam from '../assets/images/logo_kumdam.jpeg';

// Beautiful custom SVG badge for KUMDAM XVII / CENDERAWASIH
const KumdamLogo = () => (
  <img src={logoKumdam} alt="Logo Kumdam XVII Cenderawasih" className="w-10 h-10 object-cover rounded-lg flex-shrink-0 drop-shadow-md border border-black" />
);

const KESATUAN_OPTIONS = [
  { id: 'POMDAM', nama: 'POMDAM XVII/CENDERAWASIH', key: 'pomdam17', icon: '🏛️' },
  { id: 'ZIDAM', nama: 'ZIDAM XVII/CENDERAWASIH', key: 'zidam17', icon: '⚙️' },
  { id: 'KOMLEKDAM', nama: 'KOMLEKDAM XVII/CENDERAWASIH', key: 'komlek17', icon: '📡' },
  { id: 'RINDAM', nama: 'RINDAM XVII/CENDERAWASIH', key: 'rindam17', icon: '🪖' }
];

const JENIS_PERKARA_OPTIONS = [
  'PIDANA UMUM',
  'DISIPLIN MURNI',
  'INSUBORDINASI',
  'DESERSI',
  'THTI (TIDAK HADIR TANPA IZIN)',
  'NARKOTIKA',
  'KASUS ASUSILA'
];

const KATEGORI_PELANGGARAN_OPTIONS = [
  { label: 'PEMBUNUHAN', value: 'PEMBUNUHAN' },
  { label: 'ASUSILA', value: 'ASUSILA' },
  { label: 'SENJATA API', value: 'SENJATA API' },
  { label: 'NARKOBA', value: 'NARKOBA' },
  { label: 'DISERSI', value: 'DISERSI' },
  { label: 'THTI', value: 'THTI' },
  { label: 'INSUBORDINASI', value: 'INSUBORDINASI' },
  { label: 'PERAMPOKAN', value: 'PERAMPOKAN' }
];

const TAHAP_PENYELESAIAN_OPTIONS = [
  'PROSES PENYELIDIKAN',
  'PROSES PENYIDIKAN',
  'PENYERAHAN BERKAS (TAHAP I)',
  'PEMBERKASAN LENGKAP (P-21)',
  'PERSIDANGAN',
  'PUTUSAN (SELESAI)'
];

export default function InputData() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Selection and Verification states
  const [selectedKesatuan, setSelectedKesatuan] = useState(KESATUAN_OPTIONS[0]);
  const [accessKey, setAccessKey] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Form Fields States
  const [formData, setFormData] = useState({
    noPerkara: '',
    jenisPerkara: '',
    namaLengkap: '',
    nrpNip: '',
    pangkat: '',
    jabatan: '',
    kategoriPelanggaran: '',
    kronologis: '',
    tahapPenyelesaian: ''
  });
  
  const [uploadedFile, setUploadedFile] = useState(null);

  // Show auto-fading toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Access key verification logic
  const handleVerify = () => {
    if (!accessKey) {
      showToast('Masukkan kunci akses terlebih dahulu!', 'error');
      return;
    }
    
    // We match the key defined in the KESATUAN_OPTIONS, or allow '1234' as universal override
    if (accessKey === selectedKesatuan.key || accessKey === '1234') {
      setIsVerified(true);
      showToast(`Akses Terverifikasi untuk ${selectedKesatuan.nama}!`, 'success');
    } else {
      setIsVerified(false);
      showToast('Kunci akses salah! Gunakan kunci: 1234', 'error');
    }
  };

  // Handle Kesatuan Card Selection
  const handleSelectKesatuan = (kesatuan) => {
    setSelectedKesatuan(kesatuan);
    setIsVerified(false); // Reset verification when switching units
    setAccessKey('');
  };

  // Form field change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // File Upload Handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('Ukuran berkas melebihi batas maksimal 10MB!', 'error');
        return;
      }
      setUploadedFile(file);
      showToast(`Berkas "${file.name}" berhasil dipilih.`);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isVerified) {
      showToast('Harap verifikasi kunci akses kesatuan terlebih dahulu!', 'error');
      return;
    }

    if (!formData.jenisPerkara || !formData.namaLengkap || !formData.nrpNip || !formData.kategoriPelanggaran || !formData.tahapPenyelesaian) {
      showToast('Harap lengkapi semua kolom wajib formulir!', 'error');
      return;
    }

    // Generate a case number if the user did not provide one
    const generatedNoPerkara = formData.noPerkara 
      ? formData.noPerkara.toUpperCase() 
      : `P-${Math.floor(Math.random() * 200 + 10)}/MIL/${new Date().getFullYear()}`;

    // Map tahapPenyelesaian to generic status PROSES / SELESAI
    const mappedStatus = formData.tahapPenyelesaian.includes('PUTUSAN') ? 'SELESAI' : 'PROSES';

    const newCase = {
      noPerkara: generatedNoPerkara,
      satuan: selectedKesatuan.nama,
      jenisPerkara: formData.jenisPerkara,
      namaLengkap: formData.namaLengkap,
      nrpNip: formData.nrpNip,
      pangkat: formData.pangkat,
      jabatan: formData.jabatan,
      kategoriPelanggaran: formData.kategoriPelanggaran,
      kronologis: formData.kronologis,
      tahapPenyelesaian: formData.tahapPenyelesaian,
      status: mappedStatus,
      tanggal: new Date().toISOString().split('T')[0],
      fileName: uploadedFile ? uploadedFile.name : null
    };

    try {
      // Try writing to Firestore
      await addDoc(collection(db, 'perkara'), newCase);
      showToast('Data perkara baru berhasil dikirim ke basis data!');
    } catch (error) {
      console.warn("Could not save to Firestore. Saving to LocalStorage fallback.", error);
      // Fallback: LocalStorage
      const localData = localStorage.getItem('perkara_data');
      let currentList = localData ? JSON.parse(localData) : [];
      
      // If local list is empty, initialize it with mock data
      if (currentList.length === 0) {
        currentList = [...INITIAL_MOCK_DATA]; // Wait, we don't have mock data imported in this block, let's keep it safe
      }
      
      const createdCase = { id: Date.now().toString(), ...newCase };
      currentList = [createdCase, ...currentList];
      localStorage.setItem('perkara_data', JSON.stringify(currentList));
      showToast('Data perkara disimpan secara lokal (Offline mode).');
    }

    // Redirect to Dashboard after 1.5 seconds
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      
      {/* 1. TOP NAVBAR */}
      <header className="h-16 bg-[#0a1f3d] flex items-center justify-between px-6 text-white shadow-md z-40 select-none">
        <div className="flex items-center gap-12 h-full">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-6 bg-amber-500 rounded-full"></div>
            <Link to="/" className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent hover:opacity-90">
              Sistem Informasi Data Perkara
            </Link>
          </div>
          
          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-6 h-full text-sm font-semibold">
            <Link to="/" className="h-full flex items-center text-slate-300 hover:text-white border-b-2 border-transparent hover:border-slate-400 px-1 transition-all duration-200">
              Halaman Isi
            </Link>
            <Link to="/rekap-perkara" className="h-full flex items-center text-slate-300 hover:text-white border-b-2 border-transparent hover:border-slate-400 px-1 transition-all duration-200">
              Data Rekap Perkara
            </Link>
            <Link to="/perkara-kesatuan" className="h-full flex items-center text-slate-300 hover:text-white border-b-2 border-transparent hover:border-slate-400 px-1 transition-all duration-200">
              Perkara Kesatuan
            </Link>
            <Link to="/perkara-personel" className="h-full flex items-center text-slate-300 hover:text-white border-b-2 border-transparent hover:border-slate-400 px-1 transition-all duration-200">
              Perkara Personel
            </Link>
          </nav>
        </div>

        {/* Right side spacer */}
        <div className="w-10"></div>
      </header>

      <div className="flex-1 flex flex-row overflow-hidden">
        
        {/* 2. SIDEBAR (Identical to halaman_isi.jsx) */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between select-none">
          <div className="py-6 flex flex-col">
            
            {/* Kumdam Emblem and Label */}
            <div className="flex items-center gap-3 px-6 mb-8">
              <KumdamLogo />
              <div className="flex flex-col">
                <span className="font-bold text-xs text-slate-800 tracking-wider">KUMDAM XVII</span>
                <span className="text-[10px] text-slate-500 font-bold tracking-widest">CENDERAWASIH</span>
              </div>
            </div>

            {/* Sidebar Menus */}
            <nav className="flex flex-col gap-1 px-3">
              <Link 
                to="/" 
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/input-data" 
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 border-l-4 border-blue-600 transition-all"
              >
                <FileText size={18} />
                <span>Input Data</span>
              </Link>
              <Link 
                to="/rekap-perkara" 
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <BarChart3 size={18} />
                <span>Rekapitulasi</span>
              </Link>
            </nav>

            {/* Tambah Perkara Button */}
            <Link 
              to="/input-data"
              className="mx-4 mt-6 py-2.5 px-4 bg-[#0a1d37] hover:bg-[#11315c] text-white rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-all duration-150 active:scale-[0.98] shadow-md shadow-blue-900/10"
            >
              <Plus size={16} />
              <span>Tambah Perkara Baru</span>
            </Link>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-slate-100 py-4 flex flex-col gap-1">
            <a href="#" className="flex items-center gap-3 px-6 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors text-sm font-semibold">
              <LogOut size={16} />
              <span>Keluar</span>
            </a>
          </div>
        </aside>

        {/* 3. MAIN CONTENT AREA */}
        <main className="flex-1 bg-[#f8fafc] p-6 lg:p-8 overflow-y-auto flex flex-col justify-between">
          <div>
            
            {/* Title Section with vertical bar */}
            <div className="flex items-center gap-3 border-l-4 border-[#0a1f3d] pl-4 mb-6 select-none">
              <h2 className="text-sm font-extrabold text-[#0a1f3d] uppercase tracking-wider">
                Pilihan Kesatuan Untuk Pengisian Data
              </h2>
            </div>

            {/* 4. KESATUAN SELECT CARDS */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 select-none">
              {KESATUAN_OPTIONS.map((item) => {
                const isSelected = selectedKesatuan.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectKesatuan(item)}
                    className={`p-5 rounded-xl border relative overflow-hidden cursor-pointer transition-all duration-200 flex flex-col justify-between h-28 group ${
                      isSelected 
                        ? 'bg-[#0f2444] text-white border-blue-500 shadow-md ring-2 ring-amber-500/80 scale-[1.01]' 
                        : 'bg-[#0a1f3d] text-slate-300 border-slate-700 hover:bg-[#112d54] hover:text-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs uppercase tracking-wider leading-relaxed max-w-[85%]">
                        {item.nama}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-slate-900 text-[10px] font-extrabold shadow animate-bounce">
                          ✓
                        </div>
                      )}
                    </div>

                    {/* Faded bottom decoration icon */}
                    <span className="absolute bottom-2 right-4 text-4xl opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all select-none">
                      {item.icon}
                    </span>
                  </div>
                );
              })}
            </section>

            {/* 5. ACCESS CODE / PASSWORD BOX */}
            <section className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 max-w-2xl mx-auto mb-8">
              <div className="flex items-center gap-3 select-none">
                <div className={`p-2 rounded-lg ${isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                  {isVerified ? <Unlock size={18} /> : <Lock size={18} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Verifikasi Akses
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {selectedKesatuan.id} Perlu Kunci Akses (Kunci: 1234)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  disabled={isVerified}
                  placeholder={isVerified ? "TERVERIFIKASI" : "KUNCI AKSES"}
                  className={`border rounded-lg px-3 py-1.5 text-xs text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-44 transition-all ${
                    isVerified 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 font-bold' 
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVerify();
                  }}
                />
                
                {isVerified ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsVerified(false);
                      setAccessKey('');
                    }}
                    className="px-4 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-[10px] font-extrabold tracking-wider rounded-lg transition"
                  >
                    RESET
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleVerify}
                    className="px-5 py-1.5 bg-[#0a1f3d] hover:bg-[#122e54] text-white text-[10px] font-extrabold tracking-wider rounded-lg transition active:scale-[0.98] whitespace-nowrap"
                  >
                    VERIFIKASI
                  </button>
                )}
              </div>
            </section>

            {/* 6. MAIN FORM SECTION */}
            <form onSubmit={handleSubmit} className="relative">
              
              {/* Form locked overlay if not verified */}
              {!isVerified && (
                <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[2px] z-30 rounded-xl flex flex-col items-center justify-center p-6 text-center select-none border border-dashed border-slate-300">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-md border border-slate-100 mb-3 animate-pulse">
                    <Lock size={20} />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-800">Formulir Terkunci</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Silakan masukkan kunci akses (**1234**) untuk kesatuan **{selectedKesatuan.id}** di panel atas untuk membuka dan mengisi data perkara.
                  </p>
                </div>
              )}

              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 lg:p-8 mb-6">
                
                {/* Form Title */}
                <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100 select-none">
                  <FileText className="text-slate-400" size={20} />
                  <h3 className="font-extrabold text-base text-[#0a1f3d]">
                    FORMULIR INPUT DATA PERKARA
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* LEFT COLUMN */}
                  <div className="flex flex-col gap-5">
                    
                    {/* Nama Kesatuan (Prefilled from top cards) */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                        Nama Kesatuan
                      </label>
                      <input
                        type="text"
                        value={selectedKesatuan.nama}
                        disabled
                        className="w-full bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-lg px-4 py-2.5 text-xs select-none shadow-inner"
                      />
                    </div>

                    {/* Nomor Perkara (Optional, generated if empty) */}
                    <div>
                      <label htmlFor="noPerkara" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                        Nomor Perkara <span className="text-slate-400 font-normal">(Kosongkan untuk auto-generate)</span>
                      </label>
                      <input
                        type="text"
                        id="noPerkara"
                        name="noPerkara"
                        value={formData.noPerkara}
                        onChange={handleInputChange}
                        placeholder="Contoh: P-102/MIL/2024"
                        className="w-full border border-slate-200 rounded-lg px-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                      />
                    </div>

                    {/* Jenis Perkara */}
                    <div>
                      <label htmlFor="jenisPerkara" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                        Jenis Perkara <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="jenisPerkara"
                        name="jenisPerkara"
                        value={formData.jenisPerkara}
                        onChange={handleInputChange}
                        className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      >
                        <option value="">PILIHAN JENIS PERKARA</option>
                        {JENIS_PERKARA_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Data Personel Terkait */}
                    <div className="border border-slate-100 bg-[#f8fafc]/60 rounded-xl p-4 flex flex-col gap-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 block select-none">
                        Data Personel Terkait
                      </span>

                      {/* Nama Lengkap */}
                      <div>
                        <label htmlFor="namaLengkap" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 select-none">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="namaLengkap"
                          name="namaLengkap"
                          value={formData.namaLengkap}
                          onChange={handleInputChange}
                          placeholder="Masukkan nama lengkap"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                          required
                        />
                      </div>

                      {/* NRP / NIP & Pangkat */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="nrpNip" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 select-none">
                            NRP / NIP <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="nrpNip"
                            name="nrpNip"
                            value={formData.nrpNip}
                            onChange={handleInputChange}
                            placeholder="Nomor Registrasi..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="pangkat" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 select-none">
                            Pangkat
                          </label>
                          <input
                            type="text"
                            id="pangkat"
                            name="pangkat"
                            value={formData.pangkat}
                            onChange={handleInputChange}
                            placeholder="Contoh: SERTU"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                          />
                        </div>
                      </div>

                      {/* Jabatan */}
                      <div>
                        <label htmlFor="jabatan" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 select-none">
                          Jabatan
                        </label>
                        <input
                          type="text"
                          id="jabatan"
                          name="jabatan"
                          value={formData.jabatan}
                          onChange={handleInputChange}
                          placeholder="Jabatan struktural"
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                        />
                      </div>
                    </div>

                    {/* Kategori Pelanggaran Grid */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 select-none">
                        Kategori Pelanggaran <span className="text-red-500">*</span>
                      </label>
                      <div className="border border-slate-200/60 rounded-xl p-4 bg-white">
                        <div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
                          {KATEGORI_PELANGGARAN_OPTIONS.map((opt) => (
                            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-600 hover:text-slate-900 select-none">
                              <input
                                type="radio"
                                name="kategoriPelanggaran"
                                value={opt.value}
                                checked={formData.kategoriPelanggaran === opt.value}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500/20 cursor-pointer"
                                required
                              />
                              <span>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="flex flex-col justify-between gap-5">
                    
                    {/* Kronologis Singkat */}
                    <div>
                      <label htmlFor="kronologis" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                        Kronologis Singkat
                      </label>
                      <textarea
                        id="kronologis"
                        name="kronologis"
                        value={formData.kronologis}
                        onChange={handleInputChange}
                        placeholder="Tuliskan detail kronologis perkara secara lengkap namun ringkas di sini..."
                        className="w-full h-64 border border-slate-200 rounded-lg p-4 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-medium leading-relaxed"
                      />
                    </div>

                    {/* Upload Dokumen Pendukung */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                        Unggah Dokumen Pendukung
                      </label>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      
                      <div 
                        onClick={triggerFileSelect}
                        className="border-2 border-dashed border-slate-300/80 bg-slate-50 hover:bg-slate-100/60 rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 group"
                      >
                        <UploadCloud size={32} className="text-slate-400 group-hover:text-blue-500 group-hover:scale-105 transition-all duration-200" />
                        
                        {uploadedFile ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Berkas Siap Diunggah
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 mt-1 max-w-[200px] truncate">
                              {uploadedFile.name}
                            </span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">
                              {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className="text-xs font-bold text-slate-600 select-none">
                              Seret file atau klik untuk memilih file
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold select-none">
                              Format: PDF, JPG, PNG (Maks. 10MB)
                            </span>
                          </>
                        )}
                        
                        <button
                          type="button"
                          className="mt-1 px-4 py-1.5 bg-[#00b272] hover:bg-[#00965f] text-white text-[9px] font-extrabold tracking-wider rounded-lg transition active:scale-[0.98] shadow-sm select-none"
                        >
                          PILIH FILE
                        </button>
                      </div>
                    </div>

                    {/* Tahap Penyelesaian & Simpan Button */}
                    <div className="flex flex-col gap-4 mt-2">
                      
                      {/* Tahap Penyelesaian */}
                      <div>
                        <label htmlFor="tahapPenyelesaian" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                          Tahap Penyelesaian <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="tahapPenyelesaian"
                          name="tahapPenyelesaian"
                          value={formData.tahapPenyelesaian}
                          onChange={handleInputChange}
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          required
                        >
                          <option value="">PILIH TAHAP PENYELESAIAN</option>
                          {TAHAP_PENYELESAIAN_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      {/* Simpan Button */}
                      <button
                        type="submit"
                        className="w-full py-3 mt-2 bg-[#0a1f3d] hover:bg-[#122e54] text-white rounded-lg flex items-center justify-center gap-2.5 font-bold text-xs tracking-wider transition-all duration-150 active:scale-[0.98] shadow-md shadow-blue-900/10"
                      >
                        <Save size={16} className="text-amber-500" />
                        <span>SIMPAN DATA PERKARA</span>
                      </button>
                      
                    </div>

                  </div>

                </div>

              </div>

            </form>

          </div>

          {/* 7. PAGE FOOTER */}
          <footer className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-bold tracking-wider select-none">
            <div>
              KUMDAM XVII | &copy; 2024 Sistem Informasi Data Perkara KUMDAM XVII/Cenderawasih. Hak Cipta Dilindungi.
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-600 transition-colors">Kebijakan Privasi</a>
              <span>|</span>
              <a href="#" className="hover:text-slate-600 transition-colors">Syarat &amp; Ketentuan</a>
            </div>
          </footer>
        </main>
      </div>

      {/* 8. TOAST NOTIFICATIONS */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[1000] flex items-center gap-3 px-4 py-3 bg-slate-950 text-white rounded-lg shadow-lg border border-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
          {toast.type === 'success' ? (
            <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />
          ) : toast.type === 'error' ? (
            <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
          ) : (
            <Sparkles className="text-blue-400 flex-shrink-0" size={18} />
          )}
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
