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
  Trash2,
  Printer,
  Menu,
  Database,
  Edit2
} from 'lucide-react';
import { db, storage } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

import logoKumdam from '../assets/images/logo_kumdam.jpeg';

// Beautiful custom SVG badge for KUMDAM XVII / CENDERAWASIH
const KumdamLogo = () => (
  <img src={logoKumdam} alt="Logo Kumdam XVII Cenderawasih" className="w-10 h-10 object-cover rounded-lg flex-shrink-0 drop-shadow-md border border-black" />
);

// High-fidelity military officer silhouette SVG or dynamic uploaded photo
const MilitaryAvatar = ({ src }) => {
  if (src) {
    return (
      <div className="w-16 h-16 rounded-xl bg-white border border-slate-200/80 shadow-md flex items-center justify-center overflow-hidden relative flex-shrink-0">
        <img src={src} alt="Foto Personel" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700/80 shadow-md flex items-center justify-center overflow-hidden relative flex-shrink-0">
      <div className="absolute top-1 left-1 right-1 h-1.5 bg-amber-500 rounded-sm"></div>
      <svg className="w-12 h-12 text-slate-400 mt-2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a4 4 0 0 0-4 4v3.25L5 11v8h14v-8l-3-1.75V6a4 4 0 0 0-4-4zm0 2a2 2 0 0 1 2 2v2.75l-2-.5-2 .5V6a2 2 0 0 1 2-2zm-5 8.75l2.5-1.46v2.46L7 14.5v-1.75zm10 0v1.75l-2.5-.75v-2.46l2.5 1.46z" />
      </svg>
    </div>
  );
};

// Helper to render Putusan content with download links for PDF documents
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
        <span className="text-slate-400 italic">{item.putusan || '-'}</span>
      )}
      
      {(hasSalinan || hasPetikan || hasAkte) && (
        <div className="flex flex-wrap gap-1 mt-1.5 select-none print:hidden" onClick={(e) => e.stopPropagation()}>
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

// Prepopulated static mock data matching the screenshot and layout
const REKAP_MOCK_DATA = [];

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

export default function DataRekapPerkara() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();
  
  // Determine if the current session has a verified kesatuan role
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

  // Helper to determine if a case can be deleted by the current user
  const canDeleteCase = (item) => {
    if (!isKesatuanVerified || !loggedInKesatuan) {
      // Jika kesatuan belum diverifikasi/dipilih, tidak boleh menghapus data apapun
      return false;
    }
    // Specific kesatuan can only delete their own cases
    const clean = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/e/g, '');
    const cleanUserUnit = clean(loggedInKesatuan.nama);
    const cleanCaseUnit = clean(item.satuan);
    return cleanUserUnit === cleanCaseUnit || cleanCaseUnit.includes(clean(loggedInKesatuan.id)) || cleanUserUnit.includes(cleanCaseUnit);
  };
  
  // State variables - pre-initialized from LocalStorage cache for 0ms rendering
  const [perkaraList, setPerkaraList] = useState(() => {
    const localData = localStorage.getItem('perkara_data');
    const localList = localData ? JSON.parse(localData) : [];
    const uniqueList = localList.map(item => ({
      ...item,
      tahapPenyelesaian: item.tahapPenyelesaian?.toUpperCase() === 'SIDANG' ? 'DILMIL' : (item.tahapPenyelesaian?.toUpperCase() || (item.status === 'SELESAI' ? 'PUTUSAN' : 'DILMIL'))
    }));
    const seen = new Set(uniqueList.map(item => item.noPerkara || item.id).filter(Boolean));
    REKAP_MOCK_DATA.forEach(mockItem => {
      const key = mockItem.noPerkara || mockItem.id;
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueList.push({
          ...mockItem,
          tahapPenyelesaian: mockItem.tahapPenyelesaian?.toUpperCase() === 'SIDANG' ? 'DILMIL' : (mockItem.tahapPenyelesaian?.toUpperCase() || (mockItem.status === 'SELESAI' ? 'PUTUSAN' : 'DILMIL'))
        });
      }
    });
    return uniqueList;
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState(() => {
    const localData = localStorage.getItem('perkara_data');
    const localList = localData ? JSON.parse(localData) : [];
    if (localList.length > 0) {
      const first = localList[0];
      return {
        ...first,
        tahapPenyelesaian: first.tahapPenyelesaian?.toUpperCase() === 'SIDANG' ? 'DILMIL' : (first.tahapPenyelesaian?.toUpperCase() || (first.status === 'SELESAI' ? 'PUTUSAN' : 'DILMIL'))
      };
    }
    if (REKAP_MOCK_DATA.length > 0) {
      const first = REKAP_MOCK_DATA[0];
      return {
        ...first,
        tahapPenyelesaian: first.tahapPenyelesaian?.toUpperCase() === 'SIDANG' ? 'DILMIL' : (first.tahapPenyelesaian?.toUpperCase() || (first.status === 'SELESAI' ? 'PUTUSAN' : 'DILMIL'))
      };
    }
    return null;
  });
  
  // Modal states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('select'); // select, processing, done
  const [exportTarget, setExportTarget] = useState('rekap'); // rekap, perorangan, kesatuan
  const [printTarget, setPrintTarget] = useState(null);

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

      // Combine: Firestore first, then only offline-created items from LocalStorage
      const uniqueList = [];
      const seen = new Set();
      firestoreList.forEach(item => {
        const key = item.noPerkara || item.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueList.push({
            ...item,
            tahapPenyelesaian: item.tahapPenyelesaian?.toUpperCase() === 'SIDANG' ? 'DILMIL' : (item.tahapPenyelesaian?.toUpperCase() || (item.status === 'SELESAI' ? 'PUTUSAN' : 'DILMIL'))
          });
        }
      });

      localList.forEach(item => {
        const key = item.noPerkara || item.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueList.push({
            ...item,
            tahapPenyelesaian: item.tahapPenyelesaian?.toUpperCase() === 'SIDANG' ? 'DILMIL' : (item.tahapPenyelesaian?.toUpperCase() || (item.status === 'SELESAI' ? 'PUTUSAN' : 'DILMIL'))
          });
        }
      });

      REKAP_MOCK_DATA.forEach(mockItem => {
        const key = mockItem.noPerkara || mockItem.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueList.push({
            ...mockItem,
            tahapPenyelesaian: mockItem.tahapPenyelesaian?.toUpperCase() === 'SIDANG' ? 'DILMIL' : (mockItem.tahapPenyelesaian?.toUpperCase() || (mockItem.status === 'SELESAI' ? 'PUTUSAN' : 'DILMIL'))
          });
        }
      });

      setPerkaraList(uniqueList);
      
      // Set the first case as the default selected case if none is selected yet
      if (uniqueList.length > 0) {
        setSelectedCase(prev => prev || uniqueList[0]);
      }
    };

    loadData();
  }, []);

  // Filter application
  const filteredList = perkaraList.filter(item => {
    const nameStr = item.namaLengkap || '';
    const nrpStr = item.nrpNip || '';
    const satuanStr = item.satuan || '';
    const jenisStr = item.jenisPerkara || '';

    const matchesSearch = 
      nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nrpStr.includes(searchTerm) ||
      satuanStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jenisStr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSatuan = filters.satuan === '' || satuanStr.toLowerCase().includes(filters.satuan.toLowerCase());
    const matchesJenis = filters.jenisPerkara === '' || jenisStr.toLowerCase().includes(filters.jenisPerkara.toLowerCase());
    const matchesStatus = filters.status === '' || item.status === filters.status;

    return matchesSearch && matchesSatuan && matchesJenis && matchesStatus;
  });

  // Pagination logic
  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(filteredList.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filteredList.slice(startIndex, startIndex + itemsPerPage);
  const itemsToRender = printTarget === 'rekap' 
    ? (isKesatuanVerified && loggedInKesatuan
        ? filteredList.filter(item => {
            const clean = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/e/g, '');
            const cleanSatuan = clean(item.satuan);
            const cleanLoggedInName = clean(loggedInKesatuan.nama);
            const cleanLoggedInId = clean(loggedInKesatuan.id);
            return cleanSatuan === cleanLoggedInName || cleanSatuan.includes(cleanLoggedInId) || cleanLoggedInName.includes(cleanSatuan);
          })
        : filteredList)
    : paginatedList;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Row selection handler
  const handleSelectRow = (item) => {
    setSelectedCase(item);
  };

  // Helper to safely delete a file from Storage by its URL
  const deleteFileFromStorage = async (url) => {
    if (!url || typeof url !== 'string' || !url.startsWith('https://firebasestorage.googleapis.com')) return;
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
      console.log("Successfully deleted file from Firebase Storage:", url);
    } catch (error) {
      console.warn("Failed to delete file from Firebase Storage:", error);
    }
  };

  // Delete case handler
  const handleDeleteCase = async (item, e) => {
    e.stopPropagation(); // prevent row click selection trigger
    if (!canDeleteCase(item)) {
      window.alert("Anda tidak memiliki hak akses untuk menghapus data perkara dari kesatuan lain.");
      return;
    }
    if (window.confirm(`Apa anda yakin ingin menghapus data perkara dari personel "${item.namaLengkap}"?`)) {
      // 1. Immediately update component state (instant UI refresh)
      setPerkaraList(prevList => {
        const newList = prevList.filter(caseItem => caseItem.id !== item.id && caseItem.noPerkara !== item.noPerkara);
        
        // Update selectedCase if it was the deleted one, referencing the new list
        if (selectedCase && (selectedCase.id === item.id || selectedCase.noPerkara === item.noPerkara)) {
          setSelectedCase(newList.length > 0 ? newList[0] : null);
        }
        return newList;
      });

      // 2. Immediately update LocalStorage
      const localData = localStorage.getItem('perkara_data');
      if (localData) {
        const localList = JSON.parse(localData);
        const updatedLocal = localList.filter(caseItem => caseItem.id !== item.id && caseItem.noPerkara !== item.noPerkara);
        localStorage.setItem('perkara_data', JSON.stringify(updatedLocal));
      }

      // 3. Delete files from Firebase Storage
      if (item.fotoPersonel) deleteFileFromStorage(item.fotoPersonel);
      if (item.fileUrl) deleteFileFromStorage(item.fileUrl);
      if (item.salinanPutusan) deleteFileFromStorage(item.salinanPutusan);
      if (item.petikanPutusan) deleteFileFromStorage(item.petikanPutusan);
      if (item.akteBht) deleteFileFromStorage(item.akteBht);

      // 4. Delete from Firestore in background (non-blocking)
      if (item.id && !item.id.toString().startsWith('k_') && !item.id.toString().startsWith('c_')) {
        deleteDoc(doc(db, 'perkara', item.id)).catch(error => {
          console.warn("Could not delete from Firestore in background:", error);
        });
      }
      
      window.alert("Data perkara berhasil dihapus.");
    }
  };

  // Simulate PDF/Excel Export Progress
  const startExportSimulation = (type) => {
    if (exportTarget === 'rekap' && isKesatuanVerified) {
      window.alert("Anda tidak memiliki hak akses untuk mencetak rekap data seluruh kesatuan.");
      return;
    }
    if (exportTarget === 'perorangan' && !canPrintSelectedCase) {
      window.alert("Anda tidak memiliki hak akses untuk mencetak data perkara personel dari kesatuan lain.");
      return;
    }
    if (exportTarget === 'kesatuan' && !canPrintActiveUnit) {
      window.alert("Anda tidak memiliki hak akses untuk mencetak data perkara dari kesatuan lain.");
      return;
    }

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

  const canPrintSelectedCase = selectedCase && (
    !isKesatuanVerified ||
    (loggedInKesatuan && (() => {
      const clean = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/e/g, '');
      const cleanSatuan = clean(selectedCase.satuan);
      const cleanLoggedInName = clean(loggedInKesatuan.nama);
      const cleanLoggedInId = clean(loggedInKesatuan.id);
      return cleanSatuan === cleanLoggedInName || cleanSatuan.includes(cleanLoggedInId) || cleanLoggedInName.includes(cleanSatuan);
    })())
  );

  const canPrintActiveUnit = !isKesatuanVerified || (
    loggedInKesatuan && (() => {
      const clean = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/e/g, '');
      const cleanActive = clean(activeUnit);
      const cleanLoggedInName = clean(loggedInKesatuan.nama);
      const cleanLoggedInId = clean(loggedInKesatuan.id);
      return cleanActive === cleanLoggedInName || cleanActive.includes(cleanLoggedInId) || cleanLoggedInName.includes(cleanActive);
    })()
  );

  const handlePrint = (target) => {
    if (target === 'perorangan' && !canPrintSelectedCase) {
      window.alert("Anda tidak memiliki hak akses untuk mencetak data perkara personel dari kesatuan lain.");
      return;
    }
    if (target === 'kesatuan' && !canPrintActiveUnit) {
      window.alert("Anda tidak memiliki hak akses untuk mencetak data perkara dari kesatuan lain.");
      return;
    }

    setPrintTarget(target);
    setTimeout(() => {
      window.print();
      setPrintTarget(null);
    }, 150);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          ${printTarget ? `
            body, html {
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            header, aside, form, nav, button, .print\\:hidden, [data-print-hide] {
              display: none !important;
            }
            section {
              display: none !important;
            }
            section.print-target-${printTarget} {
              display: block !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
            }
            section.print-target-${printTarget} .bg-slate-50 {
              background-color: transparent !important;
              border: none !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
            section.print-target-${printTarget} .border-b {
              border: none !important;
            }
            section.print-target-${printTarget} .border-l-4 {
              border: none !important;
              padding-left: 0 !important;
            }
            section.print-target-${printTarget} h3 {
              font-size: 14px !important;
              color: black !important;
              margin-bottom: 10px !important;
            }
            section.print-target-${printTarget} table {
              border-collapse: collapse !important;
              width: 100% !important;
              margin-top: 15px !important;
            }
            section.print-target-${printTarget} th, 
            section.print-target-${printTarget} td {
              border: 1px solid #000000 !important;
              padding: 8px 6px !important;
              text-align: center !important;
              color: black !important;
              font-size: 11px !important;
            }
            section.print-target-${printTarget} th {
              background-color: #f1f5f9 !important;
              font-weight: bold !important;
              text-transform: uppercase !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            section.print-target-${printTarget} td.text-left-print {
              text-align: left !important;
            }
            .action-col-print {
              display: none !important;
            }
          ` : ''}
        }
      `}} />
      
      {/* 1. TOP NAVBAR (Consistent design layout) */}
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

        {/* Right side Profile */}
        {isKesatuanVerified && loggedInKesatuan && (
          <div className="flex items-center gap-2 bg-[#ffffff10] border border-[#ffffff15] rounded-full pl-3 pr-4 py-1.5 max-w-[150px] sm:max-w-xs md:max-w-md select-none flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-[#0a1f3d] flex items-center justify-center shadow-sm flex-shrink-0">
              <User size={14} className="stroke-[3]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                Akses Satuan
              </span>
              <span className="text-[10px] sm:text-[11px] font-extrabold text-white truncate max-w-[80px] sm:max-w-[150px] md:max-w-[200px] leading-tight mt-0.5" title={loggedInKesatuan ? loggedInKesatuan.nama : ''}>
                {loggedInKesatuan ? loggedInKesatuan.nama : ''}
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
                className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 border-l-4 border-blue-600 transition-all"
              >
                <BarChart3 size={18} />
                <span>Rekapitulasi</span>
              </Link>

              {/* MOBILE-ONLY LINK */}
              <Link 
                to="/rekap-perkara" 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 border-l-4 border-blue-600 transition-all"
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
              </div>
            </div>

            {/* 4. TABLE: 1. DATA REKAP PERKARA */}
            <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden mb-8 print-target-rekap">
              
              {/* Header Title bar */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between select-none">
                <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-3">
                  <h3 className="font-extrabold text-xs text-[#0a1f3d] uppercase tracking-wider">
                    1. DATA REKAP PERKARA ( SELURUH SATUAN DAN PERSONEL YANG TERLIBAT)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-bold text-[10px] tracking-wider uppercase print:hidden">
                    Total: {filteredList.length} Perkara
                  </div>
                  
                  {/* Cetak PDF Button placed exactly next to the total badge */}
                  {/* Cetak PDF Button placed exactly next to the total badge */}
                  <button
                    type="button"
                    onClick={() => handlePrint('rekap')}
                    className="px-3 py-1.5 bg-[#1d6f42] hover:bg-[#155231] text-white rounded-lg flex items-center gap-1.5 font-bold text-[10px] shadow-sm transition active:scale-[0.98] print:hidden"
                  >
                    <Printer size={12} />
                    <span>Cetak PDF</span>
                  </button>
                </div>
              </div>

              {/* Print-Only Header Block matching Paldam Jaya layout */}
              <div className="hidden print:block p-6 text-left">
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  REKAP DATA PERKARA {isKesatuanVerified && loggedInKesatuan ? loggedInKesatuan.nama.toUpperCase() : 'KUMDAM XVII/CENDERAWASIH'}
                </h1>
                <div className="mt-3">
                  <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                    REKAPITULASI DATA PERKARA HUKUM
                  </h2>
                  <h2 className="text-xs font-bold text-emerald-700 uppercase tracking-widest mt-0.5">
                    {isKesatuanVerified && loggedInKesatuan 
                      ? `( KHUSUS SATUAN ${loggedInKesatuan.nama.toUpperCase()} )`
                      : "( SELURUH SATUAN DAN PERSONEL YANG TERLIBAT )"}
                  </h2>
                </div>
                <div className="h-[2px] bg-slate-800 mt-4"></div>
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
                      <th className="py-3.5 px-4">PASAL</th>
                      <th className="py-3.5 px-4">TAHAPAN PENYELESAIAN</th>
                      <th className="py-3.5 px-6">PUTUSAN</th>
                      <th className="py-3.5 px-4 text-center w-20 action-col-print">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {itemsToRender.map((item, idx) => {
                      const numberString = String((printTarget === 'rekap' ? 0 : startIndex) + idx + 1).padStart(2, '0');
                      const isSelected = selectedCase && selectedCase.id === item.id;
                      
                      // Status color mapping - display exact user input stage (e.g. BANDING)
                      let statusBadge = (
                        <span className="flex items-center gap-1.5 font-bold text-[#b45309]">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                          {item.tahapPenyelesaian || 'Proses'}
                        </span>
                      );
                      
                      const tLower = (item.tahapPenyelesaian || '').toLowerCase();
                      if (tLower === 'selesai' || tLower === 'putusan' || (!item.tahapPenyelesaian && item.status === 'SELESAI')) {
                        statusBadge = (
                          <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            Selesai
                          </span>
                        );
                      } else if (tLower.includes('sidang') || tLower.includes('dilmil') || tLower.includes('pengadilan negeri') || tLower.includes('pengadilan agama') || tLower.includes('tata usaha negara')) {
                        let displayLabel = 'DILMIL';
                        if (tLower.includes('pengadilan negeri')) displayLabel = 'Pengadilan Negeri';
                        else if (tLower.includes('pengadilan agama')) displayLabel = 'Pengadilan Agama';
                        else if (tLower.includes('tata usaha negara')) displayLabel = 'Tata Usaha Negara';
                        statusBadge = (
                          <span className="flex items-center gap-1.5 font-bold text-blue-600">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            {displayLabel}
                          </span>
                        );
                      } else if (item.tahapPenyelesaian) {
                        statusBadge = (
                          <span className="flex items-center gap-1.5 font-bold text-[#b45309]">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                            {item.tahapPenyelesaian}
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
                          <td className="py-4 px-4 font-bold text-slate-800 text-left-print">
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
                            {formatJenisPerkara(item.jenisPerkara, item.kategoriPelanggaran)}
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-semibold">
                            {item.pasal || '-'}
                          </td>
                          <td className="py-4 px-4">
                            <span className="print:hidden">{statusBadge}</span>
                            <span className="hidden print:inline font-bold uppercase text-slate-700">{item.tahapPenyelesaian || item.status || 'PROSES'}</span>
                          </td>
                          <td className="py-4 px-6">
                            {renderPutusanCell(item)}
                          </td>
                          <td className="py-4 px-4 text-center action-col-print text-xs">
                            <div className="flex items-center justify-center gap-2">
                              {canDeleteCase(item) ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/edit-data/${item.id}`);
                                    }}
                                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg hover:text-blue-700 transition"
                                    title="Edit Data Perkara"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteCase(item, e)}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg hover:text-red-700 transition"
                                    title="Hapus Data Perkara"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              ) : (
                                <span className="text-slate-400 font-semibold">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredList.length === 0 && (
                      <tr>
                        <td colSpan="10" className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                          Tidak ada data rekap perkara yang sesuai filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with pagination */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs select-none print:hidden">
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
              <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between print-target-perorangan">
                <div>
                  <div className="flex items-center justify-between gap-3 border-l-4 border-blue-600 pl-3 mb-6 select-none">
                    <h3 className="font-extrabold text-xs text-[#0a1f3d] uppercase tracking-wider">
                      2. DATA RINCIAN PERKARA PERORANGAN
                    </h3>
                    {selectedCase && canPrintSelectedCase && (
                      <button
                        type="button"
                        onClick={() => handlePrint('perorangan')}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1.5 font-bold text-[10px] shadow-sm transition active:scale-[0.98]"
                      >
                        <Printer size={11} className="text-slate-500" />
                        <span>Cetak PDF</span>
                      </button>
                    )}
                  </div>

                  {selectedCase ? (
                    <div>
                      {/* Officer Info Header */}
                      <div className="flex items-center gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100 mb-6">
                        <MilitaryAvatar src={selectedCase.fotoPersonel} />
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
                                <div>{formatJenisPerkara(selectedCase.jenisPerkara, selectedCase.kategoriPelanggaran)}</div>
                                {selectedCase.pasal && (
                                  <div className="text-[10px] text-slate-500 font-bold mt-1 select-none">
                                    Pasal: <span className="font-semibold text-slate-700">{selectedCase.pasal}</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-500 max-w-[200px] leading-relaxed">
                                <div>{selectedCase.kronologis || 'Detail perkara sedang diproses.'}</div>
                                {selectedCase.fileUrl && (
                                  <button
                                    onClick={() => downloadFile(selectedCase.fileUrl, selectedCase.fileName || 'dokumen_kronologis.pdf')}
                                    className="mt-2 px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded text-[9px] font-extrabold transition-colors flex items-center gap-1 shadow-sm active:scale-[0.98]"
                                    title="Unduh Berkas Kronologis"
                                  >
                                    📄 Berkas Kronologis
                                  </button>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                                  ((selectedCase.tahapPenyelesaian || '').toLowerCase() === 'selesai' ||
                                   (selectedCase.tahapPenyelesaian || '').toLowerCase() === 'putusan' ||
                                   (!selectedCase.tahapPenyelesaian && selectedCase.status === 'SELESAI'))
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : ((selectedCase.tahapPenyelesaian || '').toLowerCase().includes('sidang') ||
                                       (selectedCase.tahapPenyelesaian || '').toLowerCase().includes('dilmil') ||
                                       (selectedCase.tahapPenyelesaian || '').toLowerCase().includes('pengadilan negeri') ||
                                       (selectedCase.tahapPenyelesaian || '').toLowerCase().includes('pengadilan agama') ||
                                       (selectedCase.tahapPenyelesaian || '').toLowerCase().includes('tata usaha negara'))
                                      ? 'bg-blue-50 text-blue-600 border-blue-100'
                                      : 'bg-amber-50 text-[#b45309] border border-amber-100'
                                }`}>
                                  {selectedCase.tahapPenyelesaian || selectedCase.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {renderPutusanCell(selectedCase)}
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
              <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between print-target-kesatuan">
                <div>
                  <div className="flex items-center justify-between gap-3 border-l-4 border-blue-600 pl-3 mb-6 select-none">
                    <h3 className="font-extrabold text-xs text-[#0a1f3d] uppercase tracking-wider">
                      3. DATA PERKARA KESATUAN: {activeUnit.toUpperCase()}
                    </h3>
                    {canPrintActiveUnit && (
                      <button
                        type="button"
                        onClick={() => handlePrint('kesatuan')}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1.5 font-bold text-[10px] shadow-sm transition active:scale-[0.98]"
                      >
                        <Printer size={11} className="text-slate-500" />
                        <span>Cetak PDF</span>
                      </button>
                    )}
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
                              <div>{formatJenisPerkara(item.jenisPerkara, item.kategoriPelanggaran)}</div>
                              {item.pasal && (
                                <div className="text-[10px] text-slate-500 font-bold mt-1 select-none">
                                  Pasal: <span className="font-semibold text-slate-700">{item.pasal}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border ${
                                ((item.tahapPenyelesaian || '').toLowerCase() === 'selesai' ||
                                 (item.tahapPenyelesaian || '').toLowerCase() === 'putusan' ||
                                 (!item.tahapPenyelesaian && item.status === 'SELESAI'))
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : ((item.tahapPenyelesaian || '').toLowerCase().includes('sidang') ||
                                     (item.tahapPenyelesaian || '').toLowerCase().includes('dilmil') ||
                                     (item.tahapPenyelesaian || '').toLowerCase().includes('pengadilan negeri') ||
                                     (item.tahapPenyelesaian || '').toLowerCase().includes('pengadilan agama') ||
                                     (item.tahapPenyelesaian || '').toLowerCase().includes('tata usaha negara'))
                                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                                    : 'bg-amber-50 text-[#b45309] border border-amber-100'
                              }`}>
                                {item.tahapPenyelesaian || item.status}
                              </span>
                            </td>
                             <td className="py-3 px-4">
                               {renderPutusanCell(item)}
                             </td>
                          </tr>
                        ))}
                        {unitCases.length === 0 && (
                          <tr>
                            <td colSpan="5" className="py-8 text-center text-slate-400 font-bold uppercase tracking-wider">
                              Tidak ada data perkara kesatuan.
                            </td>
                          </tr>
                        )}
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
              <span className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">
                {exportTarget === 'rekap' ? 'Ekspor Rekap Perkara' : exportTarget === 'perorangan' ? 'Ekspor Rincian Perorangan' : 'Ekspor Perkara Kesatuan'}
              </span>
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
                    {exportTarget === 'rekap' && `Pilih format dokumen untuk mengekspor rekapitulasi data perkara hukum (Total ${filteredList.length} data):`}
                    {exportTarget === 'perorangan' && `Pilih format dokumen untuk mengekspor rincian perkara personel ${selectedCase?.namaLengkap || ''}:`}
                    {exportTarget === 'kesatuan' && `Pilih format dokumen untuk mengekspor data perkara kesatuan ${activeUnit} (Total ${unitCases.length} data):`}
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
                    onClick={() => {
                      setIsExportModalOpen(false);
                      handlePrint(exportTarget);
                    }}
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
