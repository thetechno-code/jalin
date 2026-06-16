import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Map, 
  Truck, 
  ClipboardCheck, 
  Eye, 
  LogIn, 
  LogOut, 
  X, 
  Building, 
  User as UserIcon, 
  Lock,
  Info,
  AlertCircle
} from 'lucide-react';
import { UserRole } from '../types';

interface RoleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onLoginSuccess: (user: any) => void;
  onSignOut: () => void;
}

export default function RoleLoginModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onSignOut
}: RoleLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Harap masukkan username dan password Anda.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const resText = await res.text();
        if (resText.trim().startsWith('<')) {
          throw new Error('Server mengembalikan halaman HTML/404. Kemungkinan besar server backend Express belum berjalan sempurna atau Database Environment Variables di Vercel/hosting Anda belum dikonfigurasi.');
        } else {
          throw new Error('Server mengembalikan data non-JSON: ' + resText.slice(0, 100));
        }
      }

      if (!res.ok) {
        throw new Error(data.error || 'Autentikasi gagal');
      }

      onLoginSuccess(data.user);
      setUsername('');
      setPassword('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal tersambung ke server autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (roleName: UserRole) => {
    switch (roleName) {
      case 'Super Admin Nasional': return <ShieldCheck className="w-5 h-5 text-orange-600" />;
      case 'Regional Admin': return <Building className="w-5 h-5 text-indigo-600" />;
      case 'Operator Hub': return <Truck className="w-5 h-5 text-cyan-600" />;
      case 'Auditor': return <ClipboardCheck className="w-5 h-5 text-amber-600" />;
      default: return <Eye className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="custom-login-modal">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-lg border border-slate-150 animate-fadeIn">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 p-5 text-white flex justify-between items-center">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-cyan-300">N22POS SECURITY CONTROL</span>
              </div>
              <h3 className="text-base font-extrabold tracking-tight mt-0.5 font-sans">
                Portal Otentikasi Jaringan Kantor
              </h3>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {currentUser ? (
              /* Already Auth state */
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500 text-white shadow-sm shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Sesi Terautentikasi Aktif</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Anda saat ini masuk sebagai <strong className="text-emerald-800 font-bold">{currentUser.full_name}</strong>.
                    </p>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 divide-y text-xs text-slate-700">
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Username:</span>
                    <span className="font-mono font-bold text-slate-800">{currentUser.username}</span>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <span className="text-slate-400">Hak Akses / Peran:</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-800 rounded font-semibold text-[10px]">
                      {getRoleIcon(currentUser.role)}
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="p-3 flex justify-between">
                    <span className="text-slate-400">Kode Kantor Asal:</span>
                    <span className="font-mono font-bold text-slate-800">{currentUser.office_code}</span>
                  </div>
                </div>

                <button
                  onClick={onSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs transition"
                >
                  <LogOut className="w-4 h-4" /> Keluar Sesi Autentikasi
                </button>
              </div>
            ) : (
              /* Needs Login Form state */
              <form onSubmit={handleLocalSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Form Inputs */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 select-none">
                      Username Pengguna:
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="contoh: medan_admin, admin"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-slate-800"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 select-none">
                      Sandi Keamanan (Password):
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan sandi..."
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-slate-800"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-xl shadow-sm hover:shadow transition-all text-xs cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Menghubungkan...' : 'Masuk Ke Jaringan'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-5 py-4 border-t border-slate-150 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>SISTEM TERINTEGRASI PG_DATABASE</span>
            <span>STATUS: AMAN</span>
          </div>

        </div>
      </div>
    </div>
  );
}
