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
  Download,
  Printer,
  Eye,
  EyeOff,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileCode,
  X,
  FileText as FilePdf,
  CheckCircle,
  AlertCircle,
  Menu,
  Database
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

import logoKumdam from '../assets/images/logo_kumdam.jpeg';

// Beautiful custom SVG badge for KUMDAM XVII / CENDERAWASIH
const KumdamLogo = () => (
  <img src={logoKumdam} alt="Logo Kumdam XVII Cenderawasih" className="w-10 h-10 object-cover rounded-lg flex-shrink-0 drop-shadow-md border border-black" />
);

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
    <div className="flex flex-col gap-1 text-[11px] leading-tight max-w-[250px] mx-auto text-left">
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

// High-fidelity military officer silhouette SVG or dynamic uploaded photo
const MilitaryAvatar = ({ src }) => {
  if (src) {
    return (
      <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200/80 shadow-md flex items-center justify-center overflow-hidden relative flex-shrink-0">
        <img src={src} alt="Foto Personel" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-md flex items-center justify-center overflow-hidden relative flex-shrink-0">
      <div className="absolute top-1 left-1 right-1 h-2 bg-amber-500 rounded-sm"></div>
      <svg className="w-20 h-20 text-slate-400 mt-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a4 4 0 0 0-4 4v3.25L5 11v8h14v-8l-3-1.75V6a4 4 0 0 0-4-4zm0 2a2 2 0 0 1 2 2v2.75l-2-.5-2 .5V6a2 2 0 0 1 2-2zm-5 8.75l2.5-1.46v2.46L7 14.5v-1.75zm10 0v1.75l-2.5-.75v-2.46l2.5 1.46z" />
      </svg>
    </div>
  );
};

// Prepopulated static mock data representing personnel and their legal dossiers
const PERSONNEL_DOSSIERS = [];

const DEFAULT_DOSSIER = {
  nrpNip: '-',
  namaLengkap: 'Tidak Ada Data',
  pangkat: '-',
  jabatan: '-',
  status: 'NON-AKTIF',
  fotoPersonel: null,
  summary: { total: 0, selesai: 0 },
  cases: [],
  logs: []
};

export default function PerkaraPersonel() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();

  // State - pre-initialized from LocalStorage cache for 0ms rendering
  const [dossiers, setDossiers] = useState(() => {
    const localData = localStorage.getItem('perkara_data');
    const localList = localData ? JSON.parse(localData) : [];
    const baseDossiers = JSON.parse(JSON.stringify(PERSONNEL_DOSSIERS));
    
    localList.forEach(caseItem => {
      if (!caseItem.nrpNip) return;
      let dossier = baseDossiers.find(d => d.nrpNip === caseItem.nrpNip);
      
      const formattedCase = {
        id: caseItem.id || caseItem.noPerkara,
        perkara: caseItem.jenisPerkara || 'Perkara',
        nomor: caseItem.noPerkara,
        badge: caseItem.status === 'SELESAI' ? 'PRIORITAS RENDAH' : 'PRIORITAS TINGGI',
        kronologis: caseItem.kronologis || 'Detail perkara sedang diproses.',
        tahapan: caseItem.tahapPenyelesaian || (caseItem.status === 'SELESAI' ? 'Selesai' : 'Proses'),
        detailTahapan: caseItem.tahapPenyelesaian || 'Penyidikan',
        putusan: caseItem.putusan || (caseItem.status === 'SELESAI' ? 'Putusan Selesai' : null),
        dokumenPutusan: caseItem.dokumenPutusan || caseItem.putusan || null,
        pidanaPokok: caseItem.pidanaPokok || '',
        pidanaTambahan: caseItem.pidanaTambahan || '',
        noSalinanPutusan: caseItem.noSalinanPutusan || '',
        noPetikanPutusan: caseItem.noPetikanPutusan || '',
        noAkteBht: caseItem.noAkteBht || '',
        salinanPutusan: caseItem.salinanPutusan || null,
        salinanPutusanName: caseItem.salinanPutusanName || '',
        petikanPutusan: caseItem.petikanPutusan || null,
        petikanPutusanName: caseItem.petikanPutusanName || '',
        akteBht: caseItem.akteBht || null,
        akteBhtName: caseItem.akteBhtName || '',
        fileUrl: caseItem.fileUrl || null,
        fileName: caseItem.fileName || '',
        status: caseItem.status
      };

      if (dossier) {
        if (!dossier.cases.some(c => c.nomor === caseItem.noPerkara)) {
          dossier.cases.push(formattedCase);
        }
        if (caseItem.fotoPersonel) {
          dossier.fotoPersonel = caseItem.fotoPersonel;
        }
        if (!dossier.satuan && caseItem.satuan) {
          dossier.satuan = caseItem.satuan;
        }
      } else {
        const newDossier = {
          nrpNip: caseItem.nrpNip,
          namaLengkap: caseItem.namaLengkap || 'Nama Tidak Diketahui',
          pangkat: caseItem.pangkat || 'Pangkat -',
          jabatan: caseItem.jabatan || 'Jabatan -',
          satuan: caseItem.satuan || 'POMDAM XVII/CENDERAWASIH',
          status: 'AKTIF',
          fotoPersonel: caseItem.fotoPersonel || null,
          summary: { total: 0, selesai: 0 },
          cases: [formattedCase],
          logs: [
            { waktu: 'Baru', aksi: `Perkara ${caseItem.noPerkara} terdaftar.` }
          ]
        };
        baseDossiers.push(newDossier);
      }
    });

    baseDossiers.forEach(d => {
      d.summary.total = d.cases.length;
      d.summary.selesai = d.cases.filter(c => {
        const t = (c.tahapan || '').toLowerCase();
        return t.includes('selesai') || t.includes('putusan') || c.status === 'SELESAI';
      }).length;
    });

    return baseDossiers;
  });

  const [selectedNrp, setSelectedNrp] = useState(() => {
    const localData = localStorage.getItem('perkara_data');
    const localList = localData ? JSON.parse(localData) : [];
    if (localList.length > 0 && localList[0].nrpNip) {
      return localList[0].nrpNip;
    }
    return '';
  });

  const [currentDossier, setCurrentDossier] = useState(() => {
    const localData = localStorage.getItem('perkara_data');
    const localList = localData ? JSON.parse(localData) : [];
    const baseDossiers = JSON.parse(JSON.stringify(PERSONNEL_DOSSIERS));
    
    localList.forEach(caseItem => {
      if (!caseItem.nrpNip) return;
      let dossier = baseDossiers.find(d => d.nrpNip === caseItem.nrpNip);
      const formattedCase = {
        id: caseItem.id || caseItem.noPerkara,
        perkara: caseItem.jenisPerkara || 'Perkara',
        nomor: caseItem.noPerkara,
        badge: caseItem.status === 'SELESAI' ? 'PRIORITAS RENDAH' : 'PRIORITAS TINGGI',
        kronologis: caseItem.kronologis || 'Detail perkara sedang diproses.',
        tahapan: caseItem.tahapPenyelesaian || (caseItem.status === 'SELESAI' ? 'Selesai' : 'Proses'),
        detailTahapan: caseItem.tahapPenyelesaian || 'Penyidikan',
        putusan: caseItem.putusan || (caseItem.status === 'SELESAI' ? 'Putusan Selesai' : null),
        dokumenPutusan: caseItem.dokumenPutusan || caseItem.putusan || null,
        pidanaPokok: caseItem.pidanaPokok || '',
        pidanaTambahan: caseItem.pidanaTambahan || '',
        salinanPutusan: caseItem.salinanPutusan || null,
        salinanPutusanName: caseItem.salinanPutusanName || '',
        petikanPutusan: caseItem.petikanPutusan || null,
        petikanPutusanName: caseItem.petikanPutusanName || '',
        akteBht: caseItem.akteBht || null,
        akteBhtName: caseItem.akteBhtName || ''
      };

      if (dossier) {
        if (!dossier.cases.some(c => c.nomor === caseItem.noPerkara)) {
          dossier.cases.push(formattedCase);
        }
        if (!dossier.satuan && caseItem.satuan) {
          dossier.satuan = caseItem.satuan;
        }
      } else {
        const newDossier = {
          nrpNip: caseItem.nrpNip,
          namaLengkap: caseItem.namaLengkap || 'Nama Tidak Diketahui',
          pangkat: caseItem.pangkat || 'Pangkat -',
          jabatan: caseItem.jabatan || 'Jabatan -',
          satuan: caseItem.satuan || 'POMDAM XVII/CENDERAWASIH',
          status: 'AKTIF',
          fotoPersonel: caseItem.fotoPersonel || null,
          summary: { total: 0, selesai: 0 },
          cases: [formattedCase],
          logs: [
            { waktu: 'Baru', aksi: `Perkara ${caseItem.noPerkara} terdaftar.` }
          ]
        };
        baseDossiers.push(newDossier);
      }
    });

    baseDossiers.forEach(d => {
      d.summary.total = d.cases.length;
      d.summary.selesai = d.cases.filter(c => {
        const t = (c.tahapan || '').toLowerCase();
        return t.includes('selesai') || t.includes('putusan');
      }).length;
    });

    const targetNrp = (localList.length > 0 && localList[0].nrpNip) ? localList[0].nrpNip : '';
    return baseDossiers.find(d => d.nrpNip === targetNrp) || baseDossiers[0] || DEFAULT_DOSSIER;
  });
  const [stageFilter, setStageFilter] = useState('');
  
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

  // Permission helper: general admin can print any, specific kesatuan can only print their own
  const canPrintDossier = !isKesatuanVerified || (
    loggedInKesatuan && currentDossier && (() => {
      const clean = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/e/g, '');
      return clean(currentDossier.satuan) === clean(loggedInKesatuan.nama) || clean(currentDossier.satuan).includes(clean(loggedInKesatuan.id)) || clean(loggedInKesatuan.nama).includes(clean(currentDossier.satuan));
    })()
  );
  
  // Modals state
  const [verdictDoc, setVerdictDoc] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('select'); // select, processing, done

  const [printTarget, setPrintTarget] = useState(null); // 'perorangan' or null

  const handlePrint = () => {
    if (!canPrintDossier) {
      window.alert("Anda tidak memiliki hak akses untuk mencetak data perkara dari kesatuan lain.");
      return;
    }
    setPrintTarget('perorangan');
    setTimeout(() => {
      window.print();
      setPrintTarget(null);
    }, 150);
  };

  // Load Firestore + LocalStorage cases and build dynamic dossiers
  useEffect(() => {
    const loadDynamicData = async () => {
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

      // Combine and deduplicate cases by noPerkara/id
      const combinedCases = [];
      const seen = new Set();
      firestoreList.forEach(item => {
        const key = item.noPerkara || item.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          combinedCases.push(item);
        }
      });

      localList.forEach(item => {
        const key = item.noPerkara || item.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          combinedCases.push(item);
        }
      });
      
      // Let's copy the static mock dossiers
      const baseDossiers = JSON.parse(JSON.stringify(PERSONNEL_DOSSIERS));
      
      combinedCases.forEach(caseItem => {
        if (!caseItem.nrpNip) return; // skip if no nrpNip
        
        // Find existing dossier in baseDossiers
        let dossier = baseDossiers.find(d => d.nrpNip === caseItem.nrpNip);
        
        // Format caseItem to match the dossier's case schema
        const formattedCase = {
          id: caseItem.id || caseItem.noPerkara,
          perkara: caseItem.jenisPerkara || 'Perkara',
          nomor: caseItem.noPerkara,
          badge: caseItem.status === 'SELESAI' ? 'PRIORITAS RENDAH' : 'PRIORITAS TINGGI',
          kronologis: caseItem.kronologis || 'Detail perkara sedang diproses.',
          tahapan: caseItem.tahapPenyelesaian || (caseItem.status === 'SELESAI' ? 'Selesai' : 'Proses'),
          detailTahapan: caseItem.tahapPenyelesaian || 'Penyidikan',
          putusan: caseItem.putusan || (caseItem.status === 'SELESAI' ? 'Putusan Selesai' : null),
          dokumenPutusan: caseItem.dokumenPutusan || caseItem.putusan || null,
          pidanaPokok: caseItem.pidanaPokok || '',
          pidanaTambahan: caseItem.pidanaTambahan || '',
          noSalinanPutusan: caseItem.noSalinanPutusan || '',
          noPetikanPutusan: caseItem.noPetikanPutusan || '',
          noAkteBht: caseItem.noAkteBht || '',
          salinanPutusan: caseItem.salinanPutusan || null,
          salinanPutusanName: caseItem.salinanPutusanName || '',
          petikanPutusan: caseItem.petikanPutusan || null,
          petikanPutusanName: caseItem.petikanPutusanName || '',
          akteBht: caseItem.akteBht || null,
          akteBhtName: caseItem.akteBhtName || '',
          fileUrl: caseItem.fileUrl || null,
          fileName: caseItem.fileName || '',
          status: caseItem.status
        };
        
        if (dossier) {
          // If the dossier exists, check if the case is already added
          if (!dossier.cases.some(c => c.nomor === caseItem.noPerkara)) {
            dossier.cases.push(formattedCase);
          }
          // If the caseItem has a photo, update the dossier's photo
          if (caseItem.fotoPersonel) {
            dossier.fotoPersonel = caseItem.fotoPersonel;
          }
          if (!dossier.satuan && caseItem.satuan) {
            dossier.satuan = caseItem.satuan;
          }
        } else {
          // Create new dossier
          const newDossier = {
            nrpNip: caseItem.nrpNip,
            namaLengkap: caseItem.namaLengkap || 'Nama Tidak Diketahui',
            pangkat: caseItem.pangkat || 'Pangkat -',
            jabatan: caseItem.jabatan || 'Jabatan -',
            satuan: caseItem.satuan || 'POMDAM XVII/CENDERAWASIH',
            status: 'AKTIF',
            fotoPersonel: caseItem.fotoPersonel || null,
            summary: { total: 0, selesai: 0 },
            cases: [formattedCase],
            logs: [
              { waktu: 'Baru', aksi: `Perkara ${caseItem.noPerkara} terdaftar.` }
            ]
          };
          baseDossiers.push(newDossier);
        }
      });
      
      // Recalculate summaries for all dossiers
      baseDossiers.forEach(d => {
        d.summary.total = d.cases.length;
        d.summary.selesai = d.cases.filter(c => {
          const t = (c.tahapan || '').toLowerCase();
          return t.includes('selesai') || t.includes('putusan') || c.status === 'SELESAI';
        }).length;
      });

      setDossiers(baseDossiers);
    };

    loadDynamicData();
  }, []);

  // Update selected NRP if it is no longer valid or unset
  useEffect(() => {
    if (dossiers.length > 0) {
      if (!selectedNrp || !dossiers.some(d => d.nrpNip === selectedNrp)) {
        setSelectedNrp(dossiers[0].nrpNip);
      }
    }
  }, [dossiers, selectedNrp]);

  // Load Dossier based on chosen NRP selection
  useEffect(() => {
    const dossier = dossiers.find(d => d.nrpNip === selectedNrp);
    if (dossier) {
      setCurrentDossier(dossier);
    } else {
      setCurrentDossier(DEFAULT_DOSSIER);
    }
  }, [selectedNrp, dossiers]);

  // Handle personnel list search/select option
  const handleSelectNrp = (e) => {
    setSelectedNrp(e.target.value);
  };

  // Filtered cases
  const filteredCases = currentDossier.cases.filter(c => {
    if (stageFilter === '') return true;
    return c.tahapan.toLowerCase().includes(stageFilter.toLowerCase());
  });

  // Export Simulation
  const startExportSimulation = () => {
    if (!canPrintDossier) {
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
            header, aside, select, button, .print\\:hidden, [data-print-hide], nav {
              display: none !important;
            }
            section {
              display: none !important;
            }
            section.print-target-perorangan {
              display: block !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
            }
            section.print-target-perorangan .print-header-bar {
              display: block !important;
              margin-bottom: 20px !important;
            }
            section.print-target-perorangan table {
              border-collapse: collapse !important;
              width: 100% !important;
              margin-top: 15px !important;
            }
            section.print-target-perorangan th, 
            section.print-target-perorangan td {
              border: 1px solid #000000 !important;
              padding: 10px 8px !important;
              text-align: left !important;
              color: black !important;
              font-size: 11px !important;
            }
            section.print-target-perorangan th {
              background-color: #f1f5f9 !important;
              font-weight: bold !important;
              text-align: center !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          ` : ''}
          @page {
            size: landscape;
            margin: 1.5cm;
          }
        }
      `}} />
      
      {/* 1. TOP NAVBAR (Consistent design layout) */}
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
            <Link to="/perkara-kesatuan" className="h-full flex items-center text-slate-300 hover:text-white border-b-2 border-transparent hover:border-slate-400 px-1 transition-all duration-200">
              Perkara Kesatuan
            </Link>
            <Link to="/perkara-personel" className="h-full flex items-center text-white border-b-2 border-white px-1 transition-all duration-200">
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

      {/* Main layout container wrapping Sidebar and Main Content */}
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
                className="md:hidden flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all"
              >
                <Database size={18} />
                <span>Perkara Kesatuan</span>
              </Link>

              <Link 
                to="/perkara-personel" 
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 border-l-4 border-blue-600 transition-all"
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
          <div className="max-w-6xl w-full mx-auto flex flex-col gap-6">
            
            {/* Dynamic Personnel Selection Tool */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
              <div className="flex items-center gap-2">
                <User size={16} className="text-slate-500" />
                <span className="font-extrabold text-xs text-[#0a1f3d] uppercase tracking-wider">
                  Pilih Personel Militer:
                </span>
              </div>
              <select 
                value={selectedNrp}
                onChange={handleSelectNrp}
                className="w-full sm:w-80 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              >
                {dossiers.map(d => (
                  <option key={d.nrpNip} value={d.nrpNip}>
                    {d.pangkat} {d.namaLengkap} - {d.nrpNip}
                  </option>
                ))}
              </select>
            </div>

            {/* Dossier Profil Card (Full Width) */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row gap-6 items-center md:items-start select-none">
              <MilitaryAvatar src={currentDossier?.fotoPersonel} />
              
              <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                  <h2 className="font-extrabold text-[#0a1f3d] text-base tracking-tight uppercase">
                    Data Rincian Perkara Personel
                  </h2>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[9px] uppercase tracking-widest rounded-full border border-blue-100">
                    {currentDossier.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 text-xs mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Nama Personel</span>
                    <span className="font-extrabold text-slate-800 tracking-wide uppercase truncate block">{currentDossier.namaLengkap}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">NRP / NIP</span>
                    <span className="font-bold text-slate-700 font-mono block">{currentDossier.nrpNip}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Pangkat</span>
                    <span className="font-semibold text-slate-700 block">{currentDossier.pangkat}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Jabatan / Perorangan</span>
                    <span className="font-semibold text-slate-700 block">{currentDossier.jabatan}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Dossier Table section */}
            <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 print-target-perorangan">
              
              {/* Print-Only Header Block matching Table 1 */}
              <div className="hidden print:block text-left mb-6">
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                  REKAP DATA PERKARA {currentDossier.satuan ? currentDossier.satuan.toUpperCase() : 'KUMDAM XVII/CENDERAWASIH'}
                </h1>
                <div className="mt-3">
                  <h2 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                    2. DATA RINCIAN PERKARA/PERSONEL ( {(currentDossier.namaLengkap || '').toUpperCase()} / {currentDossier.nrpNip} / {(currentDossier.pangkat || '').toUpperCase()} / {(currentDossier.jabatan || '').toUpperCase()} )/PERORANGAN
                  </h2>
                </div>
                <div className="h-[2px] bg-slate-800 mt-4"></div>
              </div>

              {/* Table Header and filter select */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4 select-none print:hidden">
                <div className="flex items-center gap-3">
                  <select 
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="">Semua Tahapan</option>
                    <option value="Persidangan">Persidangan</option>
                    <option value="Selesai">Selesai</option>
                  </select>

                  {canPrintDossier && (
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

                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  Menampilkan {filteredCases.length} dari {currentDossier.cases.length} perkara
                </span>
              </div>

              {/* Dossier Table */}
              <div className="overflow-hidden border border-slate-200/60 rounded-xl mb-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60 select-none">
                      <th className="py-3 px-6 w-[20%]">PERKARA</th>
                      <th className="py-3 px-4 w-[50%]">KRONOLOGIS SINGKAT</th>
                      <th className="py-3 px-4 text-left w-[15%]">TAHAPAN</th>
                      <th className="py-3 px-6 text-center w-[15%]">PUTUSAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCases.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/20 transition">
                        
                        {/* Perkara Info Column */}
                        <td className="py-4 px-6 valign-top">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-bold text-slate-800">{item.perkara}</span>
                            <span className="text-[9px] font-mono text-slate-400 font-bold block">{item.nomor}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 bg-red-50 text-red-600 font-bold text-[8px] uppercase tracking-wider rounded border border-red-100/50 self-start">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Kronologis Column */}
                        <td className="py-4 px-4 text-slate-500 leading-relaxed font-medium">
                          <div>{item.kronologis}</div>
                          {item.fileUrl && (
                            <button
                              onClick={() => downloadFile(item.fileUrl, item.fileName || 'dokumen_kronologis.pdf')}
                              className="mt-2 px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded text-[9px] font-extrabold transition-colors flex items-center gap-1 shadow-sm active:scale-[0.98] print:hidden"
                              title="Unduh Berkas Kronologis"
                            >
                              📄 Berkas Kronologis
                            </button>
                          )}
                        </td>

                        {/* Tahapan Column */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 select-none">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              (item.tahapan || '').toLowerCase().includes('selesai') || (item.tahapan || '').toLowerCase().includes('putusan')
                                ? 'bg-emerald-500'
                                : (item.tahapan || '').toLowerCase().includes('banding') || (item.tahapan || '').toLowerCase().includes('kasasi') || (item.tahapan || '').toLowerCase().includes('peninjauan')
                                  ? 'bg-amber-500'
                                  : (item.tahapan || '').toLowerCase().includes('sidang') || (item.tahapan || '').toLowerCase().includes('penuntutan')
                                    ? 'bg-blue-500'
                                    : 'bg-slate-400'
                            }`}></span>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700">{item.tahapan}</span>
                              {item.detailTahapan && item.detailTahapan !== item.tahapan && (
                                <span className="text-[9px] text-slate-400 font-bold mt-0.5">{item.detailTahapan}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Putusan Column */}
                        <td className="py-4 px-6">
                          {renderPutusanCell(item)}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table pagination (Static simulation) */}
              <div className="flex items-center justify-between text-xs select-none">
                <button className="font-bold text-slate-300 cursor-not-allowed uppercase tracking-wider flex items-center gap-1">
                  &lt; SEBELUMNYA
                </button>
                <div className="flex gap-2">
                  <span className="w-6 h-6 rounded bg-[#0a1f3d] text-white font-bold flex items-center justify-center">1</span>
                </div>
                <button className="font-bold text-slate-300 cursor-not-allowed uppercase tracking-wider flex items-center gap-1">
                  BERIKUTNYA &gt;
                </button>
              </div>

            </section>



          </div>

          {/* FOOTER */}
          <footer className="mt-8 pt-6 border-t border-slate-200 py-6 select-none">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-bold tracking-wider uppercase">
              <div>
                &copy; 2026 Sistem Informasi Data Perkara KUMDAM XVII/Cenderawasih. Hak Cipta Dilindungi.
              </div>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-slate-600 transition-colors">Kebijakan Privasi</a>
                <span>|</span>
                <a href="#" className="hover:text-slate-600 transition-colors">Syarat &amp; Ketentuan</a>
                <span>|</span>
                <a href="#" className="hover:text-slate-600 transition-colors">Kontak Teknis</a>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* VERDICT MODAL */}
      {verdictDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">Surat Dokumen Putusan</span>
              <button 
                onClick={() => setVerdictDoc(null)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 font-mono text-[10px] leading-relaxed text-slate-600 max-h-[350px] overflow-y-auto whitespace-pre-wrap select-text">
                {verdictDoc.dokumenPutusan}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setVerdictDoc(null)}
                className="px-5 py-1.5 bg-[#0a1f3d] hover:bg-[#122e54] text-white text-[10px] font-bold rounded-lg transition"
              >
                TUTUP
              </button>
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
