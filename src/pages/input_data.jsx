import React, { useState, useRef, useEffect } from 'react';
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
  ChevronLeft,
  Sparkles,
  Menu,
  X,
  User
} from 'lucide-react';
import { db, storage } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import logoKumdam from '../assets/images/logo_kumdam.jpeg';

// Beautiful custom SVG badge for KUMDAM XVII / CENDERAWASIH
const KumdamLogo = () => (
  <img src={logoKumdam} alt="Logo Kumdam XVII Cenderawasih" className="w-10 h-10 object-cover rounded-lg flex-shrink-0 drop-shadow-md border border-black" />
);

const KESATUAN_OPTIONS = [
  { id: 'POMDAM', nama: 'POMDAM XVII/CENDERAWASIH', key: '123', icon: '🏛️' },
  { id: 'ZIDAM', nama: 'ZIDAM XVII/CENDERAWASIH', key: '123', icon: '⚙️' },
  { id: 'KOMLEKDAM', nama: 'KOMLEKDAM XVII/CENDERAWASIH', key: '123', icon: '📡' },
  { id: 'RINDAM', nama: 'RINDAM XVII/CENDERAWASIH', key: '123', icon: '🪖' }
];

const JENIS_PERKARA_OPTIONS = [
  'PIDANA UMUM',
  'PIDANA MILITER',
  'PERDATA'
];

const KATEGORI_PELANGGARAN_OPTIONS = [
  { label: 'PEMBUNUHAN', value: 'PEMBUNUHAN' },
  { label: 'ASUSILA', value: 'ASUSILA' },
  { label: 'SENJATA API', value: 'SENJATA API' },
  { label: 'NARKOBA', value: 'NARKOBA' },
  { label: 'DISERSI', value: 'DISERSI' },
  { label: 'THTI', value: 'THTI' },
  { label: 'INSUBORDINASI', value: 'INSUBORDINASI' },
  { label: 'PERAMPOKAN', value: 'PERAMPOKAN' },
  { label: 'PENCURIAN', value: 'PENCURIAN' },
  { label: 'WERPING', value: 'WERPING' },
  { label: 'PENGGUGAT', value: 'PENGGUGAT' },
  { label: 'TERGUGAT', value: 'TERGUGAT' },
  { label: 'PENGANIAYAAN', value: 'PENGANIAYAAN' },
  { label: 'PERLINDUNGAN ANAK', value: 'PERLINDUNGAN ANAK' }
];

const TAHAP_PENYELESAIAN_OPTIONS = [
  'ANKUM',
  'PENYIDIKAN',
  'PELIMPAHAN/OTMIL',
  'DILMIL',
  'PENGADILAN NEGERI',
  'PENGADILAN AGAMA',
  'TATA USAHA NEGARA',
  'BANDING',
  'KASASI',
  'PENINJAUAN KEMBALI'
];

// Helper to convert Base64/DataURL to Blob
const dataURLtoBlob = (dataurl) => {
  if (!dataurl || typeof dataurl !== 'string' || !dataurl.startsWith('data:')) return null;
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Failed to convert data URL to blob:", e);
    return null;
  }
};

// Helper to upload a File or Base64 string to Firebase Storage and get its download URL
const uploadFileOrBase64 = async (fileOrBase64, fileName, folderName, caseNo) => {
  if (!fileOrBase64) return null;
  let fileBlob = null;
  let name = fileName || 'document.pdf';
  
  if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
    fileBlob = fileOrBase64;
    name = fileOrBase64.name || name;
  } else if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
    fileBlob = dataURLtoBlob(fileOrBase64);
  } else {
    // If it is already a URL, return it directly
    if (typeof fileOrBase64 === 'string' && (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://'))) {
      return fileOrBase64;
    }
    return null;
  }
  
  if (!fileBlob) return null;
  
  const sanitizedCaseNo = caseNo.replace(/[^a-zA-Z0-9]/g, '_');
  const storageRef = ref(storage, `${folderName}/${sanitizedCaseNo}_${name}`);
  const snapshot = await uploadBytes(storageRef, fileBlob);
  return await getDownloadURL(snapshot.ref);
};

