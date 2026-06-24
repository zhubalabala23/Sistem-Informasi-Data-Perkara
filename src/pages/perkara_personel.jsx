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
  <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-md flex items-center justify-center overflow-hidden relative">
    <div className="absolute top-1 left-1 right-1 h-2 bg-amber-500 rounded-sm"></div>
    <svg className="w-20 h-20 text-slate-400 mt-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a4 4 0 0 0-4 4v3.25L5 11v8h14v-8l-3-1.75V6a4 4 0 0 0-4-4zm0 2a2 2 0 0 1 2 2v2.75l-2-.5-2 .5V6a2 2 0 0 1 2-2zm-5 8.75l2.5-1.46v2.46L7 14.5v-1.75zm10 0v1.75l-2.5-.75v-2.46l2.5 1.46z" />
    </svg>
  </div>
);

// Prepopulated static mock data representing personnel and their legal dossiers
const PERSONNEL_DOSSIERS = [
  {
    nrpNip: '12130045670891',
    namaLengkap: 'ACHMAD SURYA PRATAMA',
    pangkat: 'MAYOR CHK',
    jabatan: 'Kasi Hukum Militer',
    status: 'AKTIF',
    summary: { total: 4, selesai: 3 },
    cases: [
      {
        id: 'c_p1',
        perkara: 'Penyalahgunaan Wewenang',
        nomor: 'REG/142/XII/2023',
        badge: 'PRIORITAS TINGGI',
        kronologis: 'Diduga melakukan pembiaran terhadap aktivitas ilegal di wilayah tugas pada tanggal 14 November 2023. Saksi-saksi telah diperiksa di Pomdam XVII. Berkas perkara telah dilimpahkan ke Oditur Militer.',
        tahapan: 'Persidangan',
        detailTahapan: 'Sidang Ke-3',
        putusan: null,
        dokumenPutusan: null
      },
      {
        id: 'c_p2',
        perkara: 'Pelanggaran Disiplin Murni',
        nomor: 'KEP/08/I/2024',
        badge: null,
        kronologis: 'Ketidakhadiran tanpa izin (THTI) selama 3 hari kerja berturut-turut pada awal Januari 2024. Alasan kendala transportasi namun tidak melaporkan kepada atasan langsung.',
        tahapan: 'Selesai',
        detailTahapan: 'Selesai',
        putusan: 'Teguran Tertulis',
        dokumenPutusan: 'SURAT KEPUTUSAN HUKUMAN DISIPLIN MILITER\nNomor: KEP/08/I/2024\n\nMenimbang, bahwa Mayor Chk Achmad Surya Pratama terbukti melanggar disiplin murni dengan mangkir tugas selama 3 hari kerja.\n\nMengingat Pasal 5 UU Disiplin Militer, menjatuhkan hukuman disiplin berupa Teguran Tertulis yang dicatatkan pada Buku Register Personel.'
      },
      {
        id: 'c_p3',
        perkara: 'Lalu Lintas (Laka Lintas)',
        nomor: 'LAPA/22/XI/2023',
        badge: null,
        kronologis: 'Terlibat kecelakaan lalu lintas di KM 14 Jayapura yang mengakibatkan kerugian materil kendaraan dinas. Penyelesaian dilakukan secara kekeluargaan namun tetap melalui prosedur administrasi internal.',
        tahapan: 'Selesai',
        detailTahapan: 'Selesai',
        putusan: 'Ganti Rugi Kerusakan',
        dokumenPutusan: 'SURAT PERNYATAAN PENYELESAIAN PERKARA LALU LINTAS\nNomor: LAPA/22/XI/2023\n\nMenyatakan bahwa kerusakan kendaraan dinas Toyota Hilux diganti sepenuhnya oleh personel bersangkutan dengan mekanisme potong tunjangan logistik secara bertahap selama 3 bulan.'
      },
      {
        id: 'c_p4',
        perkara: 'Sengketa Perdata (Tanah)',
        nomor: 'PERD/45/IX/2023',
        badge: null,
        kronologis: 'Pendampingan hukum dalam sengketa kepemilikan tanah warisan di daerah Sentani. Telah mendapatkan putusan pengadilan tingkat pertama yang memenangkan pihak personel.',
        tahapan: 'Selesai',
        detailTahapan: 'Selesai',
        putusan: 'Menang Gugatan',
        dokumenPutusan: 'PUTUSAN PENGADILAN NEGERI JAYAPURA\nNomor: PERD/45/IX/2023\n\nMengadili dan menetapkan bahwa sengketa tanah seluas 250 meter persegi di Sentani sah milik Mayor Chk Achmad Surya Pratama berdasarkan sertifikat kepemilikan nomor sert.201/Sentani.'
      }
    ],
    logs: [
      { waktu: '15:30 WIB', aksi: 'Admin memperbarui Tahapan Perkara pada Perkara NO: REG/142/XII/2023.' },
      { waktu: '10:15 WIB', aksi: 'Dokumen Putusan diunggah untuk Perkara NO: KEP/08/I/2024.' }
    ]
  },
  {
    nrpNip: '21098273645',
    namaLengkap: 'SLAMET RAHARJO, S.H.',
    pangkat: 'LETKOL CHK',
    jabatan: 'Kasi Perkara',
    status: 'AKTIF',
    summary: { total: 1, selesai: 0 },
    cases: [
      {
        id: 'c_p5',
        perkara: 'Disiplin Murni',
        nomor: 'P-102/MIL/2024',
        badge: 'PRIORITAS',
        kronologis: 'Terlambat menghadiri apel satuan khusus tanpa alasan sah selama masa siaga pertahanan daerah.',
        tahapan: 'Persidangan',
        detailTahapan: 'Sidang Ke-1',
        putusan: null,
        dokumenPutusan: null
      }
    ],
    logs: [
      { waktu: '08:45 WIB', aksi: 'Perkara baru didaftarkan ke sistem dengan Nomor P-102/MIL/2024.' }
    ]
  },
  {
    nrpNip: '31012938475',
    namaLengkap: 'BUDI SANTOSO',
    pangkat: 'SERTU',
    jabatan: 'Danru 3',
    status: 'AKTIF',
    summary: { total: 1, selesai: 1 },
    cases: [
      {
        id: 'c_p6',
        perkara: 'Narkotika',
        nomor: 'NARK/301/II/2024',
        badge: 'PRIORITAS TINGGI',
        kronologis: 'Penyalahgunaan narkoba golongan I jenis sabu seberat 0.5 gram di area luar asrama militer.',
        tahapan: 'Selesai',
        detailTahapan: 'Selesai',
        putusan: 'Hukuman 2 Tahun',
        dokumenPutusan: 'PUTUSAN PENGADILAN MILITER JAYAPURA\nNomor: NARK/301/II/2024\n\nMenjatuhkan pidana penjara selama 2 (dua) tahun dan denda sebesar Rp 10.000.000,- subsidair 3 bulan kurungan kepada Sertu Budi Santoso atas kepemilikan narkoba golongan I.'
      }
    ],
    logs: [
      { waktu: '11:20 WIB', aksi: 'Dokumen Putusan Sidang Militer diunggah oleh Admin.' }
    ]
  }
];

