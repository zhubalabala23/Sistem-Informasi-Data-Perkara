import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, HelpCircle } from 'lucide-react';
import logoKumdam from '../assets/images/logo_kumdam.jpeg';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === '12345') {
      sessionStorage.setItem('main_auth', 'true');
      navigate('/');
    } else {
      setError('Kata sandi keamanan tidak valid!');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] text-slate-800 font-sans animate-fade-in">
      
      {/* LEFT PANEL */}
      <div className="w-full md:w-[42%] bg-[#0a1f3d] text-white p-6 md:p-12 flex flex-col justify-between relative overflow-hidden flex-shrink-0">
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-full h-full border border-white rotate-45 transform origin-center"></div>
          <div className="absolute -bottom-1/4 -right-1/4 w-full h-full border border-white rotate-45 transform origin-center"></div>
        </div>

        {/* Top Section: Logo & Name */}
        <div className="flex items-center gap-3 select-none relative z-10">
          <img 
            src={logoKumdam} 
            alt="Logo Kumdam XVII Cenderawasih" 
            className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-lg border border-[#ffffff30] shadow-lg" 
          />
          <div className="flex flex-col">
            <span className="font-extrabold text-xs md:text-sm tracking-wider uppercase">KUMDAM XVII</span>
            <span className="text-[9px] md:text-[10px] text-slate-300 font-bold tracking-widest uppercase">CENDERAWASIH</span>
          </div>
        </div>

        {/* Middle Section: App Info */}
        <div className="my-6 md:my-0 relative z-10 flex flex-col gap-2 md:gap-4">
          <h1 className="text-xl md:text-4xl font-extrabold leading-tight tracking-tight max-w-sm">
            Sistem Informasi Data Perkara
          </h1>
          <p className="text-slate-300 text-xs md:text-sm font-semibold leading-relaxed max-w-sm hidden md:block">
            Platform manajemen data hukum dan perkara militer terintegrasi untuk Kumdam XVII/Cenderawasih.
          </p>
        </div>

        {/* Bottom Section */}
        <div className="text-[9px] text-slate-400 font-bold tracking-widest uppercase relative z-10 select-none hidden md:block">
          DIRANCANG UNTUK INTEGRITAS & KERAHASIAAN
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-white flex flex-col justify-between p-6 md:p-16">
        <div className="hidden md:block"></div> {/* Spacing */}

        <div className="max-w-md w-full mx-auto my-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-3xl font-extrabold text-[#0a1f3d] tracking-tight">
              Selamat Datang
            </h2>
            <p className="text-slate-400 text-xs mt-1 md:mt-1.5 font-bold">
              Silakan masukkan akses keamanan untuk melanjutkan.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label 
                htmlFor="password" 
                className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 select-none"
              >
                Kunci / Password
              </label>
              
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi akses"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold outline-none"
                  required
                  autoFocus
                />
              </div>
              
              {error && (
                <span className="text-[10px] text-red-500 font-bold mt-2 block animate-pulse">
                  {error}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#0a1f3d] hover:bg-[#122e54] text-white text-xs font-extrabold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-md uppercase tracking-wider mt-2"
            >
              <span>Masuk</span>
              <LogIn size={14} />
            </button>
          </form>

          {/* Technical Info */}
          <div className="mt-8 md:mt-12 border-t border-slate-100 pt-5 md:pt-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 md:mb-2 select-none">
              Informasi Teknis
            </span>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              Akses ini diawasi dan terbatas pada personel yang berwenang. Segala bentuk pelanggaran keamanan akan diproses sesuai hukum yang berlaku.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
