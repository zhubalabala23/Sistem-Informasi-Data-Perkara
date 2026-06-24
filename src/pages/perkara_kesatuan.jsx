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
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
  FileText as FilePdf
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

import logoKumdam from '../assets/images/logo_kumdam.jpeg';

// Beautiful custom SVG badge for KUMDAM XVII / CENDERAWASIH
const KumdamLogo = () => (
  <img src={logoKumdam} alt="Logo Kumdam XVII Cenderawasih" className="w-10 h-10 object-cover rounded-lg flex-shrink-0 drop-shadow-md border border-black" />
);

const MOCK_KESATUAN_DATA = [
  {
    id: 'k_1',
    namaLengkap: 'Budi Santoso',
    nrpNip: '1234567890',
    pangkat: 'Serda',
    jenisPerkara: 'Disersi',
    tahapPenyelesaian: 'SIDANG',
    putusan: 'Menunggu Putusan'
  },
  {
    id: 'k_2',
    namaLengkap: 'Agus Wijaya',
    nrpNip: '9876543210',
    pangkat: 'Lettu Inf',
    jenisPerkara: 'Penyalahgunaan Wewenang',
    tahapPenyelesaian: 'PENYIDIKAN',
    putusan: '-'
  },
  {
    id: 'k_3',
    namaLengkap: 'Hendra Kurniawan',
    nrpNip: '5647382910',
    pangkat: 'Kopda',
    jenisPerkara: 'Laka Lintas',
    tahapPenyelesaian: 'PUTUSAN',
    putusan: 'Pidana Penjara 3 Bulan'
  },
  {
    id: 'k_4',
    namaLengkap: 'Andi Pratama',
    nrpNip: '2233445566',
    pangkat: 'Sertu',
    jenisPerkara: 'Penganiayaan',
    tahapPenyelesaian: 'PENUNTUTAN',
    putusan: '-'
  },
  {
    id: 'k_5',
    namaLengkap: 'Slamet Riyadi',
    nrpNip: '1122334455',
    pangkat: 'Praka',
    jenisPerkara: 'Narkotika',
    tahapPenyelesaian: 'SIDANG',
    putusan: 'Pemeriksaan Saksi'
  },
  {
    id: 'k_6',
    namaLengkap: 'Dharma Utama',
    nrpNip: '1289384721',
    pangkat: 'Koptu',
    jenisPerkara: 'Disiplin Murni',
    tahapPenyelesaian: 'PENYIDIKAN',
    putusan: '-'
  },
  {
    id: 'k_7',
    namaLengkap: 'Rian Hidayat',
    nrpNip: '3109283742',
    pangkat: 'Letda Chk',
    jenisPerkara: 'THTI',
    tahapPenyelesaian: 'PUTUSAN',
    putusan: 'Teguran Disiplin'
  },
  {
    id: 'k_8',
    namaLengkap: 'Fajar Nugraha',
    nrpNip: '3102938472',
    pangkat: 'Pratu',
    jenisPerkara: 'Pencurian',
    tahapPenyelesaian: 'PENUNTUTAN',
    putusan: '-'
  }
];