export default function PerkaraPersonel() {
  const navigate = useNavigate();

  // State
  const [selectedNrp, setSelectedNrp] = useState('12130045670891');
  const [currentDossier, setCurrentDossier] = useState(PERSONNEL_DOSSIERS[0]);
  const [stageFilter, setStageFilter] = useState('');
  
  // Modals state
  const [verdictDoc, setVerdictDoc] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStep, setExportStep] = useState('select'); // select, processing, done

  // Load Dossier based on chosen NRP selection
  useEffect(() => {
    const dossier = PERSONNEL_DOSSIERS.find(d => d.nrpNip === selectedNrp);
    if (dossier) {
      setCurrentDossier(dossier);
    }
  }, [selectedNrp]);

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
      
      {/* 1. TOP NAVBAR (Consistent design layout) */}
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
            <Link to="/perkara-kesatuan" className="h-full flex items-center text-slate-300 hover:text-white border-b-2 border-transparent hover:border-slate-400 px-1 transition-all duration-200">
              Perkara Kesatuan
            </Link>
            <Link to="/perkara-personel" className="h-full flex items-center text-white border-b-2 border-white px-1 transition-all duration-200">
              Perkara Personel
            </Link>
          </nav>
        </div>

        {/* User profile dropdown box */}
        <div className="flex items-center gap-3 select-none">
          <div className="h-8 w-px bg-slate-700/80"></div>
          <div className="flex items-center gap-2 bg-slate-900/40 py-1.5 px-3 rounded-lg border border-slate-700/40">
            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 text-[10px] font-bold">
              AK
            </div>
            <span className="text-xs font-bold text-slate-200">ADMIN KUMDAM</span>
          </div>
        </div>
      </header>

      {/* Main layout container wrapping Sidebar and Main Content */}
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
                {PERSONNEL_DOSSIERS.map(d => (
                  <option key={d.nrpNip} value={d.nrpNip}>
                    {d.pangkat} {d.namaLengkap} - {d.nrpNip}
                  </option>
                ))}
              </select>
            </div>

            {/* GRID: Profile card and Ringkasan Legal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left card: Dossier Profil */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col md:flex-row gap-6 items-center md:items-start select-none">
                <MilitaryAvatar />
                
                <div className="flex-1 flex flex-col justify-between h-full min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                    <h2 className="font-extrabold text-[#0a1f3d] text-base tracking-tight uppercase">
                      Data Rincian Perkara Personel
                    </h2>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[9px] uppercase tracking-widest rounded-full border border-blue-100">
                      {currentDossier.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs mb-2">
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

              {/* Right card: Ringkasan Legal */}
              <div className="bg-[#0a1f3d] text-white rounded-xl border border-slate-700/80 shadow-md p-6 flex flex-col justify-between select-none">
                <div>
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-700/80 mb-4">
                    <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                    <h3 className="font-bold text-sm uppercase tracking-wider">Ringkasan Legal</h3>
                  </div>

                  <div className="flex flex-col gap-3 text-xs">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-300 font-medium">Total Perkara</span>
                      <span className="text-lg font-extrabold font-mono text-amber-400">
                        {String(currentDossier.summary.total).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-300 font-medium">Selesai (Putusan)</span>
                      <span className="text-lg font-extrabold font-mono text-emerald-400">
                        {String(currentDossier.summary.selesai).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/input-data')}
                  className="mt-6 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 font-bold text-xs tracking-wider transition active:scale-[0.98] shadow-sm shadow-blue-500/10"
                >
                  <Plus size={15} />
                  <span>TAMBAH PERKARA BARU</span>
                </button>
              </div>

            </div>

            {/* Filter and Dossier Table section */}
            <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
              
              {/* Table Header and filter select */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4 select-none">
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

                  <button
                    onClick={() => {
                      setIsExportOpen(true);
                      setExportStep('select');
                    }}
                    className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg transition active:scale-[0.95] text-slate-500"
                    title="Download Dossier PDF"
                  >
                    <Download size={15} />
                  </button>
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
                          {item.kronologis}
                        </td>

                        {/* Tahapan Column */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 select-none">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              item.tahapan === 'Selesai' ? 'bg-slate-700' : 'bg-blue-500'
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
                        <td className="py-4 px-6 text-center">
                          {item.dokumenPutusan ? (
                            <button
                              onClick={() => setVerdictDoc(item)}
                              className="py-1 px-3 bg-[#0a1f3d] hover:bg-[#122e54] text-white rounded font-bold text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 mx-auto transition active:scale-[0.95]"
                            >
                              <FileText size={10} />
                              <span>LIHAT</span>
                            </button>
                          ) : (
                            <div className="text-slate-300 flex items-center justify-center" title="Dokumen Putusan belum tersedia">
                              <EyeOff size={16} />
                            </div>
                          )}
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

            {/* Bottom activity log timeline */}
            <section className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 select-none">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                <Clock size={16} className="text-slate-500" />
                <h4 className="font-extrabold text-xs text-[#0a1f3d] uppercase tracking-wider">
                  Log Aktivitas Terakhir
                </h4>
              </div>

              <div className="flex flex-col gap-3 text-xs">
                {currentDossier.logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <span className="text-[10px] font-bold text-slate-400 font-mono whitespace-nowrap mt-0.5">{log.waktu}</span>
                    <span className="text-slate-600 font-semibold">{log.aksi}</span>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* FOOTER */}
          <footer className="mt-8 pt-6 border-t border-slate-200 py-6 select-none">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-bold tracking-wider uppercase">
              <div>
                &copy; 2024 Sistem Informasi Data Perkara KUMDAM XVII/Cenderawasih. Hak Cipta Dilindungi.
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

      {/* EXPORT LOADING MODAL */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 select-none">
          <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">Export Dossier Personel</span>
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
                    Unduh dossier lengkap berkas hukum untuk {currentDossier.pangkat} {currentDossier.namaLengkap} (Total {currentDossier.cases.length} perkara):
                  </p>
                  
                  <button
                    type="button"
                    onClick={startExportSimulation}
                    className="py-3 px-4 bg-[#0a1f3d] hover:bg-[#122e54] text-white rounded-lg flex items-center justify-center gap-2 font-bold text-xs shadow-md transition active:scale-[0.98]"
                  >
                    <FilePdf size={16} className="text-amber-500" />
                    <span>MULAI EKSPOR DOSSIER PDF</span>
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
                    <span className="text-[10px] text-slate-400 font-semibold">Harap tunggu, dossier sedang dikompilasi</span>
                  </div>
                </div>
              )}

              {exportStep === 'done' && (
                <div className="flex flex-col items-center gap-4 text-center py-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 animate-bounce">
                    <CheckCircle size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-xs text-slate-800">Dossier Berhasil Diekspor!</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Berkas siap diunduh ke komputer Anda.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExportOpen(false)}
                    className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition active:scale-[0.98]"
                  >
                    UNDUH DOSSIER SEKARANG
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
