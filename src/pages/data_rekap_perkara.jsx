import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus, 
  HelpCircle, 
  LogOut,
  Search,
  Filter,
  Download,
  CheckCircle,
  FileSpreadsheet,
  FileText as FilePdf,
  X,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

import logoKumdam from '../assets/images/logo_kumdam.jpeg';

// Beautiful custom SVG badge for KUMDAM XVII / CENDERAWASIH
const KumdamLogo = () => (
  <img src={logoKumdam} alt="Logo Kumdam XVII Cenderawasih" className="w-10 h-10 object-cover rounded-lg flex-shrink-0 drop-shadow-md border border-black" />
);

// High-fidelity military officer silhouette SVG
const MilitaryAvatar = () => (
  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700/80 shadow-md flex items-center justify-center overflow-hidden relative">
    <div className="absolute top-1 left-1 right-1 h-1.5 bg-amber-500 rounded-sm"></div>
    <svg className="w-12 h-12 text-slate-400 mt-2" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a4 4 0 0 0-4 4v3.25L5 11v8h14v-8l-3-1.75V6a4 4 0 0 0-4-4zm0 2a2 2 0 0 1 2 2v2.75l-2-.5-2 .5V6a2 2 0 0 1 2-2zm-5 8.75l2.5-1.46v2.46L7 14.5v-1.75zm10 0v1.75l-2.5-.75v-2.46l2.5 1.46z" />
    </svg>
  </div>
);

// Prepopulated static mock data matching the screenshot and layout
const REKAP_MOCK_DATA = [
  {
    id: 'rec_1',
    namaLengkap: 'Slamet Raharjo, S.H.',
    nrpNip: '21098273645',
    pangkat: 'Letkol Chk',
    satuan: 'Kumdam XVII/Cen',
    jenisPerkara: 'Disiplin Murni',
    tahapPenyelesaian: 'Tahap Sidang',
    putusan: 'Menunggu Putusan',
    status: 'PROSES',
    jabatan: 'Kasi Perkara',
    kronologis: 'Melanggar disiplin militer dengan tidak menghadiri dinas tanpa keterangan resmi selama 3 hari kerja berturut-turut.'
  },
  {
    id: 'rec_2',
    namaLengkap: 'Budi Santoso',
    nrpNip: '31012938475',
    pangkat: 'Sertu',
    satuan: 'Yonif 751/R',
    jenisPerkara: 'Narkotika',
    tahapPenyelesaian: 'Selesai',
    putusan: 'Hukuman 2 Tahun',
    status: 'SELESAI',
    jabatan: 'Danru 3',
    kronologis: 'Penyalahgunaan narkoba golongan I jenis sabu seberat 0.5 gram di area luar asrama militer.'
  },
  {
    id: 'rec_3',
    namaLengkap: 'Andi Wijaya',
    nrpNip: '21150938472',
    pangkat: 'Mayor Inf',
    satuan: 'Kodim 1701/Jpr',
    jenisPerkara: 'Penyalahgunaan Wewenang',
    tahapPenyelesaian: 'Penyidikan',
    putusan: '-',
    status: 'PROSES',
    jabatan: 'Pasi Intel',
    kronologis: 'Menggunakan fasilitas kendaraan taktis dinas untuk kepentingan komersial pribadi tanpa izin Komandan Satuan.'
  },
  {
    id: 'rec_4',
    namaLengkap: 'Dedi Kurniawan',
    nrpNip: '31055829304',
    pangkat: 'Praka',
    satuan: 'Denmadam XVII/Cen',
    jenisPerkara: 'Lalu Lintas',
    tahapPenyelesaian: 'Selesai',
    putusan: 'Teguran Tertulis',
    status: 'SELESAI',
    jabatan: 'Pengemudi Ranmor',
    kronologis: 'Mengemudikan kendaraan dinas secara ugal-ugalan sehingga mengakibatkan kerusakan pagar pos jaga utama.'
  },
  {
    id: 'rec_5',
    namaLengkap: 'Hermawan Saputra',
    nrpNip: '21130982341',
    pangkat: 'Kapten Cpl',
    satuan: 'Paldam XVII/Cen',
    jenisPerkara: 'THTI',
    tahapPenyelesaian: 'Penyidikan',
    putusan: '-',
    status: 'PROSES',
    jabatan: 'Kaur Log',
    kronologis: 'Meninggalkan wilayah garnison tanpa izin resmi tertulis dari pejabat berwenang selama masa siaga.'
  },
  {
    id: 'rec_6',
    namaLengkap: 'Roni Wijaya',
    nrpNip: '31089234851',
    pangkat: 'Kopda',
    satuan: 'Yonif 751/R',
    jenisPerkara: 'Insubordinasi',
    tahapPenyelesaian: 'Tahap Sidang',
    putusan: 'Menunggu Putusan',
    status: 'PROSES',
    jabatan: 'Tabak Pan',
    kronologis: 'Menolak perintah atasan langsung secara terang-terangan di depan umum saat pelaksanaan latihan berkala.'
  },
  {
    id: 'rec_7',
    namaLengkap: 'Yusuf Ginting',
    nrpNip: '21059238472',
    pangkat: 'Mayor Czi',
    satuan: 'Zidam XVII/Cen',
    jenisPerkara: 'Kasus Asusila',
    tahapPenyelesaian: 'Selesai',
    putusan: 'Diberhentikan (PDTH)',
    status: 'SELESAI',
    jabatan: 'Pasi Konstruksi',
    kronologis: 'Tindakan pelanggaran kesusilaan yang mencemarkan kehormatan prajurit di wilayah publik.'
  }
];

