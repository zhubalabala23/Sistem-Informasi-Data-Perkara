import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  HelpCircle, 
  LogOut, 
  CheckCircle2, 
  UploadCloud, 
  Save, 
  ChevronLeft, 
  X, 
  Menu, 
  User,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import logoKumdam from '../assets/images/logo_kumdam.jpeg';

const KumdamLogo = () => (
  <img src={logoKumdam} alt="Logo Kumdam XVII Cenderawasih" className="w-10 h-10 object-cover rounded-lg flex-shrink-0 drop-shadow-md border border-black" />
);

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

// Helper to upload a File or Base64 string to Cloudinary and get its secure URL
const uploadFileOrBase64 = async (fileOrBase64, fileName, folderName, caseNo) => {
  if (!fileOrBase64) return null;

  // If it is already a URL, return it directly
  if (typeof fileOrBase64 === 'string' && (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://'))) {
    return fileOrBase64;
  }

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Konfigurasi Cloudinary belum disetup. Mohon tambahkan VITE_CLOUDINARY_CLOUD_NAME dan VITE_CLOUDINARY_UPLOAD_PRESET di file .env.');
  }

  try {
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
    const formData = new FormData();
    
    formData.append('file', fileOrBase64);
    formData.append('upload_preset', uploadPreset);
    formData.append('resource_type', 'auto');
    
    const sanitizedCaseNo = caseNo ? caseNo.replace(/[^a-zA-Z0-9]/g, '_') : 'perkara';
    formData.append('folder', `kumdam_perkara/${folderName}/${sanitizedCaseNo}`);
    
    if (fileName) {
      const publicId = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      const sanitizedPublicId = publicId.replace(/[^a-zA-Z0-9_-]/g, '_');
      formData.append('public_id', sanitizedPublicId);
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(errorResponse.error?.message || 'Gagal mengunggah berkas ke Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Upload gagal: ${error.message}`);
  }
};

export default function EditData() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get active session credentials
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

  // Form states
  const [formData, setFormData] = useState({
    noPerkara: '',
    satuan: '',
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
    fotoPersonelName: '',
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
    akteBhtName: '',
    fileUrl: null,
    fileName: ''
  });

  const [newUploadedFile, setNewUploadedFile] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Helper check authorization
  const canEditCase = (caseSatuan) => {
    if (!isKesatuanVerified || !loggedInKesatuan) {
      return false;
    }
    const clean = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/e/g, '');
    const cleanUserUnit = clean(loggedInKesatuan.nama);
    const cleanCaseUnit = clean(caseSatuan);
    return cleanUserUnit === cleanCaseUnit || cleanCaseUnit.includes(clean(loggedInKesatuan.id)) || cleanUserUnit.includes(cleanCaseUnit);
  };

  // Load existing case data
  useEffect(() => {
    if (!isKesatuanVerified || !loggedInKesatuan) {
      window.alert("Akses ditolak! Silakan verifikasi Kesatuan Anda terlebih dahulu.");
      navigate('/rekap-perkara');
      return;
    }

    const loadCase = async () => {
      try {
        setLoading(true);
        let caseData = null;

        // Try load from Firestore first
        try {
          const docRef = doc(db, 'perkara', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            caseData = { id: docSnap.id, ...docSnap.data() };
          }
        } catch (e) {
          console.warn("Firestore fetch failed, checking LocalStorage...", e);
        }

        // If not in Firestore or offline, search in LocalStorage
        if (!caseData) {
          const localData = localStorage.getItem('perkara_data');
          if (localData) {
            const list = JSON.parse(localData);
            caseData = list.find(item => item.id === id || item.noPerkara === id);
          }
        }

        if (!caseData) {
          window.alert("Data perkara tidak ditemukan!");
          navigate('/rekap-perkara');
          return;
        }

        // Role restriction check
        if (!canEditCase(caseData.satuan)) {
          window.alert(`Akses ditolak! Perkara milik kesatuan "${caseData.satuan}" tidak boleh diedit oleh kesatuan "${loggedInKesatuan.nama}".`);
          navigate('/rekap-perkara');
          return;
        }

        // Set Form State
        setFormData({
          noPerkara: caseData.noPerkara || '',
          satuan: caseData.satuan || '',
          jenisPerkara: caseData.jenisPerkara || 'PIDANA UMUM',
          namaLengkap: caseData.namaLengkap || '',
          nrpNip: caseData.nrpNip || '',
          pangkat: caseData.pangkat || '',
          jabatan: caseData.jabatan || '',
          kategoriPelanggaran: caseData.kategoriPelanggaran || '',
          pasal: caseData.pasal || '',
          kronologis: caseData.kronologis || '',
          tahapPenyelesaian: caseData.tahapPenyelesaian || '',
          fotoPersonel: caseData.fotoPersonel || null,
          fotoPersonelName: caseData.fotoPersonel ? 'foto_personel' : '',
          pidanaPokok: caseData.pidanaPokok || '',
          pidanaTambahan: caseData.pidanaTambahan || '',
          noSalinanPutusan: caseData.noSalinanPutusan || '',
          noPetikanPutusan: caseData.noPetikanPutusan || '',
          noAkteBht: caseData.noAkteBht || '',
          salinanPutusan: caseData.salinanPutusan || null,
          salinanPutusanName: caseData.salinanPutusanName || (caseData.salinanPutusan ? 'salinan_putusan.pdf' : ''),
          petikanPutusan: caseData.petikanPutusan || null,
          petikanPutusanName: caseData.petikanPutusanName || (caseData.petikanPutusan ? 'petikan_putusan.pdf' : ''),
          akteBht: caseData.akteBht || null,
          akteBhtName: caseData.akteBhtName || (caseData.akteBht ? 'akte_bht.pdf' : ''),
          fileUrl: caseData.fileUrl || null,
          fileName: caseData.fileName || ''
        });

      } catch (err) {
        console.error(err);
        showToast("Gagal memuat data perkara", "error");
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          fotoPersonel: reader.result,
          fotoPersonelName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('Ukuran berkas melebihi batas maksimal 10MB!', 'error');
        return;
      }
      setNewUploadedFile(file);
      setFormData(prev => ({ ...prev, fileName: file.name }));
    }
  };

  const handlePdfChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [field]: reader.result,
          [`${field}Name`]: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.jenisPerkara || !formData.namaLengkap || !formData.nrpNip || !formData.kategoriPelanggaran || !formData.tahapPenyelesaian || !formData.pasal) {
      showToast('Harap lengkapi semua kolom wajib formulir!', 'error');
      return;
    }

    // Secondary security check before submitting
    if (!canEditCase(formData.satuan)) {
      window.alert("Akses ditolak! Anda tidak diizinkan menyimpan perubahan data perkara kesatuan lain.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload files if modified
      let uploadedFileUrl = formData.fileUrl;
      if (newUploadedFile) {
        uploadedFileUrl = await uploadFileOrBase64(newUploadedFile, newUploadedFile.name, 'kronologis', formData.noPerkara);
      }

      let fotoPersonelUrl = formData.fotoPersonel;
      if (formData.fotoPersonel && formData.fotoPersonel.startsWith('data:')) {
        fotoPersonelUrl = await uploadFileOrBase64(formData.fotoPersonel, formData.fotoPersonelName || 'avatar.jpg', 'avatar', formData.noPerkara);
      }

      let salinanPutusanUrl = formData.salinanPutusan;
      if (formData.salinanPutusan && formData.salinanPutusan.startsWith('data:')) {
        salinanPutusanUrl = await uploadFileOrBase64(formData.salinanPutusan, formData.salinanPutusanName, 'salinan_putusan', formData.noPerkara);
      }

      let petikanPutusanUrl = formData.petikanPutusan;
      if (formData.petikanPutusan && formData.petikanPutusan.startsWith('data:')) {
        petikanPutusanUrl = await uploadFileOrBase64(formData.petikanPutusan, formData.petikanPutusanName, 'petikan_putusan', formData.noPerkara);
      }

      let akteBhtUrl = formData.akteBht;
      if (formData.akteBht && formData.akteBht.startsWith('data:')) {
        akteBhtUrl = await uploadFileOrBase64(formData.akteBht, formData.akteBhtName, 'akte_bht', formData.noPerkara);
      }

      // Map status
      const mappedStatus = (formData.pidanaPokok || formData.tahapPenyelesaian === 'PENINJAUAN KEMBALI') ? 'SELESAI' : 'PROSES';

      const updatedCase = {
        noPerkara: formData.noPerkara,
        satuan: formData.satuan,
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
        fileName: formData.fileName || null,
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

      // 1. Update Firestore
      try {
        const docRef = doc(db, 'perkara', id);
        await updateDoc(docRef, updatedCase);
      } catch (firestoreError) {
        console.warn("Could not write to Firestore, updating local fallback...", firestoreError);
      }

      // 2. Update LocalStorage
      const localData = localStorage.getItem('perkara_data');
      if (localData) {
        let list = JSON.parse(localData);
        const index = list.findIndex(item => item.id === id || item.noPerkara === id);
        if (index !== -1) {
          list[index] = { ...list[index], ...updatedCase };
          localStorage.setItem('perkara_data', JSON.stringify(list));
        } else {
          // If not present in local list, insert it
          list = [{ id, ...updatedCase }, ...list];
          localStorage.setItem('perkara_data', JSON.stringify(list));
        }
      }

      window.alert("Perubahan data perkara berhasil disimpan!");
      navigate('/rekap-perkara');
    } catch (err) {
      console.error(err);
      showToast(err.message || "Gagal menyimpan perubahan data perkara!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 font-sans">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 z-50 text-xs font-bold transition-all transform translate-y-0 animate-in fade-in duration-200 select-none ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

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
              Sistem Informasi Data Perkara
            </Link>
          </div>
        </div>

        {isKesatuanVerified && loggedInKesatuan && (
          <div className="flex items-center gap-2 bg-[#ffffff10] border border-[#ffffff15] rounded-full pl-3 pr-4 py-1.5 max-w-[150px] sm:max-w-xs select-none flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-[#0a1f3d] flex items-center justify-center shadow-sm flex-shrink-0">
              <User size={14} className="stroke-[3]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                Akses Satuan
              </span>
              <span className="text-[10px] font-extrabold text-white truncate max-w-[85px] leading-tight mt-0.5" title={loggedInKesatuan.nama}>
                {loggedInKesatuan.nama}
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
            
            {/* Kumdam Emblem */}
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

            {/* Menus */}
            <nav className="flex flex-col gap-1 px-3">
              <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>

              <Link to="/input-data" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
                <FileText size={18} />
                <span>Input Data</span>
              </Link>

              <Link to="/rekap-perkara" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 border-l-4 border-blue-600 transition-all">
                <BarChart3 size={18} />
                <span>Rekapitulasi</span>
              </Link>
            </nav>
          </div>

          <div className="border-t border-slate-100 py-4 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex items-center gap-3 px-6 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors text-sm font-semibold w-full text-left"
            >
              <LogOut size={16} />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        {/* 3. MAIN CONTENT */}
        <main className="flex-1 bg-[#f8fafc] p-6 lg:p-8 overflow-y-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center flex-col gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Memuat data perkara...</span>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
              
              {/* Back Button & Title */}
              <div className="flex items-center gap-4 mb-8">
                <Link 
                  to="/rekap-perkara"
                  className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition shadow-sm active:scale-95"
                >
                  <ArrowLeft size={16} />
                </Link>
                <div>
                  <h1 className="text-2xl font-extrabold text-[#0a1f3d] tracking-tight">
                    Edit Data Perkara
                  </h1>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Nomor Perkara: <span className="font-mono text-slate-700">{formData.noPerkara}</span> &bull; Satuan: <span className="text-blue-600 font-bold">{formData.satuan}</span>
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Column 1: Identitas Terlapor */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 block select-none">
                    Identitas Terlapor
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
                      placeholder="Nama Lengkap Terlapor..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700"
                      required
                    />
                  </div>

                  {/* NRP / NIP & Pangkat */}
                  <div className="grid grid-cols-2 gap-3">
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
                        placeholder="NRP / NIP..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700"
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
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700"
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
                      placeholder="Jabatan Terlapor..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700"
                    />
                  </div>

                  {/* Foto Personel */}
                  <div>
                    <label htmlFor="fotoPersonel" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                      Foto Personel
                    </label>
                    <input
                      type="file"
                      id="fotoPersonel"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700"
                    />
                    {formData.fotoPersonel && (
                      <div className="mt-3 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <img src={formData.fotoPersonel} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                        <span className="text-[9px] text-emerald-600 font-bold">✓ Foto terpilih</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, fotoPersonel: null, fotoPersonelName: '' }))}
                          className="text-[9px] text-red-500 hover:underline ml-auto font-bold"
                        >
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Rincian Perkara */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 block select-none">
                    Rincian Perkara
                  </span>

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
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    >
                      {JENIS_PERKARA_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {/* Kategori Pelanggaran / Perkara */}
                  <div>
                    <label htmlFor="kategoriPelanggaran" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                      Pilihan Perkara <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="kategoriPelanggaran"
                      name="kategoriPelanggaran"
                      value={formData.kategoriPelanggaran}
                      onChange={handleInputChange}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                      value={formData.pasal}
                      onChange={handleInputChange}
                      placeholder="Contoh: Pasal 338 KUHP"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                      placeholder="Kronologis perkara..."
                      className="w-full h-24 border border-slate-200 rounded-lg p-3 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-medium leading-relaxed"
                    />
                  </div>

                  {/* Dokumen Kronologis */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5 select-none">
                      Berkas Kronologis
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
                      className="border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100/50 rounded-lg p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5"
                    >
                      <UploadCloud size={24} className="text-slate-400" />
                      {newUploadedFile ? (
                        <div className="text-[10px] font-bold text-emerald-600 truncate max-w-xs">
                          ✓ Terpilih: {newUploadedFile.name}
                        </div>
                      ) : formData.fileUrl ? (
                        <div className="text-[10px] font-bold text-blue-600 truncate max-w-xs">
                          📄 Berkas Tersimpan: {formData.fileName || 'Lihat berkas'}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-bold">Pilih berkas baru jika ingin mengganti</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 3: Status & Putusan */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  
                  {/* Status Card */}
                  <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 block select-none">
                      Status & Tahapan
                    </span>

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
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      >
                        <option value="">PILIH TAHAPAN</option>
                        {TAHAP_PENYELESAIAN_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

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
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700"
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
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Dokumen Putusan Card */}
                  <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col gap-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 block select-none">
                      Nomor & Berkas Putusan (PDF)
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
                        placeholder="Nomor Salinan..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold mb-2 text-slate-700"
                      />
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handlePdfChange(e, 'salinanPutusan')}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-[10px] text-slate-500 font-semibold"
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
                        placeholder="Nomor Petikan..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold mb-2 text-slate-700"
                      />
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handlePdfChange(e, 'petikanPutusan')}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-[10px] text-slate-500 font-semibold"
                      />
                      {formData.petikanPutusanName && (
                        <span className="text-[9px] text-emerald-600 font-bold block mt-1">✓ {formData.petikanPutusanName}</span>
                      )}
                    </div>

                    {/* Akte BHT */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1 select-none">
                        Akte BHT
                      </label>
                      <input
                        type="text"
                        name="noAkteBht"
                        value={formData.noAkteBht}
                        onChange={handleInputChange}
                        placeholder="Nomor Akte..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold mb-2 text-slate-700"
                      />
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handlePdfChange(e, 'akteBht')}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-[10px] text-slate-500 font-semibold"
                      />
                      {formData.akteBhtName && (
                        <span className="text-[9px] text-emerald-600 font-bold block mt-1">✓ {formData.akteBhtName}</span>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs tracking-wider transition-all duration-150 active:scale-[0.98] shadow-md shadow-blue-600/10 disabled:opacity-60 disabled:cursor-not-allowed uppercase"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} className="text-amber-400" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-6 w-full max-w-sm">
            <h4 className="font-extrabold text-sm text-[#0a1f3d] uppercase tracking-wider mb-2">
              Konfirmasi Keluar
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-6">
              Apakah Anda yakin ingin keluar dari sistem akses kesatuan ini?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.removeItem('is_kesatuan_verified');
                  sessionStorage.removeItem('selected_kesatuan');
                  navigate('/');
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-md shadow-red-600/10"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
