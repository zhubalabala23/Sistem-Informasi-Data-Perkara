import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  HelpCircle, 
  LogOut, 
  Database, 
  X,
  CheckCircle2,
  AlertCircle,
  Menu,
  User
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

// Initial data matching the mockup exactly
const INITIAL_MOCK_DATA = [];

import logoKumdam from '../assets/images/logo_kumdam.jpeg';

// Beautiful custom SVG badge for KUMDAM XVII / CENDERAWASIH
const KumdamLogo = () => (
  <img src={logoKumdam} alt="Logo Kumdam XVII Cenderawasih" className="w-10 h-10 object-cover rounded-lg flex-shrink-0 drop-shadow-md border border-black" />
);

export default function HalamanIsi() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const isKesatuanVerified = sessionStorage.getItem('is_kesatuan_verified') === 'true';
  const activeKesatuan = (() => {
    const saved = sessionStorage.getItem('selected_kesatuan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  })();
  // Set initial state from LocalStorage immediately to render in 0ms
  const [perkaraList, setPerkaraList] = useState(() => {
    const localData = localStorage.getItem('perkara_data');
    return localData ? JSON.parse(localData) : [];
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(() => {
    const localData = localStorage.getItem('perkara_data');
    return !localData || JSON.parse(localData).length === 0;
  });
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [selectedCaseDetail, setSelectedCaseDetail] = useState(null);

  // Form states for new case
  const [formData, setFormData] = useState({
    noPerkara: '',
    satuan: '',
    jenisPerkara: '',
    status: 'PROSES',
    tanggal: new Date().toISOString().split('T')[0]
  });

  // Load cases from Firestore or local fallback
  const fetchPerkara = async () => {
    try {
      const q = query(collection(db, 'perkara'), orderBy('tanggal', 'desc'));
      const querySnapshot = await getDocs(q);
      const firestoreItems = [];
      querySnapshot.forEach((doc) => {
        firestoreItems.push({ id: doc.id, ...doc.data() });
      });

      // Get current local items
      const localData = localStorage.getItem('perkara_data');
      const localList = localData ? JSON.parse(localData) : [];

      // Combine: Firestore first, then only offline-created items from LocalStorage
      const uniqueList = [];
      const seen = new Set();
      firestoreItems.forEach(item => {
        const key = item.noPerkara || item.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueList.push(item);
        }
      });

      localList.forEach(item => {
        const key = item.noPerkara || item.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueList.push(item);
        }
      });

      // Save back to LocalStorage to keep in sync
      localStorage.setItem('perkara_data', JSON.stringify(uniqueList));
      setPerkaraList(uniqueList);
    } catch (error) {
      console.warn("Firestore sync failed. Using LocalStorage offline.", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerkara();
  }, []);

  // Show auto-fading toast
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit new case to Firestore and local fallback
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.noPerkara || !formData.satuan || !formData.jenisPerkara) {
      showToast('Harap isi semua kolom formulir!', 'error');
      return;
    }

    const newCase = {
      noPerkara: formData.noPerkara.toUpperCase(),
      satuan: formData.satuan.toUpperCase(),
      jenisPerkara: formData.jenisPerkara.toUpperCase(),
      status: formData.status,
      tanggal: formData.tanggal
    };

    try {
      // Try adding to Firestore
      const docRef = await addDoc(collection(db, 'perkara'), newCase);
      showToast('Data perkara berhasil disimpan to Firestore!');
      fetchPerkara();
    } catch (error) {
      console.warn("Could not save to Firestore, saving to LocalStorage instead.", error);
      // Fallback: LocalStorage
      const localData = localStorage.getItem('perkara_data');
      let currentList = localData ? JSON.parse(localData) : INITIAL_MOCK_DATA;
      const createdCase = { id: Date.now().toString(), isOfflineCreated: true, ...newCase };
      currentList = [createdCase, ...currentList];
      localStorage.setItem('perkara_data', JSON.stringify(currentList));
      setPerkaraList(currentList);
      showToast('Data perkara disimpan secara lokal (Offline mode).');
    }

    // Reset Form & Close Modal
    setFormData({
      noPerkara: '',
      satuan: '',
      jenisPerkara: '',
      status: 'PROSES',
      tanggal: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(false);
  };

  // Stats Calculations from real data list
  const calculateStats = () => {
    const totalPerkara = perkaraList.length;
    
    // Find unique units (satuan)
    const uniqueSatuans = new Set(
      perkaraList.map(item => item.satuan?.toUpperCase().trim()).filter(Boolean)
    );
    const totalSatuan = uniqueSatuans.size;

    // Find completed cases
    const totalSelesai = perkaraList.filter(item => item.status === 'SELESAI').length;

    return {
      totalPerkara: totalPerkara.toLocaleString('en-US'),
      totalSatuan: totalSatuan.toString(),
      totalSelesai: totalSelesai.toLocaleString('en-US')
    };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 h-16 bg-[#0a1f3d] flex items-center justify-between px-6 text-white shadow-md z-50 select-none">
        <div className="flex items-center gap-4 md:gap-12 h-full min-w-0">
          <button 
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 -ml-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-2.5 h-6 bg-amber-500 rounded-full"></div>
            <Link to="/" className="font-bold text-sm md:text-lg tracking-wide bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent hover:opacity-90">
              <span className="inline sm:hidden">SI Data Perkara</span>
              <span className="hidden sm:inline">Sistem Informasi Data Perkara</span>
            </Link>
          </div>
          
          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-6 h-full text-sm font-semibold">
            <Link to="/" className="h-full flex items-center text-white border-b-2 border-white px-1 transition-all duration-200">
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

        {/* Right side Profile */}
        {isKesatuanVerified && activeKesatuan && (
          <div className="flex items-center gap-2 bg-[#ffffff10] border border-[#ffffff15] rounded-full pl-3 pr-4 py-1.5 max-w-[150px] sm:max-w-xs md:max-w-md select-none flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-[#0a1f3d] flex items-center justify-center shadow-sm flex-shrink-0">
              <User size={14} className="stroke-[3]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                Akses Satuan
              </span>
              <span className="text-[10px] sm:text-[11px] font-extrabold text-white truncate max-w-[80px] sm:max-w-[150px] md:max-w-[200px] leading-tight mt-0.5" title={activeKesatuan.nama}>
                {activeKesatuan.nama}
              </span>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-row overflow-hidden">
        
        {/* Backdrop for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* 2. SIDEBAR */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between select-none transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="py-6 flex flex-col">
            
            {/* Kumdam Emblem and Label */}
            <div className="flex items-center justify-between px-6 mb-8">
              <div className="flex items-center gap-3">
                <KumdamLogo />
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-slate-800 tracking-wider">KUMDAM XVII</span>
                  <span className="text-[10px] text-slate-500 font-bold tracking-widest">CENDERAWASIH</span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sidebar Menus */}
            <nav className="flex flex-col gap-1 px-3">
              {/* DESKTOP-ONLY LINK */}
              <Link 
                to="/" 
                className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 border-l-4 border-blue-600 transition-all"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>

              {/* MOBILE-ONLY LINK */}
              <Link 
                to="/" 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 border-l-4 border-blue-600 transition-all"
              >
                <LayoutDashboard size={18} />
                <span>Halaman Isi</span>
              </Link>

              <Link 
                to="/input-data" 
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all text-left"
              >
                <FileText size={18} />
                <span>Input Data</span>
              </Link>

              {/* DESKTOP-ONLY LINK */}
              <Link 
                to="/rekap-perkara" 
                className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <BarChart3 size={18} />
                <span>Rekapitulasi</span>
              </Link>

              {/* MOBILE-ONLY LINK */}
              <Link 
                to="/rekap-perkara" 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <BarChart3 size={18} />
                <span>Data Rekap Perkara</span>
              </Link>

              <Link 
                to="/perkara-kesatuan" 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <Database size={18} />
                <span>Perkara Kesatuan</span>
              </Link>

              <Link 
                to="/perkara-personel" 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <User size={18} />
                <span>Perkara Personel</span>
              </Link>
            </nav>

            {/* Tambah Perkara Button */}
            <Link 
              to="/input-data"
              onClick={() => setIsSidebarOpen(false)}
              className="mx-4 mt-6 py-2.5 px-4 bg-[#0a1d37] hover:bg-[#11315c] text-white rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-all duration-150 active:scale-[0.98] shadow-md shadow-blue-900/10"
            >
              <Plus size={16} />
              <span>Tambah Perkara Baru</span>
            </Link>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t border-slate-100 py-4 flex flex-col gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsLogoutModalOpen(true);
              }}
              className="flex items-center gap-3 px-6 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors text-sm font-semibold w-full text-left"
            >
              <LogOut size={16} />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        {/* 3. MAIN CONTENT AREA */}
        <main className="flex-1 bg-[#f8fafc] p-6 lg:p-8 overflow-y-auto flex flex-col justify-between">
          <div>
            {/* Breadcrumb */}
            <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-1 select-none">
              DASHBOARD &gt; HALAMAN ISI
            </div>

            {/* Header Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0a1f3d] tracking-tight">
                  DATA PERKARA DI SATUAN KUMDAM XVII/CENDERAWASIH
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Laporan Ringkasan Status dan Rekapitulasi Perkara Terkini
                </p>
              </div>

            </div>

            {/* 4. STATS CARDS SECTION */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 select-none">
              
              {/* Card 1: Jumlah Perkara */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest block uppercase">
                      Jumlah Perkara
                    </span>
                    <span className="text-3xl font-extrabold text-[#0a1f3d] mt-2 block">
                      {stats.totalPerkara}
                    </span>
                  </div>
                  {/* Subtle Card Icon decoration */}
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <FileText size={24} />
                  </div>
                </div>
                
                <div className="border-t border-slate-100 mt-4 pt-3 flex items-center gap-2 text-[10px] text-blue-600 font-bold">
                  <Database size={12} className="flex-shrink-0" />
                  <span>DIAMBIL DARI: JUMLAH ISI DATA REKAP PERKARA</span>
                </div>
              </div>

              {/* Card 2: Jumlah Satuan Terkait */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest block uppercase">
                      Jumlah Satuan Terkait
                    </span>
                    <span className="text-3xl font-extrabold text-[#0a1f3d] mt-2 block">
                      {stats.totalSatuan}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-300 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                    <Database size={24} />
                  </div>
                </div>
                
                <div className="border-t border-slate-100 mt-4 pt-3 flex items-center gap-2 text-[10px] text-blue-600 font-bold">
                  <Database size={12} className="flex-shrink-0" />
                  <span>DIAMBIL DARI: JUMLAH SATUAN YANG ADA PERKARANYA</span>
                </div>
              </div>

              {/* Card 3: Perkara Selesai */}
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 tracking-widest block uppercase">
                      Perkara Selesai
                    </span>
                    <span className="text-3xl font-extrabold text-[#0a1f3d] mt-2 block">
                      {stats.totalSelesai}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                    <CheckCircle2 size={24} />
                  </div>
                </div>
                
                <div className="border-t border-slate-100 mt-4 pt-3 flex items-center gap-2 text-[10px] text-blue-600 font-bold">
                  <Database size={12} className="flex-shrink-0" />
                  <span>DIAMBIL DARI: PUTUSAN DI DATA REKAP PERKARA</span>
                </div>
              </div>

            </section>

            {/* 5. TABLE SECTION */}
            <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-6">
              
              {/* Table Header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
                <h2 className="text-base font-extrabold text-[#0a1f3d]">
                  Preview Data Perkara Terbaru
                </h2>
                <button 
                  onClick={() => showToast('Membuka seluruh data perkara...', 'info')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline transition-colors"
                >
                  <span>Lihat Semua Data</span>
                  <span>&rarr;</span>
                </button>
              </div>

              {/* Actual Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none border-b border-slate-200/60">
                    <tr>
                      <th scope="col" className="px-6 py-3.5">No. Perkara</th>
                      <th scope="col" className="px-6 py-3.5">Satuan</th>
                      <th scope="col" className="px-6 py-3.5">Jenis Perkara</th>
                      <th scope="col" className="px-6 py-3.5">Status</th>
                      <th scope="col" className="px-6 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                          Memuat data perkara...
                        </td>
                      </tr>
                    ) : perkaraList.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                          Belum ada data perkara. Silakan tambahkan perkara baru!
                        </td>
                      </tr>
                    ) : (
                      perkaraList.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-[#0a1f3d] tracking-wide">
                            {item.noPerkara}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-semibold text-xs">
                            {item.satuan}
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                            {item.jenisPerkara}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              item.status === 'SELESAI' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => setSelectedCaseDetail(item)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Lihat Detail Perkara"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* 6. PAGE FOOTER */}
          <footer className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-bold tracking-wider select-none">
            <div>
              KUMDAM XVII | &copy; 2026 Sistem Informasi Data Perkara KUMDAM XVII/Cenderawasih. Hak Cipta Dilindungi.
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-slate-600 transition-colors">Kebijakan Privasi</a>
              <span>|</span>
              <a href="#" className="hover:text-slate-600 transition-colors">Syarat &amp; Ketentuan</a>
            </div>
          </footer>
        </main>
      </div>

      {/* 7. FORM MODAL: TAMBAH PERKARA BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#0a1f3d] text-white flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-amber-500" />
                <h3 className="font-extrabold text-sm tracking-wide">
                  TAMBAH DATA PERKARA BARU
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 flex flex-col gap-4">
                
                {/* No Perkara */}
                <div>
                  <label htmlFor="noPerkara" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Nomor Perkara <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="noPerkara"
                    name="noPerkara"
                    value={formData.noPerkara}
                    onChange={handleInputChange}
                    placeholder="Contoh: P-102/MIL/2024"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                    required
                  />
                </div>

                {/* Satuan */}
                <div>
                  <label htmlFor="satuan" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Satuan Terkait <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="satuan"
                    name="satuan"
                    value={formData.satuan}
                    onChange={handleInputChange}
                    placeholder="Contoh: KODIM 1701/JAYAPURA"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                    required
                  />
                </div>

                {/* Jenis Perkara */}
                <div>
                  <label htmlFor="jenisPerkara" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                    Jenis Perkara <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="jenisPerkara"
                    name="jenisPerkara"
                    value={formData.jenisPerkara}
                    onChange={handleInputChange}
                    placeholder="Contoh: DISIPLIN MURNI atau PIDANA UMUM"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                    required
                  />
                </div>

                {/* Grid for Status and Date */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Status */}
                  <div>
                    <label htmlFor="status" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                      Status Perkara
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-[#0a1f3d]"
                    >
                      <option value="PROSES">PROSES</option>
                      <option value="SELESAI">SELESAI</option>
                    </select>
                  </div>

                  {/* Tanggal */}
                  <div>
                    <label htmlFor="tanggal" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                      Tanggal Input
                    </label>
                    <input
                      type="date"
                      id="tanggal"
                      name="tanggal"
                      value={formData.tanggal}
                      onChange={handleInputChange}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-[0.98]"
                >
                  Simpan Perkara
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. DETAIL CASE MODAL */}
      {selectedCaseDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="px-6 py-4 bg-[#0a1f3d] text-white flex justify-between items-center select-none">
              <span className="font-extrabold text-sm tracking-wide">
                DETAIL DATA PERKARA
              </span>
              <button 
                onClick={() => setSelectedCaseDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Nomor Perkara
                </span>
                <span className="text-lg font-bold text-[#0a1f3d]">
                  {selectedCaseDetail.noPerkara}
                </span>
              </div>

              <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Satuan Militer
                </span>
                <span className="text-slate-700 font-semibold">
                  {selectedCaseDetail.satuan}
                </span>
              </div>

              <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Jenis Perkara
                </span>
                <span className="text-slate-700 font-semibold">
                  {selectedCaseDetail.jenisPerkara}
                </span>
              </div>

              <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Tanggal Berkas
                </span>
                <span className="text-slate-700 font-semibold">
                  {new Date(selectedCaseDetail.tanggal).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {selectedCaseDetail.fileUrl && (
                <div className="flex flex-col gap-1 pb-3 border-b border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Dokumen Kronologis
                  </span>
                  <button
                    onClick={() => {
                      if (selectedCaseDetail.fileUrl.startsWith('http')) {
                        window.open(selectedCaseDetail.fileUrl, '_blank');
                      } else {
                        const link = document.createElement('a');
                        link.href = selectedCaseDetail.fileUrl;
                        link.download = selectedCaseDetail.fileName || 'dokumen_kronologis.pdf';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                    }}
                    className="mt-1 self-start px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <span>📄 Unduh {selectedCaseDetail.fileName || 'Dokumen'}</span>
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Status Penyelesaian
                </span>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-extrabold border ${
                    selectedCaseDetail.status === 'SELESAI' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {selectedCaseDetail.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end select-none">
              <button
                type="button"
                onClick={() => setSelectedCaseDetail(null)}
                className="px-5 py-1.5 bg-[#0a1f3d] hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 9. TOAST NOTIFICATIONS */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-[1000] flex items-center gap-3 px-4 py-3 bg-slate-950 text-white rounded-lg shadow-lg border border-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
          {toast.type === 'success' ? (
            <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={18} />
          ) : toast.type === 'error' ? (
            <AlertCircle className="text-red-500 flex-shrink-0" size={18} />
          ) : (
            <Database className="text-blue-400 flex-shrink-0" size={18} />
          )}
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* 10. CUSTOM LOGOUT CONFIRMATION MODAL */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={28} />
              </div>
              <h3 className="text-lg font-extrabold text-[#0a1f3d] mb-2">Konfirmasi Keluar</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">
                Apakah Anda yakin ingin keluar dari Sistem Informasi Data Perkara?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 py-2 px-4 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.clear();
                    navigate('/login', { replace: true });
                  }}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-[0.98]"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
