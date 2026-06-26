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
  FileText as FilePdf,
  Menu,
  User,
  Database
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

import logoKumdam from '../assets/images/logo_kumdam.jpeg';

// Beautiful custom SVG badge for KUMDAM XVII / CENDERAWASIH
const KumdamLogo = () => (
  <img src={logoKumdam} alt="Logo Kumdam XVII Cenderawasih" className="w-10 h-10 object-cover rounded-lg flex-shrink-0 drop-shadow-md border border-black" />
);

const renderPutusanCell = (item) => {
  const hasTexts = item.pidanaPokok || item.pidanaTambahan || item.noSalinanPutusan || item.noPetikanPutusan || item.noAkteBht;
  const hasSalinan = !!item.salinanPutusan;
  const hasPetikan = !!item.petikanPutusan;
  const hasAkte = !!item.akteBht;

  const downloadFile = (fileUrlOrBase64, filename) => {
    if (!fileUrlOrBase64) return;
    if (fileUrlOrBase64.startsWith('http://') || fileUrlOrBase64.startsWith('https://')) {
      window.open(fileUrlOrBase64, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = fileUrlOrBase64;
      link.download = filename || 'dokumen.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col gap-1 text-[11px] leading-tight max-w-[250px] text-left">
      {hasTexts ? (
        <div className="text-slate-700 font-medium">
          {item.pidanaPokok && (
            <div>
              <span className="font-bold text-slate-500">Pokok:</span> {item.pidanaPokok}
            </div>
          )}
          {item.pidanaTambahan && (
            <div className="mt-0.5">
              <span className="font-bold text-slate-500">Tambahan:</span> {item.pidanaTambahan}
            </div>
          )}
          {item.noSalinanPutusan && (
            <div className="mt-0.5 text-slate-600 font-semibold">
              <span className="font-bold text-slate-500">No. Salinan:</span> {item.noSalinanPutusan}
            </div>
          )}
          {item.noPetikanPutusan && (
            <div className="mt-0.5 text-slate-600 font-semibold">
              <span className="font-bold text-slate-500">No. Petikan:</span> {item.noPetikanPutusan}
            </div>
          )}
          {item.noAkteBht && (
            <div className="mt-0.5 text-slate-600 font-semibold">
              <span className="font-bold text-slate-500">No. Akte BHT:</span> {item.noAkteBht}
            </div>
          )}
        </div>
      ) : (
        <span className="text-slate-400 italic font-semibold">{item.putusan || '-'}</span>
      )}
      
      {!hasTexts && item.dokumenPutusan && typeof item.dokumenPutusan === 'string' && !item.dokumenPutusan.startsWith('data:') && (
        <div className="text-[9px] text-slate-500 mt-1 font-semibold border-t border-slate-100 pt-1 leading-normal">
          {item.dokumenPutusan}
        </div>
      )}
      
      {(hasSalinan || hasPetikan || hasAkte) && (
        <div className="flex flex-wrap gap-1 mt-1.5 select-none" onClick={(e) => e.stopPropagation()}>
          {hasSalinan && (
            <button
              onClick={() => downloadFile(item.salinanPutusan, item.salinanPutusanName || 'Salinan_Putusan.pdf')}
              className="px-2 py-0.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded text-[9px] font-extrabold transition-colors flex items-center gap-0.5 shadow-sm"
              title="Download Salinan Putusan"
            >
              📄 Salinan
            </button>
          )}
          {hasPetikan && (
            <button
              onClick={() => downloadFile(item.petikanPutusan, item.petikanPutusanName || 'Petikan_Putusan.pdf')}
              className="px-2 py-0.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded text-[9px] font-extrabold transition-colors flex items-center gap-0.5 shadow-sm"
              title="Download Petikan Putusan"
            >
              📄 Petikan
            </button>
          )}
          {hasAkte && (
            <button
              onClick={() => downloadFile(item.akteBht, item.akteBhtName || 'Akte_BHT.pdf')}
              className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded text-[9px] font-extrabold transition-colors flex items-center gap-0.5 shadow-sm"
              title="Download Akte BHT"
            >
              📜 Akte BHT
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const KESATUAN_OPTIONS = [
  { id: 'POMDAM', nama: 'POMDAM XVII/CENDERAWASIH' },
  { id: 'ZIDAM', nama: 'ZIDAM XVII/CENDERAWASIH' },
  { id: 'KOMLEKDAM', nama: 'KOMLEKDAM XVII/CENDERAWASIH' },
  { id: 'RINDAM', nama: 'RINDAM XVII/CENDERAWASIH' }
];

const MOCK_KESATUAN_DATA = [];

const formatJenisPerkara = (jenis, kategori) => {
  if (!jenis) return '';
  let formattedJenis = '';
  const jUpper = jenis.toUpperCase();
  if (jUpper === 'PIDANA UMUM') formattedJenis = 'Pidana umum';
  else if (jUpper === 'PIDANA MILITER') formattedJenis = 'Pidana militer';
  else if (jUpper === 'PERDATA') formattedJenis = 'Perdata';
  else formattedJenis = jenis.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

  if (kategori) {
    const formattedKategori = kategori.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    return `${formattedJenis} (${formattedKategori})`;
  }
  return formattedJenis;
};

export default function PerkaraKesatuan() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();

  const loggedInKesatuan = (() => {
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
  const isKesatuanVerified = sessionStorage.getItem('is_kesatuan_verified') === 'true';

  // Load the active/selected kesatuan from sessionStorage
  const [selectedKesatuan, setSelectedKesatuan] = useState(() => {
    const saved = sessionStorage.getItem('selected_kesatuan');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const found = KESATUAN_OPTIONS.find(item => item.id === parsed.id);
        if (found) return found;
      } catch (e) {
        console.error(e);
      }
    }
    const defaultKesatuan = KESATUAN_OPTIONS[0];
    sessionStorage.setItem('selected_kesatuan', JSON.stringify(defaultKesatuan));
    return defaultKesatuan;
  });

  // Permission helper: general admin can print any, specific kesatuan can only print their own
  const canPrintUnit = !isKesatuanVerified || (
    loggedInKesatuan && selectedKesatuan && (() => {
      const clean = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/e/g, '');
      return clean(selectedKesatuan.nama) === clean(loggedInKesatuan.nama) || clean(selectedKesatuan.id) === clean(loggedInKesatuan.id);
    })()
  );

  // State Management - pre-initialized from LocalStorage cache for 0ms rendering
  const [perkaraList, setPerkaraList] = useState(() => {
    const localData = localStorage.getItem('perkara_data');
    const localList = localData ? JSON.parse(localData) : [];
    const mappedLocal = localList.map(item => ({
      id: item.id,
      noPerkara: item.noPerkara || '',
      namaLengkap: item.namaLengkap,
      nrpNip: item.nrpNip,
      pangkat: item.pangkat,
      satuan: item.satuan,
      jenisPerkara: item.jenisPerkara,
      tahapPenyelesaian: item.tahapPenyelesaian?.toUpperCase() === 'SIDANG' ? 'DILMIL' : (item.tahapPenyelesaian?.toUpperCase() || (item.status === 'SELESAI' ? 'PUTUSAN' : 'DILMIL')),
      putusan: item.putusan || (item.status === 'SELESAI' ? 'Selesai' : '-'),
      pidanaPokok: item.pidanaPokok || '',
      pidanaTambahan: item.pidanaTambahan || '',
      noSalinanPutusan: item.noSalinanPutusan || '',
      noPetikanPutusan: item.noPetikanPutusan || '',
      noAkteBht: item.noAkteBht || '',
      salinanPutusan: item.salinanPutusan || null,
      salinanPutusanName: item.salinanPutusanName || '',
      petikanPutusan: item.petikanPutusan || null,
      petikanPutusanName: item.petikanPutusanName || '',
      akteBht: item.akteBht || null,
      akteBhtName: item.akteBhtName || '',
      status: item.status || ''
    }));

    const combined = [...mappedLocal];
    const seen = new Set(combined.map(item => item.nrpNip || item.id).filter(Boolean));
    MOCK_KESATUAN_DATA.forEach(mockItem => {
      if (!seen.has(mockItem.nrpNip)) {
        seen.add(mockItem.nrpNip);
        combined.push(mockItem);
      }
    });
    return combined;
  });
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
              noPerkara: data.noPerkara || '',
              namaLengkap: data.namaLengkap,
              nrpNip: data.nrpNip,
              pangkat: data.pangkat,
              satuan: data.satuan,
              jenisPerkara: data.jenisPerkara,
              kategoriPelanggaran: data.kategoriPelanggaran || '',
              pasal: data.pasal || '',
              tahapPenyelesaian: data.tahapPenyelesaian?.toUpperCase() === 'SIDANG' ? 'DILMIL' : (data.tahapPenyelesaian?.toUpperCase() || (data.status === 'SELESAI' ? 'PUTUSAN' : 'DILMIL')),
              putusan: data.putusan || (data.status === 'SELESAI' ? 'Selesai' : '-'),
              pidanaPokok: data.pidanaPokok || '',
              pidanaTambahan: data.pidanaTambahan || '',
              noSalinanPutusan: data.noSalinanPutusan || '',
              noPetikanPutusan: data.noPetikanPutusan || '',
              noAkteBht: data.noAkteBht || '',
              salinanPutusan: data.salinanPutusan || null,
              salinanPutusanName: data.salinanPutusanName || '',
              petikanPutusan: data.petikanPutusan || null,
              petikanPutusanName: data.petikanPutusanName || '',
              akteBht: data.akteBht || null,
              akteBhtName: data.akteBhtName || '',
              fileUrl: data.fileUrl || null,
              fileName: data.fileName || '',
              status: data.status || ''
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
        isOfflineCreated: item.isOfflineCreated,
        noPerkara: item.noPerkara || '',
        namaLengkap: item.namaLengkap,
        nrpNip: item.nrpNip,
        pangkat: item.pangkat,
        satuan: item.satuan,
        jenisPerkara: item.jenisPerkara,
        kategoriPelanggaran: item.kategoriPelanggaran || '',
        pasal: item.pasal || '',
        tahapPenyelesaian: item.tahapPenyelesaian?.toUpperCase() === 'SIDANG' ? 'DILMIL' : (item.tahapPenyelesaian?.toUpperCase() || (item.status === 'SELESAI' ? 'PUTUSAN' : 'DILMIL')),
        putusan: item.putusan || (item.status === 'SELESAI' ? 'Selesai' : '-'),
        pidanaPokok: item.pidanaPokok || '',
        pidanaTambahan: item.pidanaTambahan || '',
        noSalinanPutusan: item.noSalinanPutusan || '',
        noPetikanPutusan: item.noPetikanPutusan || '',
        noAkteBht: item.noAkteBht || '',
        salinanPutusan: item.salinanPutusan || null,
        salinanPutusanName: item.salinanPutusanName || '',
        petikanPutusan: item.petikanPutusan || null,
        petikanPutusanName: item.petikanPutusanName || '',
        akteBht: item.akteBht || null,
        akteBhtName: item.akteBhtName || '',
        status: item.status || ''
      }));

      // Combine and filter duplicates
      const uniqueList = [];
      const seen = new Set();
      firestoreList.forEach(item => {
        const key = item.noPerkara || item.id || item.nrpNip;
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueList.push(item);
        }
      });

      mappedLocal.forEach(item => {
        const key = item.noPerkara || item.id || item.nrpNip;
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueList.push(item);
        }
      });
      
      MOCK_KESATUAN_DATA.forEach(mockItem => {
        if (!seen.has(mockItem.nrpNip)) {
          seen.add(mockItem.nrpNip);
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
    const nameStr = item.namaLengkap || '';
    const nrpStr = item.nrpNip || '';
    const jenisStr = item.jenisPerkara || '';
    const satuanStr = item.satuan || '';

    // Only show cases belonging to the selected unit (with spelling-tolerant matching)
    const matchesUnit = (() => {
      if (!satuanStr) return false;
      const clean = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/e/g, '');
      const cleanSatuan = clean(satuanStr);
      const cleanSelectedName = clean(selectedKesatuan.nama);
      const cleanSelectedId = clean(selectedKesatuan.id);
      const result = cleanSatuan.includes(cleanSelectedName) || 
                     cleanSelectedName.includes(cleanSatuan) || 
                     cleanSatuan.includes(cleanSelectedId);
      console.log(`[matchesUnit] Checking "${item.namaLengkap}" (${satuanStr}) vs Selected (${selectedKesatuan.nama}): ${result}`);
      return result;
    })();

    const matchesSearch = 
      filterSearch === '' || 
      nameStr.toLowerCase().includes(filterSearch.toLowerCase()) || 
      nrpStr.includes(filterSearch);

    const matchesPerkara = 
      filterPerkara === '' || 
      jenisStr.toLowerCase().includes(filterPerkara.toLowerCase()) ||
      (item.kategoriPelanggaran || '').toLowerCase().includes(filterPerkara.toLowerCase());

    const matchesTahap = 
      filterTahap === '' || 
      item.tahapPenyelesaian === filterTahap;

    return matchesUnit && matchesSearch && matchesPerkara && matchesTahap;
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
    if (!canPrintUnit) {
      window.alert("Anda tidak memiliki hak akses untuk mencetak data perkara dari kesatuan lain.");
      return;
    }
    window.print();
  };

  // Simulate PDF generation progress
  const startExportSimulation = () => {
    if (!canPrintUnit) {
      window.alert("Anda tidak memiliki hak akses untuk mencetak data perkara dari kesatuan lain.");
      return;
    }
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
      <header className="sticky top-0 h-16 bg-[#0a1f3d] flex items-center justify-between px-6 text-white shadow-md z-50 select-none print:hidden">
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

        {/* Right side Profile */}
        {isKesatuanVerified && selectedKesatuan && (
          <div className="flex items-center gap-2 bg-[#ffffff10] border border-[#ffffff15] rounded-full pl-3 pr-4 py-1.5 max-w-[150px] sm:max-w-xs md:max-w-md select-none flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-[#0a1f3d] flex items-center justify-center shadow-sm flex-shrink-0">
              <User size={14} className="stroke-[3]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                Akses Satuan
              </span>
              <span className="text-[10px] sm:text-[11px] font-extrabold text-white truncate max-w-[80px] sm:max-w-[150px] md:max-w-[200px] leading-tight mt-0.5" title={selectedKesatuan ? selectedKesatuan.nama : ''}>
                {selectedKesatuan ? selectedKesatuan.nama : ''}
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

        {/* 2. SIDEBAR (print hidden) */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between select-none transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } print:hidden`}>
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
                className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>

              {/* MOBILE-ONLY LINK */}
              <Link 
                to="/" 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <LayoutDashboard size={18} />
                <span>Halaman Isi</span>
              </Link>

              <Link 
                to="/input-data" 
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
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
                className="md:hidden flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 border-l-4 border-blue-600 transition-all"
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
        <main className="flex-1 bg-[#f8fafc] p-6 lg:p-8 overflow-y-auto flex flex-col justify-between print:p-0 print:bg-white">
          <div>
            
            {/* Breadcrumb (print hidden) */}
            <div className="text-[10px] text-slate-400 font-bold tracking-widest mb-1 select-none flex items-center gap-1.5 print:hidden">
              <span>DASHBOARD</span>
              <ChevronRight size={10} />
              <span>PERKARA KESATUAN</span>
              <ChevronRight size={10} />
              <span className="text-[#0a1f3d]">{selectedKesatuan.nama}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-extrabold text-[#0a1f3d] tracking-tight uppercase print:text-lg">
                  Data Perkara Kesatuan:
                </h1>
                <select
                  value={selectedKesatuan.id}
                  onChange={(e) => {
                    const found = KESATUAN_OPTIONS.find(k => k.id === e.target.value);
                    if (found) {
                      setSelectedKesatuan(found);
                      sessionStorage.setItem('selected_kesatuan', JSON.stringify(found));
                    }
                  }}
                  className="bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs text-[#0a1f3d] font-extrabold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none print:hidden shadow-sm"
                >
                  {KESATUAN_OPTIONS.map(k => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
                <span className="hidden print:inline text-xl font-extrabold text-[#0a1f3d] uppercase">
                  {selectedKesatuan.nama}
                </span>
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
                      <option value="DILMIL">DILMIL</option>
                      <option value="PENGADILAN NEGERI">PENGADILAN NEGERI</option>
                      <option value="PENGADILAN AGAMA">PENGADILAN AGAMA</option>
                      <option value="TATA USAHA NEGARA">TATA USAHA NEGARA</option>
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
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between select-none print:hidden">
                <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-3">
                  <h3 className="font-extrabold text-xs text-[#0a1f3d] uppercase tracking-wider">
                    Daftar Perkara Kesatuan
                  </h3>
                </div>
                
                {canPrintUnit && (
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-[#1d6f42] hover:bg-[#155231] text-white rounded-lg flex items-center gap-1.5 font-bold text-[10px] shadow-sm transition active:scale-[0.98]"
                  >
                    <Printer size={12} />
                    <span>Cetak PDF</span>
                  </button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                      <th className="py-3.5 px-6 text-center w-16">NO</th>
                      <th className="py-3.5 px-6">NAMA PERSONEL</th>
                      <th className="py-3.5 px-6">NRP</th>
                      <th className="py-3.5 px-6">PANGKAT</th>
                      <th className="py-3.5 px-6">PERKARA</th>
                      <th className="py-3.5 px-6">PASAL</th>
                      <th className="py-3.5 px-6 text-center">TAHAPAN PENYELESAIAN</th>
                      <th className="py-3.5 px-8">PUTUSAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {paginatedList.map((item, idx) => {
                      // Color schemes matching tahapan
                      let badgeStyle = "border-slate-300 text-slate-500 bg-slate-50";
                      
                      const tLower = (item.tahapPenyelesaian || '').toLowerCase();
                      if (tLower.includes('sidang') || tLower.includes('dilmil') || tLower.includes('pengadilan negeri') || tLower.includes('pengadilan agama') || tLower.includes('tata usaha negara')) {
                        badgeStyle = "border-blue-400 text-blue-600 bg-blue-50/50";
                      } else if (tLower.includes('penyidikan')) {
                        badgeStyle = "border-slate-400 text-slate-500 bg-slate-50";
                      } else if (tLower.includes('putusan') || tLower.includes('selesai')) {
                        badgeStyle = "border-emerald-400 text-emerald-600 bg-emerald-50/50";
                      } else if (tLower.includes('penuntutan')) {
                        badgeStyle = "border-blue-500 text-blue-600 bg-blue-50/20";
                      } else if (tLower.includes('banding') || tLower.includes('kasasi') || tLower.includes('peninjauan')) {
                        badgeStyle = "border-amber-400 text-amber-600 bg-amber-50/50";
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
                            {formatJenisPerkara(item.jenisPerkara, item.kategoriPelanggaran)}
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-semibold">
                            {item.pasal || '-'}
                          </td>
                          <td className="py-4 px-6 text-center select-none">
                            <span className={`px-3 py-0.5 border rounded-full font-bold text-[9px] tracking-wider inline-block ${badgeStyle}`}>
                              {item.tahapPenyelesaian}
                            </span>
                          </td>
                          <td className="py-4 px-8">
                            {renderPutusanCell(item)}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredList.length === 0 && (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
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
              KUMDAM XVII | &copy; 2026 Sistem Informasi Data Perkara KUMDAM XVII/Cenderawasih. Hak Cipta Dilindungi.
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

      {/* 9. CUSTOM LOGOUT CONFIRMATION MODAL */}
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