export default function PerkaraKesatuan() {
  const navigate = useNavigate();

  // State Management
  const [perkaraList, setPerkaraList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerkara, setSelectedPerkara] = useState('');
  const [selectedTahap, setSelectedTahap] = useState('');

  // Applied Filter States
  const [filterSearch, setFilterSearch] = useState('');
  const [filterPerkara, setFilterPerkara] = useState('');
  const [filterTahap, setFilterTahap] = useState('');

  // Export Dialog State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('select'); // select, processing, done

  // Fetch Firestore + LocalStorage + merge with mock data
  useEffect(() => {
    const fetchData = async () => {
      let firestoreList = [];
      try {
        const querySnapshot = await getDocs(collection(db, 'perkara'));
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          firestoreList.push({
            id: doc.id,
            namaLengkap: data.namaLengkap,
            nrpNip: data.nrpNip,
            pangkat: data.pangkat,
            jenisPerkara: data.jenisPerkara,
            tahapPenyelesaian: data.tahapPenyelesaian?.toUpperCase() || (data.status === 'SELESAI' ? 'PUTUSAN' : 'SIDANG'),
            putusan: data.putusan || (data.status === 'SELESAI' ? 'Selesai' : '-')
          });
        });
      } catch (error) {
        console.warn("Could not load Firestore. Using fallbacks.", error);
      }

      // Read local storage
      const localData = localStorage.getItem('perkara_data');
      const localList = localData ? JSON.parse(localData) : [];
      const mappedLocal = localList.map(item => ({
        id: item.id,
        namaLengkap: item.namaLengkap,
        nrpNip: item.nrpNip,
        pangkat: item.pangkat,
        jenisPerkara: item.jenisPerkara,
        tahapPenyelesaian: item.tahapPenyelesaian?.toUpperCase() || (item.status === 'SELESAI' ? 'PUTUSAN' : 'SIDANG'),
        putusan: item.putusan || (item.status === 'SELESAI' ? 'Selesai' : '-')
      }));

      // Combine and filter duplicates
      const combined = [...firestoreList, ...mappedLocal];
      const uniqueList = [...combined];
      
      MOCK_KESATUAN_DATA.forEach(mockItem => {
        if (!uniqueList.some(item => item.nrpNip === mockItem.nrpNip)) {
          uniqueList.push(mockItem);
        }
      });

      setPerkaraList(uniqueList);
    };

    fetchData();
  }, []);

  // Filter logic trigger on Apply button
  const handleApplyFilter = (e) => {
    e.preventDefault();
    setFilterSearch(searchQuery);
    setFilterPerkara(selectedPerkara);
    setFilterTahap(selectedTahap);
    setCurrentPage(1); // Reset to page 1
  };

  // Filtered dataset
  const filteredList = perkaraList.filter(item => {
    const matchesSearch = 
      filterSearch === '' || 
      item.namaLengkap.toLowerCase().includes(filterSearch.toLowerCase()) || 
      item.nrpNip.includes(filterSearch);

    const matchesPerkara = 
      filterPerkara === '' || 
      item.jenisPerkara.toLowerCase().includes(filterPerkara.toLowerCase());

    const matchesTahap = 
      filterTahap === '' || 
      item.tahapPenyelesaian === filterTahap;

    return matchesSearch && matchesPerkara && matchesTahap;
  });

  // Pagination Configuration
  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filteredList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Simulate PDF generation progress
  const startExportSimulation = () => {
    setExportStep('processing');
    setExportProgress(0);
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setExportStep('done');
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 print:bg-white print:text-black">
      
      {/* 1. TOP NAVBAR (Consistent layout, print hidden) */}
      <header className="h-16 bg-[#0a1f3d] flex items-center justify-between px-6 text-white shadow-md z-40 select-none print:hidden">
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
            <Link to="/perkara-kesatuan" className="h-full flex items-center text-white border-b-2 border-white px-1 transition-all duration-200">
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
        
        {/* 2. SIDEBAR (print hidden) */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between select-none print:hidden">
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
        <main className="flex-1 bg-[#f8fafc] p-6 lg:p-8 overflow-y-auto flex flex-col justify-between print:p-0 print:bg-white">
          <div>
            
            {/* Breadcrumb (print hidden) */}
            <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-1 select-none flex items-center gap-1.5 print:hidden">
              <span>DASHBOARD</span>
              <ChevronRight size={10} />
              <span>PERKARA KESATUAN</span>
              <ChevronRight size={10} />
              <span className="text-[#0a1f3d]">KODAM XVII/CENDERAWASIH</span>
            </div>

            {/* Header section with print & export buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl font-extrabold text-[#0a1f3d] tracking-tight uppercase print:text-lg">
                  Data Perkara Kesatuan: KODAM XVII/CENDERAWASIH
                </h1>
              </div>

              {/* Action Buttons (print hidden) */}
              <div className="flex items-center gap-3 print:hidden select-none">
                <button
                  type="button"
                  onClick={() => {
                    setIsExportOpen(true);
                    setExportStep('select');
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-2 font-bold text-xs shadow-sm transition active:scale-[0.98]"
                >
                  <Download size={14} className="text-slate-500" />
                  <span>Export PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-2 font-bold text-xs shadow-sm transition active:scale-[0.98]"
                >
                  <Printer size={14} className="text-slate-500" />
                  <span>Cetak</span>
                </button>
              </div>
            </div>

            {/* 4. FILTER FORM BLOCK (print hidden) */}
            <form onSubmit={handleApplyFilter} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm mb-6 print:hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                
                {/* Search query */}
                <div>
                  <label htmlFor="searchQuery" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                    Cari Personel / NRP
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
                    <input
                      type="text"
                      id="searchQuery"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Masukkan nama atau NRP..."
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-semibold"
                    />
                  </div>
                </div>

                {/* Perkara dropdown */}
                <div>
                  <label htmlFor="selectedPerkara" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                    Perkara
                  </label>
                  <select
                    id="selectedPerkara"
                    value={selectedPerkara}
                    onChange={(e) => setSelectedPerkara(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                  >
                    <option value="">Semua Perkara</option>
                    <option value="Disersi">Disersi</option>
                    <option value="Penyalahgunaan Wewenang">Penyalahgunaan Wewenang</option>
                    <option value="Laka Lintas">Laka Lintas</option>
                    <option value="Penganiayaan">Penganiayaan</option>
                    <option value="Narkotika">Narkotika</option>
                  </select>
                </div>

                {/* Tahapan dropdown */}
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <label htmlFor="selectedTahap" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                      Tahap Penyelesaian
                    </label>
                    <select
                      id="selectedTahap"
                      value={selectedTahap}
                      onChange={(e) => setSelectedTahap(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-700 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                    >
                      <option value="">Semua Tahapan</option>
                      <option value="SIDANG">SIDANG</option>
                      <option value="PENYIDIKAN">PENYIDIKAN</option>
                      <option value="PUTUSAN">PUTUSAN</option>
                      <option value="PENUNTUTAN">PENUNTUTAN</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="h-9 px-6 bg-[#0a1f3d] hover:bg-[#122e54] text-white rounded-lg flex items-center gap-2 font-bold text-xs tracking-wider transition active:scale-[0.98] whitespace-nowrap shadow-md shadow-blue-900/10"
                  >
                    <Filter size={14} className="text-amber-500" />
                    <span>Terapkan</span>
                  </button>
                </div>

              </div>
            </form>

            {/* 5. CASES TABLE */}
            <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-6 print:border-none print:shadow-none">
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                      <th className="py-3.5 px-6 text-center w-16">NO</th>
                      <th className="py-3.5 px-6">NAMA PERSONEL</th>
                      <th className="py-3.5 px-6">NRP</th>
                      <th className="py-3.5 px-6">PANGKAT</th>
                      <th className="py-3.5 px-6">PERKARA</th>
                      <th className="py-3.5 px-6 text-center">TAHAPAN PENYELESAIAN</th>
                      <th className="py-3.5 px-8">PUTUSAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {paginatedList.map((item, idx) => {
                      // Color schemes matching tahapan
                      let badgeStyle = "border-slate-300 text-slate-500 bg-slate-50";
                      
                      if (item.tahapPenyelesaian === 'SIDANG') {
                        badgeStyle = "border-blue-400 text-blue-600 bg-blue-50/50";
                      } else if (item.tahapPenyelesaian === 'PENYIDIKAN') {
                        badgeStyle = "border-slate-400 text-slate-500 bg-slate-50";
                      } else if (item.tahapPenyelesaian === 'PUTUSAN') {
                        badgeStyle = "border-emerald-400 text-emerald-600 bg-emerald-50/50";
                      } else if (item.tahapPenyelesaian === 'PENUNTUTAN') {
                        badgeStyle = "border-blue-500 text-blue-600 bg-blue-50/20";
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-4 px-6 text-center text-slate-400 font-bold font-mono">
                            {startIndex + idx + 1}
                          </td>
                          <td className="py-4 px-6 font-bold text-slate-800">
                            {item.namaLengkap}
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-mono">
                            {item.nrpNip}
                          </td>
                          <td className="py-4 px-6 text-slate-600">
                            {item.pangkat}
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-semibold">
                            {item.jenisPerkara}
                          </td>
                          <td className="py-4 px-6 text-center select-none">
                            <span className={`px-3 py-0.5 border rounded-full font-bold text-[9px] tracking-wider inline-block ${badgeStyle}`}>
                              {item.tahapPenyelesaian}
                            </span>
                          </td>
                          <td className="py-4 px-8 font-semibold text-slate-600 italic">
                            {item.putusan || '-'}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredList.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                          Tidak ada data perkara kesatuan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer (print hidden) */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs select-none print:hidden">
                <span className="font-semibold text-slate-500">
                  Menampilkan {paginatedList.length > 0 ? `${startIndex + 1} - ${startIndex + paginatedList.length}` : '0'} dari {filteredList.length} data perkara
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

          </div>

          {/* 6. PAGE FOOTER */}
          <footer className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-bold tracking-wider select-none">
            <div>
              KUMDAM XVII | &copy; 2024 Sistem Informasi Data Perkara KUMDAM XVII/Cenderawasih. Hak Cipta Dilindungi.
            </div>
            <div className="flex items-center gap-4 print:hidden">
              <a href="#" className="hover:text-slate-600 transition-colors">Kebijakan Privasi</a>
              <span>|</span>
              <a href="#" className="hover:text-slate-600 transition-colors">Syarat &amp; Ketentuan</a>
            </div>
          </footer>
        </main>
      </div>

      {/* 7. EXPORT LOADING MODAL */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">Export Laporan PDF</span>
              <button 
                onClick={() => setIsExportOpen(false)}
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
                    Unduh berkas PDF Rekapitulasi Perkara Satuan KODAM XVII/CENDERAWASIH (Total {filteredList.length} data):
                  </p>
                  
                  <button
                    type="button"
                    onClick={startExportSimulation}
                    className="py-3 px-4 bg-[#0a1f3d] hover:bg-[#122e54] text-white rounded-lg flex items-center justify-center gap-2 font-bold text-xs shadow-md transition active:scale-[0.98]"
                  >
                    <FilePdf size={16} className="text-amber-500" />
                    <span>MULAI BUAT DOKUMEN PDF</span>
                  </button>
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
                    <span className="text-[10px] text-slate-400 font-semibold">Harap tunggu, berkas PDF sedang dikompilasi</span>
                  </div>
                </div>
              )}

              {exportStep === 'done' && (
                <div className="flex flex-col items-center gap-4 text-center py-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 animate-bounce">
                    <CheckCircle size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-xs text-slate-800">Pembuatan Berkas Sukses!</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Dokumen siap untuk diunduh ke perangkat Anda.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExportOpen(false)}
                    className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition active:scale-[0.98]"
                  >
                    UNDUH PDF SEKARANG
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