export default function DataRekapPerkara() {
  const navigate = useNavigate();
  
  // State variables
  const [perkaraList, setPerkaraList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState(null);
  
  // Modal states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('select'); // select, processing, done

  // Filters State
  const [filters, setFilters] = useState({
    satuan: '',
    jenisPerkara: '',
    status: ''
  });

  // Fetch Firestore + merge with mock data for robust list
  useEffect(() => {
    const loadData = async () => {
      let firestoreList = [];
      try {
        const querySnapshot = await getDocs(collection(db, 'perkara'));
        querySnapshot.forEach((doc) => {
          firestoreList.push({ id: doc.id, ...doc.data() });
        });
      } catch (error) {
        console.warn("Could not fetch Firestore data. Using LocalStorage/Mock fallback.", error);
      }

      // Read local storage
      const localData = localStorage.getItem('perkara_data');
      const localList = localData ? JSON.parse(localData) : [];

      // Combine: Firestore first, then LocalStorage, then static mock data
      const combined = [...firestoreList, ...localList];
      
      // Filter out duplicates (based on noPerkara)
      const uniqueList = [...combined];
      REKAP_MOCK_DATA.forEach(mockItem => {
        if (!uniqueList.some(item => item.noPerkara === mockItem.noPerkara || item.nrpNip === mockItem.nrpNip)) {
          uniqueList.push(mockItem);
        }
      });

      setPerkaraList(uniqueList);
      
      // Set the first case as the default selected case
      if (uniqueList.length > 0) {
        setSelectedCase(uniqueList[0]);
      }
    };

    loadData();
  }, []);

  // Filter application
  const filteredList = perkaraList.filter(item => {
    const matchesSearch = 
      item.namaLengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nrpNip.includes(searchTerm) ||
      item.satuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jenisPerkara.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSatuan = filters.satuan === '' || item.satuan.toLowerCase().includes(filters.satuan.toLowerCase());
    const matchesJenis = filters.jenisPerkara === '' || item.jenisPerkara.toLowerCase().includes(filters.jenisPerkara.toLowerCase());
    const matchesStatus = filters.status === '' || item.status === filters.status;

    return matchesSearch && matchesSatuan && matchesJenis && matchesStatus;
  });

  // Pagination logic
  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filteredList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Row selection handler
  const handleSelectRow = (item) => {
    setSelectedCase(item);
  };

  // Simulate PDF/Excel Export Progress
  const startExportSimulation = (type) => {
    setExportStep('processing');
    setExportProgress(0);
    
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setExportStep('done');
          return 100;
        }
        return prev + 20;
      });
    }, 250);
  };

  // Get active cases for unit card 3
  const activeUnit = selectedCase ? selectedCase.satuan : 'Yonif 751/R';
  const unitCases = perkaraList.filter(item => item.satuan === activeUnit);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      
      {/* 1. TOP NAVBAR (Consistent design layout) */}
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
            <Link to="/rekap-perkara" className="h-full flex items-center text-white border-b-2 border-white px-1 transition-all duration-200">
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
        
        {/* 2. SIDEBAR */}
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
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <FileText size={18} />
                <span>Input Data</span>
              </Link>
              <Link 
                to="/rekap-perkara" 
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 border-l-4 border-blue-600 transition-all"
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
            
            {/* Header section with export & filter buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-extrabold text-[#0a1f3d] tracking-tight">
                  Rekapitulasi Data Perkara
                </h1>
                <p className="text-xs font-semibold text-slate-500 mt-1 max-w-2xl leading-relaxed">
                  Laporan menyeluruh mengenai seluruh satuan dan personel yang terlibat dalam perkara hukum di lingkungan KUMDAM XVII/Cenderawasih.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsFilterModalOpen(true)}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-2 font-bold text-xs shadow-sm transition active:scale-[0.98]"
                >
                  <Filter size={15} className="text-slate-500" />
                  <span>Filter Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExportModalOpen(true);
                    setExportStep('select');
                  }}
                  className="px-4 py-2.5 bg-[#1d6f42] hover:bg-[#155231] text-white rounded-lg flex items-center gap-2 font-bold text-xs shadow-sm transition active:scale-[0.98]"
                >
                  <Download size={15} />
                  <span>Ekspor PDF/Excel</span>
                </button>
              </div>
            </div>

            {/* 4. TABLE: 1. DATA REKAP PERKARA */}
            <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
              
              {/* Header Title bar */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-3">
                  <h3 className="font-extrabold text-xs text-[#0a1f3d] uppercase tracking-wider">
                    1. DATA REKAP PERKARA (SELURUH SATUAN & PERSONEL)
                  </h3>
                </div>
                <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-[10px] tracking-wider uppercase">
                  Total: {filteredList.length} Perkara
                </div>
              </div>

              {/* Table Wrapper */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                      <th className="py-3.5 px-6 text-center w-16">NO</th>
                      <th className="py-3.5 px-4">NAMA PERSONEL</th>
                      <th className="py-3.5 px-4">NRP</th>
                      <th className="py-3.5 px-4">PANGKAT</th>
                      <th className="py-3.5 px-4">KESATUAN</th>
                      <th className="py-3.5 px-4">PERKARA</th>
                      <th className="py-3.5 px-4">TAHAPAN PENYELESAIAN</th>
                      <th className="py-3.5 px-6">PUTUSAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {paginatedList.map((item, idx) => {
                      const numberString = String(startIndex + idx + 1).padStart(2, '0');
                      const isSelected = selectedCase && selectedCase.id === item.id;
                      
                      // Status color mapping
                      let statusBadge = (
                        <span className="flex items-center gap-1.5 font-bold text-[#b45309]">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          {item.tahapPenyelesaian || 'Proses'}
                        </span>
                      );
                      
                      if (item.status === 'SELESAI' || item.tahapPenyelesaian?.toLowerCase().includes('selesai')) {
                        statusBadge = (
                          <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            Selesai
                          </span>
                        );
                      } else if (item.tahapPenyelesaian?.toLowerCase().includes('sidang')) {
                        statusBadge = (
                          <span className="flex items-center gap-1.5 font-bold text-blue-600">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            Tahap Sidang
                          </span>
                        );
                      }

                      return (
                        <tr 
                          key={item.id} 
                          onClick={() => handleSelectRow(item)}
                          className={`hover:bg-slate-50/80 cursor-pointer transition-all duration-150 ${
                            isSelected ? 'bg-blue-50/40 font-semibold' : ''
                          }`}
                        >
                          <td className="py-4 px-6 text-center text-slate-400 font-bold font-mono">
                            {numberString}
                          </td>
                          <td className="py-4 px-4 font-bold text-slate-800">
                            {item.namaLengkap}
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-mono">
                            {item.nrpNip}
                          </td>
                          <td className="py-4 px-4 text-slate-600">
                            {item.pangkat}
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-semibold">
                            {item.satuan}
                          </td>
                          <td className="py-4 px-4 font-bold text-[#991b1b]">
                            {item.jenisPerkara}
                          </td>
                          <td className="py-4 px-4">
                            {statusBadge}
                          </td>
                          <td className="py-4 px-6 font-semibold text-slate-600 italic">
                            {item.putusan || '-'}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredList.length === 0 && (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                          Tidak ada data rekap perkara yang sesuai filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with pagination */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs select-none">
                <span className="font-semibold text-slate-500">
                  Menampilkan {paginatedList.length} dari {filteredList.length} data
                </span>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                        currentPage === p 
                          ? 'bg-[#0a1f3d] text-white' 
                          : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

            </section>

            {/* TWO COLUMN MASTER-DETAIL SECTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* 5. COLUMN 2: DATA RINCIAN PERKARA PERORANGAN */}
              <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-3 mb-6 select-none">
                    <h3 className="font-extrabold text-xs text-[#0a1f3d] uppercase tracking-wider">
                      2. DATA RINCIAN PERKARA PERORANGAN
                    </h3>
                  </div>

                  {selectedCase ? (
                    <div>
                      {/* Officer Info Header */}
                      <div className="flex items-center gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100 mb-6">
                        <MilitaryAvatar />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-sm text-slate-900 truncate">
                              {selectedCase.namaLengkap}
                            </span>
                            <span className="px-2 py-0.5 bg-red-50 text-red-600 font-bold text-[9px] uppercase tracking-wider rounded border border-red-100">
                              Prioritas
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold tracking-wide leading-relaxed">
                            NRP: {selectedCase.nrpNip} &bull; PANGKAT: {selectedCase.pangkat} &bull; JABATAN: {selectedCase.jabatan || 'Anggota'}
                          </p>
                        </div>
                      </div>

                      {/* Detail Table */}
                      <div className="border border-slate-200/60 rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">
                              <th className="py-2.5 px-4">PERKARA</th>
                              <th className="py-2.5 px-4">KRONOLOGIS SINGKAT</th>
                              <th className="py-2.5 px-4 text-center">TAHAPAN</th>
                              <th className="py-2.5 px-4">PUTUSAN</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="py-3 px-4 font-bold text-[#991b1b]">
                                {selectedCase.jenisPerkara}
                              </td>
                              <td className="py-3 px-4 text-slate-500 max-w-[200px] leading-relaxed">
                                {selectedCase.kronologis || 'Detail perkara sedang diproses.'}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                  selectedCase.status === 'SELESAI' 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : 'bg-amber-50 text-[#b45309] border border-amber-100'
                                }`}>
                                  {selectedCase.tahapPenyelesaian || selectedCase.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-600 italic">
                                {selectedCase.putusan || '-'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                      Pilih baris pada tabel di atas untuk menampilkan rincian.
                    </div>
                  )}
                </div>
              </section>

              {/* 6. COLUMN 3: DATA PERKARA KESATUAN */}
              <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-3 mb-6 select-none">
                    <h3 className="font-extrabold text-xs text-[#0a1f3d] uppercase tracking-wider">
                      3. DATA PERKARA KESATUAN: {activeUnit.toUpperCase()}
                    </h3>
                  </div>

                  {/* Dark Blue Header Box */}
                  <div className="bg-[#0a1f3d] text-white p-4 rounded-xl border border-slate-700/80 flex items-center justify-between mb-4 shadow-sm select-none">
                    <div className="flex items-center gap-2.5">
                      <Users size={16} className="text-amber-400" />
                      <span className="font-bold text-xs tracking-wide">
                        Unit: {activeUnit}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-900 font-extrabold text-[9px] uppercase tracking-wider rounded shadow animate-pulse">
                      {unitCases.length} Perkara
                    </span>
                  </div>

                  {/* Cases list inside Unit */}
                  <div className="border border-slate-200/60 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">
                          <th className="py-2.5 px-4 text-center w-12">NO</th>
                          <th className="py-2.5 px-4">PERSONEL</th>
                          <th className="py-2.5 px-4">PERKARA</th>
                          <th className="py-2.5 px-4">TAHAPAN</th>
                          <th className="py-2.5 px-4">PUTUSAN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {unitCases.slice(0, 3).map((item, idx) => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-4 text-center text-slate-400 font-bold font-mono">
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-800">{item.namaLengkap}</div>
                              <div className="text-[10px] text-slate-400 font-semibold">{item.pangkat} | {item.nrpNip}</div>
                            </td>
                            <td className="py-3 px-4 font-bold text-[#991b1b]">
                              {item.jenisPerkara}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                item.status === 'SELESAI' 
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-amber-50 text-[#b45309]'
                              }`}>
                                {item.tahapPenyelesaian || item.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-500">
                              {item.putusan || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

            </div>

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

      {/* 8. FILTER MODAL */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 select-none">
              <div className="flex items-center gap-2 text-slate-800">
                <Filter size={18} className="text-slate-500" />
                <span className="font-extrabold text-sm uppercase tracking-wide">Penyaringan Data</span>
              </div>
              <button 
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              {/* Filter Satuan */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                  Kesatuan / Satuan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Yonif 751, Kumdam"
                  value={filters.satuan}
                  onChange={(e) => setFilters(prev => ({ ...prev, satuan: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              {/* Filter Jenis Perkara */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                  Jenis Perkara
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Narkotika, Disiplin"
                  value={filters.jenisPerkara}
                  onChange={(e) => setFilters(prev => ({ ...prev, jenisPerkara: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              {/* Filter Status */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">
                  Status Perkara
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-700 font-bold"
                >
                  <option value="">SEMUA STATUS</option>
                  <option value="PROSES">DALAM PROSES</option>
                  <option value="SELESAI">SELESAI / PUTUSAN</option>
                </select>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  setFilters({ satuan: '', jenisPerkara: '', status: '' });
                  setIsFilterModalOpen(false);
                }}
                className="px-4 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg transition"
              >
                RESET
              </button>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="px-5 py-1.5 bg-[#0a1f3d] hover:bg-[#122e54] text-white text-[10px] font-bold rounded-lg transition"
              >
                TERAPKAN FILTER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. EXPORT PROGRESS MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 select-none">
              <span className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">Ekspor Rekap Perkara</span>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                disabled={exportStep === 'processing'}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition disabled:opacity-30"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              
              {exportStep === 'select' && (
                <div className="flex flex-col gap-4 text-center">
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                    Pilih format dokumen untuk mengekspor rekapitulasi data perkara hukum (Total {filteredList.length} data):
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => startExportSimulation('excel')}
                      className="p-4 border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl transition flex flex-col items-center justify-center gap-2 group"
                    >
                      <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 group-hover:scale-105 transition">
                        <FileSpreadsheet size={20} />
                      </div>
                      <span className="font-bold text-[10px] text-slate-700 tracking-wider">MICROSOFT EXCEL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startExportSimulation('pdf')}
                      className="p-4 border border-slate-200 hover:border-red-500 hover:bg-red-50/50 rounded-xl transition flex flex-col items-center justify-center gap-2 group"
                    >
                      <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600 group-hover:scale-105 transition">
                        <FilePdf size={20} />
                      </div>
                      <span className="font-bold text-[10px] text-slate-700 tracking-wider">PORTABLE DOCUMENT (PDF)</span>
                    </button>
                  </div>
                </div>
              )}

              {exportStep === 'processing' && (
                <div className="flex flex-col items-center gap-4 text-center py-4">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
                    <span className="font-bold text-xs text-blue-600 font-mono">{exportProgress}%</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-xs text-slate-800">Menghasilkan Dokumen...</span>
                    <span className="text-[10px] text-slate-400 font-medium">Harap tunggu, data sedang dikompilasi</span>
                  </div>
                </div>
              )}

              {exportStep === 'done' && (
                <div className="flex flex-col items-center gap-4 text-center py-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 animate-bounce">
                    <CheckCircle size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-xs text-slate-800">Ekspor Berhasil!</span>
                    <span className="text-[10px] text-slate-400 font-medium">Dokumen siap untuk diunduh ke perangkat Anda.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(false)}
                    className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition active:scale-[0.98]"
                  >
                    UNDUH FILE SEKARANG
                  </button>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