export default function InputData() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Selection and Verification states
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
  
  const [accessKey, setAccessKey] = useState('');
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = sessionStorage.getItem('temp_current_step');
    return savedStep ? parseInt(savedStep, 10) : 1;
  });
  
  const [isVerified, setIsVerified] = useState(() => {
    return sessionStorage.getItem('is_kesatuan_verified') === 'true';
  });

  // Form Fields States
  const [formData, setFormData] = useState(() => {
    const savedForm = sessionStorage.getItem('temp_form_data');
    if (savedForm) {
      try {
        return JSON.parse(savedForm);
      } catch (e) {
        console.error("Failed to parse temp_form_data:", e);
      }
    }
    return {
      noPerkara: '',
      jenisPerkara: 'PIDANA UMUM',
      namaLengkap: '',
      nrpNip: '',
      pangkat: '',
      jabatan: '',
      kategoriPelanggaran: '',
      pasal: '',
      kronologis: '',
      tahapPenyelesaian: '',
      fotoPersonel: null,
      pidanaPokok: '',
      pidanaTambahan: '',
      noSalinanPutusan: '',
      noPetikanPutusan: '',
      noAkteBht: '',
      salinanPutusan: null,
      salinanPutusanName: '',
      petikanPutusan: null,
      petikanPutusanName: '',
      akteBht: null,
      akteBhtName: ''
    };
  });
  
  const [uploadedFile, setUploadedFile] = useState(() => {
    const savedFile = sessionStorage.getItem('temp_uploaded_file');
    if (savedFile) {
      try {
        const parsed = JSON.parse(savedFile);
        if (parsed) {
          return {
            name: parsed.name,
            size: parsed.size,
            type: parsed.type,
            persisted: true
          };
        }
      } catch (e) {
        console.error("Failed to parse temp_uploaded_file:", e);
      }
    }
    return null;
  });

  // Auto-persist whenever state changes
  useEffect(() => {
    try {
      sessionStorage.setItem('temp_form_data', JSON.stringify(formData));
    } catch (e) {
      console.warn("Storage quota exceeded. Form data might not be persistent.", e);
    }
  }, [formData]);

  useEffect(() => {
    if (uploadedFile) {
      sessionStorage.setItem('temp_uploaded_file', JSON.stringify({
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type
      }));
    } else {
      sessionStorage.removeItem('temp_uploaded_file');
    }
  }, [uploadedFile]);

  useEffect(() => {
    sessionStorage.setItem('temp_current_step', currentStep.toString());
  }, [currentStep]);

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
    
    // We match the key defined in the KESATUAN_OPTIONS
    if (accessKey === selectedKesatuan.key || accessKey === '123') {
      setIsVerified(true);
      sessionStorage.setItem('is_kesatuan_verified', 'true');
      sessionStorage.setItem('selected_kesatuan', JSON.stringify(selectedKesatuan));
      showToast(`Akses Terverifikasi untuk ${selectedKesatuan.nama}!`, 'success');
    } else {
      setIsVerified(false);
      sessionStorage.setItem('is_kesatuan_verified', 'false');
      showToast('Kunci akses salah! Gunakan kunci: 123', 'error');
    }
  };

  // Handle Kesatuan Card Selection
  const handleSelectKesatuan = (kesatuan) => {
    setSelectedKesatuan(kesatuan);
    setIsVerified(false); // Reset verification when switching units
    setAccessKey('');
    sessionStorage.setItem('selected_kesatuan', JSON.stringify(kesatuan));
    sessionStorage.setItem('is_kesatuan_verified', 'false');
  };

  const handleNextStep = () => {
    if (!isVerified) {
      showToast('Harap verifikasi kunci akses kesatuan terlebih dahulu!', 'error');
      return;
    }
    if (!formData.jenisPerkara) {
      showToast('Harap pilih Jenis Perkara!', 'error');
      return;
    }
    if (!formData.namaLengkap) {
      showToast('Harap isi Nama Lengkap!', 'error');
      return;
    }
    if (!formData.nrpNip) {
      showToast('Harap isi NRP / NIP!', 'error');
      return;
    }
    setCurrentStep(2);
  };

  // Form field change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePdfChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        showToast('Hanya berkas PDF yang diperbolehkan!', 'error');
        e.target.value = '';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran berkas melebihi batas maksimal 2MB!', 'error');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [fieldName]: reader.result,
          [fieldName + 'Name']: file.name
        }));
        showToast(`Berkas "${file.name}" berhasil terpilih.`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Ukuran foto melebihi batas maksimal 2MB!', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          fotoPersonel: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
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
      
      const reader = new FileReader();
      reader.onloadend = () => {
        sessionStorage.setItem('temp_uploaded_file_base64', reader.result);
      };
      reader.readAsDataURL(file);
      
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

    if (!formData.jenisPerkara || !formData.namaLengkap || !formData.nrpNip || !formData.kategoriPelanggaran || !formData.tahapPenyelesaian || !formData.pasal) {
      showToast('Harap lengkapi semua kolom wajib formulir!', 'error');
      return;
    }

    setIsSubmitting(true);
    showToast('Sedang memproses data & mengunggah berkas...', 'info');

    // Generate a case number if the user did not provide one
    const generatedNoPerkara = formData.noPerkara 
      ? formData.noPerkara.toUpperCase() 
      : `P-${Math.floor(Math.random() * 200 + 10)}/MIL/${new Date().getFullYear()}`;

    try {
      // 1. Upload files to Firebase Storage
      let uploadedFileUrl = null;
      let fotoPersonelUrl = null;
      let salinanPutusanUrl = null;
      let petikanPutusanUrl = null;
      let akteBhtUrl = null;

      // Chronological Doc
      const base64FromSession = sessionStorage.getItem('temp_uploaded_file_base64');
      if (uploadedFile || base64FromSession) {
        uploadedFileUrl = await uploadFileOrBase64(
          uploadedFile || base64FromSession, 
          uploadedFile?.name || formData.fileName || 'dokumen_kronologis.pdf', 
          'dokumen_kronologis', 
          generatedNoPerkara
        );
      }

      // Personnel Photo
      if (formData.fotoPersonel) {
        fotoPersonelUrl = await uploadFileOrBase64(
          formData.fotoPersonel, 
          'foto_personel.jpg', 
          'foto_personel', 
          generatedNoPerkara
        );
      }

      // Salinan Putusan
      if (formData.salinanPutusan) {
        salinanPutusanUrl = await uploadFileOrBase64(
          formData.salinanPutusan, 
          formData.salinanPutusanName || 'salinan_putusan.pdf', 
          'salinan_putusan', 
          generatedNoPerkara
        );
      }

      // Petikan Putusan
      if (formData.petikanPutusan) {
        petikanPutusanUrl = await uploadFileOrBase64(
          formData.petikanPutusan, 
          formData.petikanPutusanName || 'petikan_putusan.pdf', 
          'petikan_putusan', 
          generatedNoPerkara
        );
      }

      // Akte BHT
      if (formData.akteBht) {
        akteBhtUrl = await uploadFileOrBase64(
          formData.akteBht, 
          formData.akteBhtName || 'akte_bht.pdf', 
          'akte_bht', 
          generatedNoPerkara
        );
      }

      // Map status based on whether a judgment was entered or the resolution step is final
      const mappedStatus = (formData.pidanaPokok || formData.tahapPenyelesaian === 'PENINJAUAN KEMBALI') ? 'SELESAI' : 'PROSES';

      const newCase = {
        noPerkara: generatedNoPerkara,
        satuan: selectedKesatuan.nama,
        jenisPerkara: formData.jenisPerkara,
        namaLengkap: formData.namaLengkap,
        nrpNip: formData.nrpNip,
        pangkat: formData.pangkat,
        jabatan: formData.jabatan,
        kategoriPelanggaran: formData.kategoriPelanggaran,
        pasal: formData.pasal || '',
        kronologis: formData.kronologis,
        tahapPenyelesaian: formData.tahapPenyelesaian,
        status: mappedStatus,
        tanggal: new Date().toISOString().split('T')[0],
        fileName: uploadedFile ? uploadedFile.name : (formData.fileName || null),
        fileUrl: uploadedFileUrl,
        fotoPersonel: fotoPersonelUrl,
        pidanaPokok: formData.pidanaPokok || '',
        pidanaTambahan: formData.pidanaTambahan || '',
        noSalinanPutusan: formData.noSalinanPutusan || '',
        noPetikanPutusan: formData.noPetikanPutusan || '',
        noAkteBht: formData.noAkteBht || '',
        salinanPutusan: salinanPutusanUrl,
        salinanPutusanName: formData.salinanPutusanName || '',
        petikanPutusan: petikanPutusanUrl,
        petikanPutusanName: formData.petikanPutusanName || '',
        akteBht: akteBhtUrl,
        akteBhtName: formData.akteBhtName || ''
      };

      // Always write to LocalStorage to keep client data in sync instantly
      const localData = localStorage.getItem('perkara_data');
      let currentList = localData ? JSON.parse(localData) : [];
      const createdCase = { id: Date.now().toString(), isOfflineCreated: true, ...newCase };
      currentList = [createdCase, ...currentList];
      localStorage.setItem('perkara_data', JSON.stringify(currentList));

      // Try writing to Firestore
      await addDoc(collection(db, 'perkara'), newCase);

      // Clear session storage history on successful submission
      sessionStorage.removeItem('temp_form_data');
      sessionStorage.removeItem('temp_uploaded_file');
      sessionStorage.removeItem('temp_uploaded_file_base64');
      sessionStorage.removeItem('temp_current_step');

      // Native JavaScript Popup alert
      window.alert("Data berhasil disimpan");
      navigate('/');
    } catch (error) {
      console.error("Error during submission: ", error);
      showToast('Gagal menyimpan data ke Firebase!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        {/* Right side Profile */}
        {isVerified && selectedKesatuan && (
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

        {/* 2. SIDEBAR (Identical to halaman_isi.jsx) */}
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
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 border-l-4 border-blue-600 transition-all"
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
            
            {/* Title Section with vertical bar */}
            <div className="flex items-center gap-3 border-l-4 border-[#0a1f3d] pl-4 mb-6 select-none">
              <h2 className="text-sm font-extrabold text-[#0a1f3d] uppercase tracking-wider">
                Pilihan Kesatuan Untuk Pengisian Data
              </h2>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 select-none">
              {KESATUAN_OPTIONS.map((item) => {
                const isSelected = selectedKesatuan.id === item.id;
                const isDisabled = isVerified && !isSelected;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isVerified) {
                        showToast('Silakan logout terlebih dahulu untuk mengganti kesatuan!', 'warning');
                        return;
                      }
                      handleSelectKesatuan(item);
                    }}
                    className={`p-5 rounded-xl border relative overflow-hidden transition-all duration-200 flex flex-col justify-between h-28 group ${
                      isSelected 
                        ? 'bg-[#0f2444] text-white border-blue-500 shadow-md ring-2 ring-amber-500/80 scale-[1.01] cursor-default' 
                        : isDisabled
                          ? 'bg-[#0a1f3d]/50 text-slate-500 border-slate-800 opacity-40 cursor-not-allowed'
                          : 'bg-[#0a1f3d] text-slate-300 border-slate-700 hover:bg-[#112d54] hover:text-white cursor-pointer'
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
                    {selectedKesatuan.id} Perlu Kunci Akses (Kunci: 123)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type={isVerified ? "text" : "password"}
                  value={isVerified ? "sedang digunakan" : accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  disabled={isVerified}
                  placeholder={isVerified ? "TERVERIFIKASI" : "KUNCI AKSES"}
                  className={`border rounded-lg px-3 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-44 transition-all ${
                    isVerified 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 font-bold' 
                      : 'border-slate-200 bg-slate-50 text-slate-700 font-mono tracking-widest'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleVerify();
                  }}
                />
                
                {!isVerified && (
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
                    Silakan masukkan kunci akses (**123**) untuk kesatuan **{selectedKesatuan.id}** di panel atas untuk membuka dan mengisi data perkara.
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

                {/* Stepper Progress */}
                <div className="flex items-center justify-center gap-4 mb-8 select-none border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                      currentStep === 1 
                        ? 'bg-[#0a1f3d] text-white ring-4 ring-[#0a1f3d]/10' 
                        : 'bg-emerald-500 text-white'
                    }`}>
                      {currentStep > 1 ? '✓' : '1'}
                    </div>
                    <span className={`text-[10px] font-extrabold tracking-wider ${currentStep === 1 ? 'text-[#0a1f3d]' : 'text-slate-400'}`}>
                      IDENTITAS & JENIS PERKARA
                    </span>
                  </div>
                  
                  <div className="w-8 h-0.5 bg-slate-200 rounded"></div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                      currentStep === 2 
                        ? 'bg-[#0a1f3d] text-white ring-4 ring-[#0a1f3d]/10' 
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      2
                    </div>
                    <span className={`text-[10px] font-extrabold tracking-wider ${currentStep === 2 ? 'text-[#0a1f3d]' : 'text-slate-400'}`}>
                      DETAIL & DOKUMEN PERKARA
                    </span>
                  </div>
                </div>

                {currentStep === 1 ? (
                  /* ========================================================
                     LANGKAH 1: IDENTITAS & JENIS PERKARA
                     ======================================================== */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-200">
                    
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

                      {/* Jenis Perkara (PIDANA UMUM, PIDANA MILITER, PERDATA) */}
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
                          {JENIS_PERKARA_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="flex flex-col gap-5">
                      
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

                        {/* Foto Personel */}
                        <div>
                          <label htmlFor="fotoPersonel" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 select-none">
                            Foto Personel
                          </label>
                          <input
                            type="file"
                            id="fotoPersonel"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                          />
                          {formData.fotoPersonel && (
                            <div className="mt-2 flex items-center gap-2">
                              <img src={formData.fotoPersonel} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                              <span className="text-[9px] text-emerald-600 font-bold">✓ Foto terpilih</span>
                              <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, fotoPersonel: null }))}
                                className="text-[9px] text-red-500 hover:underline ml-auto font-bold"
                              >
                                Hapus
                              </button>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Next Button */}
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="w-full py-3 mt-4 bg-[#0a1f3d] hover:bg-[#122e54] text-white rounded-lg flex items-center justify-center gap-2 font-bold text-xs tracking-wider transition-all duration-150 active:scale-[0.98] shadow-md shadow-blue-900/10"
                      >
                        <span>SELANJUTNYA</span>
                        <ChevronRight size={16} className="text-amber-500" />
                      </button>

                    </div>

                  </div>
                ) : (
                  /* ========================================================
                     LANGKAH 2: DETAIL & DOKUMEN PERKARA
                     ======================================================== */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-200">
                    
                    {/* LEFT COLUMN */}
                    <div className="flex flex-col gap-5">
                      
                      {/* Perkara Dropdown (Sub-categories) */}
                      <div>
                        <label htmlFor="kategoriPelanggaran" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                          Perkara <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="kategoriPelanggaran"
                          name="kategoriPelanggaran"
                          value={formData.kategoriPelanggaran}
                          onChange={handleInputChange}
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          required
                        >
                          <option value="">PILIHAN PERKARA</option>
                          {KATEGORI_PELANGGARAN_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Pasal */}
                      <div>
                        <label htmlFor="pasal" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                          Pasal <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="pasal"
                          name="pasal"
                          value={formData.pasal || ''}
                          onChange={handleInputChange}
                          placeholder="Masukkan pasal perkara (contoh: Pasal 338 KUHP)"
                          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          required
                        />
                      </div>

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
                          className="w-full h-32 border border-slate-200 rounded-lg p-4 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-medium leading-relaxed"
                        />
                      </div>

                      {/* Upload Dokumen Pendukung */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                          Dokumen Kronologis
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
                            UPLOAD DATA
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="flex flex-col gap-5">
                      
                      {/* Dokumen Putusan (PDF) */}
                      <div className="border border-slate-100 bg-[#f8fafc]/60 rounded-xl p-4 flex flex-col gap-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 block select-none">
                          Dokumen Putusan (Format PDF)
                        </span>
                        
                        {/* Salinan Putusan */}
                        <div className="border-b border-slate-100 pb-3">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 select-none">
                            Salinan Putusan
                          </label>
                          <input
                            type="text"
                            name="noSalinanPutusan"
                            value={formData.noSalinanPutusan}
                            onChange={handleInputChange}
                            placeholder="Masukkan nomor salinan putusan"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold mb-2"
                          />
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handlePdfChange(e, 'salinanPutusan')}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                          />
                          {formData.salinanPutusanName && (
                            <span className="text-[9px] text-emerald-600 font-bold block mt-1">✓ {formData.salinanPutusanName}</span>
                          )}
                        </div>

                        {/* Petikan Putusan */}
                        <div className="border-b border-slate-100 pb-3">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 select-none">
                            Petikan Putusan
                          </label>
                          <input
                            type="text"
                            name="noPetikanPutusan"
                            value={formData.noPetikanPutusan}
                            onChange={handleInputChange}
                            placeholder="Masukkan nomor petikan putusan"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold mb-2"
                          />
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handlePdfChange(e, 'petikanPutusan')}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                          />
                          {formData.petikanPutusanName && (
                            <span className="text-[9px] text-emerald-600 font-bold block mt-1">✓ {formData.petikanPutusanName}</span>
                          )}
                        </div>

                        {/* Akte BHT */}
                        <div className="pb-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 select-none">
                            Akte BHT
                          </label>
                          <input
                            type="text"
                            name="noAkteBht"
                            value={formData.noAkteBht}
                            onChange={handleInputChange}
                            placeholder="Masukkan nomor akte BHT"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold mb-2"
                          />
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => handlePdfChange(e, 'akteBht')}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                          />
                          {formData.akteBhtName && (
                            <span className="text-[9px] text-emerald-600 font-bold block mt-1">✓ {formData.akteBhtName}</span>
                          )}
                        </div>
                      </div>

                      {/* Kotak Putusan */}
                      <div className="border border-slate-100 bg-[#f8fafc]/60 rounded-xl p-4 flex flex-col gap-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 block select-none">
                          Kotak Putusan
                        </span>

                        {/* Pidana Pokok */}
                        <div>
                          <label htmlFor="pidanaPokok" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 select-none">
                            Pidana Pokok
                          </label>
                          <input
                            type="text"
                            id="pidanaPokok"
                            name="pidanaPokok"
                            value={formData.pidanaPokok}
                            onChange={handleInputChange}
                            placeholder="Contoh: Pidana Penjara 5 Bulan"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                          />
                        </div>

                        {/* Pidana Tambahan */}
                        <div>
                          <label htmlFor="pidanaTambahan" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 select-none">
                            Pidana Tambahan
                          </label>
                          <input
                            type="text"
                            id="pidanaTambahan"
                            name="pidanaTambahan"
                            value={formData.pidanaTambahan}
                            onChange={handleInputChange}
                            placeholder="Contoh: Dipecat dari Dinas Militer"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold"
                          />
                        </div>
                      </div>

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

                      {/* Step 2 Actions */}
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center gap-2 font-bold text-xs tracking-wider transition-all duration-150 active:scale-[0.98] border border-slate-200"
                        >
                          <ChevronLeft size={16} />
                          <span>KEMBALI</span>
                        </button>
                        
                         <button
                          type="submit"
                          disabled={isSubmitting}
                          className="py-3 bg-[#0a1f3d] hover:bg-[#122e54] text-white rounded-lg flex items-center justify-center gap-2 font-bold text-xs tracking-wider transition-all duration-150 active:scale-[0.98] shadow-md shadow-blue-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>MENYIMPAN...</span>
                            </>
                          ) : (
                            <>
                              <Save size={16} className="text-amber-500" />
                              <span>SIMPAN DATA</span>
                            </>
                          )}
                        </button>
                      </div>

                    </div>

                  </div>
                )}
              </div>

            </form>

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
