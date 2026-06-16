import React, { useState, useEffect } from 'react';
import { Database, Copy, Check, X, Shield, Key, HelpCircle, Eye, EyeOff } from 'lucide-react';

interface DBeaverGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DBeaverGuideModal({ isOpen, onClose }: DBeaverGuideModalProps) {
  const [credentials, setCredentials] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError('');
      fetch('/api/db-credentials')
        .then((res) => {
          if (!res.ok) throw new Error('Gagal mengambil data kredensial database');
          return res.json();
        })
        .then((data) => {
          setCredentials(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setError(err.message || 'Koneksi ke server API db-credentials terputus.');
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1C2D5A] to-cyan-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Database className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Koneksi Database PostgreSQL via DBeaver</h3>
              <p className="text-[10px] text-slate-300 font-mono tracking-wider">Super Admin Credentials Reference</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-4 border-cyan-700/30 border-t-cyan-700 rounded-full animate-spin"></div>
              <p className="text-xs font-mono text-slate-500 font-bold animate-pulse">Mengambil data kredensial aktual dari server...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-xs font-medium">
              <Shield className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          ) : credentials ? (
            <div className="space-y-6">
              
              {/* Credentials Grid */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 divide-y divide-slate-200/60">
                <div className="pb-3 grid grid-cols-1 md:grid-cols-4 items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Host / Server :</span>
                  <div className="md:col-span-3 flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-bold text-slate-800 bg-slate-100 p-1 rounded break-all select-all flex-1">
                      {credentials.host}
                    </code>
                    <button 
                      onClick={() => handleCopy(credentials.host, 'host')}
                      className="p-1 px-3 bg-white border border-slate-200 hover:border-cyan-500 text-slate-600 hover:text-cyan-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      {copiedField === 'host' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'host' ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div className="py-3 grid grid-cols-1 md:grid-cols-4 items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Port :</span>
                  <div className="md:col-span-3 flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-bold text-slate-800 bg-slate-100 p-1 rounded select-all">
                      {credentials.port}
                    </code>
                    <button 
                      onClick={() => handleCopy(credentials.port.toString(), 'port')}
                      className="p-1 px-3 bg-white border border-slate-200 hover:border-cyan-500 text-slate-600 hover:text-cyan-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      {copiedField === 'port' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'port' ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div className="py-3 grid grid-cols-1 md:grid-cols-4 items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Database Name :</span>
                  <div className="md:col-span-3 flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-bold text-slate-800 bg-slate-100 p-1 rounded select-all break-all">
                      {credentials.database}
                    </code>
                    <button 
                      onClick={() => handleCopy(credentials.database, 'database')}
                      className="p-1 px-3 bg-white border border-slate-200 hover:border-cyan-500 text-slate-600 hover:text-cyan-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      {copiedField === 'database' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'database' ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div className="py-3 grid grid-cols-1 md:grid-cols-4 items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500">User / Role :</span>
                  <div className="md:col-span-3 flex items-center justify-between gap-2">
                    <code className="text-xs font-mono font-bold text-slate-800 bg-slate-100 p-1 rounded select-all">
                      {credentials.username}
                    </code>
                    <button 
                      onClick={() => handleCopy(credentials.username, 'username')}
                      className="p-1 px-3 bg-white border border-slate-200 hover:border-cyan-500 text-slate-600 hover:text-cyan-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      {copiedField === 'username' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'username' ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-3 grid grid-cols-1 md:grid-cols-4 items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Password :</span>
                  <div className="md:col-span-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 px-1.5 rounded flex-1">
                      <code className="text-xs font-mono font-bold text-slate-800 flex-1 break-all select-all">
                        {showPassword ? credentials.password : '••••••••••••••••'}
                      </code>
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        title="Tampilkan/sembunyikan password"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button 
                      onClick={() => handleCopy(credentials.password, 'password')}
                      className="p-1 px-3 bg-white border border-slate-200 hover:border-cyan-500 text-slate-600 hover:text-cyan-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                    >
                      {copiedField === 'password' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'password' ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Conditional Info based on isSupabase */}
              {credentials.isSupabase ? (
                <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span>Koneksi Langsung (Direct Connection) ke Supabase Cloud</span>
                  </div>
                  <p className="text-emerald-700/100 leading-relaxed font-normal">
                    Database terhubung menggunakan host eksternal <strong>Supabase</strong> Anda. PC lokal Anda dapat terhubung secara <strong>langsung (Direct Connection)</strong> ke database tanpa memerlukan perantara Cloud SQL Auth Proxy!
                  </p>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                    <Shield className="w-4 h-4 text-rose-500" />
                    <span>Mengapa Muncul Error "Unable to parse URL" di DBeaver?</span>
                  </div>
                  <p className="text-rose-700/90 leading-relaxed font-normal">
                    Kredensial host <code className="bg-rose-100 px-1 py-0.5 rounded text-rose-900 font-mono font-bold">/app/cloudsql/...</code> di atas adalah <strong>Unix Domain Socket</strong> privat di dalam container server cloud. Karena formatnya mengandung garis miring (<code className="font-bold">/</code>) dan titik dua (<code className="font-bold">:</code>), driver JDBC DBeaver di PC lokal Anda tidak dapat menguraikannya sebagai nama host standar dan akan memunculkan pesan error parse URL.
                  </p>
                  <div className="mt-2 text-rose-700/90 font-medium">
                    👉 <strong>Solusi:</strong> PC Lokal Anda harus menginstal <strong>Cloud SQL Auth Proxy</strong> terlebih dahulu guna memetakan jalur socket ini menjadi port lokal <code className="font-bold">127.0.0.1:5432</code> yang dapat diakses oleh DBeaver.
                  </div>
                </div>
              )}

              {/* DBeaver Setup Instructions */}
              <div className="space-y-4">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <HelpCircle className="w-4 h-4 text-cyan-600" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    {credentials.isSupabase ? "Panduan Langkah-demi-Langkah Koneksi Supabase:" : "Panduan Langkah-demi-Langkah Koneksi PC Lokal:"}
                  </h4>
                </div>

                <div className="space-y-4 text-xs font-normal text-slate-600 leading-relaxed">
                  
                  {/* Step A: Run Proxy */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3">
                    <span className="bg-cyan-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Langkah A: Menjalankan Proxy di PC Lokal</span>
                    <ol className="list-decimal list-inside space-y-2 mt-1 pl-1">
                      <li>
                        Unduh program resmi <strong>Cloud SQL Auth Proxy</strong> dari dokumentasi resmi Google Cloud sesuai OS Anda (Windows, macOS, atau Linux).
                      </li>
                      <li>
                        Buka terminal (cmd / Powershell / Terminal macOS) di PC lokal Anda, jalankan proxy menggunakan nama instansi database ini:
                        <div className="mt-1.5 bg-slate-900 text-slate-200 p-2 rounded-lg font-mono text-[10px] break-all select-all flex items-center justify-between gap-2 border border-slate-800">
                          <code>./cloud-sql-proxy august-jigsaw-mk91c:asia-southeast1:ai-studio-34391f59</code>
                          <button 
                            onClick={() => handleCopy('./cloud-sql-proxy august-jigsaw-mk91c:asia-southeast1:ai-studio-34391f59', 'cmd-proxy')}
                            className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1 px-1.5 rounded transition shrink-0"
                          >
                            {copiedField === 'cmd-proxy' ? 'Disalin' : 'Salin'}
                          </button>
                        </div>
                      </li>
                      <li>
                        Biarkan terminal tersebut tetap terbuka dan terus berjalan (Proxy akan mendengarkan koneksi lokal Anda di port <strong className="text-slate-800">5432</strong>).
                      </li>
                    </ol>
                  </div>

                  {/* Step B: DBeaver setup */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3">
                    <span className="bg-cyan-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Langkah B: Konfigurasi di DBeaver</span>
                    <ol className="list-decimal list-inside space-y-2 mt-1 pl-1">
                      <li>
                        Buka software <strong className="text-slate-800">DBeaver</strong> Anda di PC/Laptop.
                      </li>
                      <li>
                        Klik ikon colokan di pojok kiri atas (<strong className="text-slate-800 font-bold text-slate-900">New Database Connection</strong>).
                      </li>
                      <li>
                        Pilih database <strong className="text-cyan-800">PostgreSQL</strong> dari daftar driver, lalu klik <strong className="text-slate-800">Next</strong>.
                      </li>
                      <li>
                        Di tab <strong className="text-slate-800">Main</strong>, isi parameter koneksi berikut (<strong>BUKAN</strong> menggunakan alamat host socket cloud):
                        <ul className="list-disc list-inside pl-5 mt-1.5 space-y-1.5 font-mono text-[11px] text-slate-500">
                          <li>Host &rarr; isi dengan <code className="font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded break-all">127.0.0.1</code> atau <code className="font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">localhost</code> <span className="text-slate-400 font-serif font-normal">(Karena diarahkan oleh proxy lokal Anda)</span></li>
                          <li>Port &rarr; isi dengan <code className="font-bold text-slate-800 bg-slate-100 px-1 py-0.5 rounded">5432</code></li>
                          <li>Database &rarr; isi dengan <code className="font-bold text-slate-850 text-slate-700 bg-slate-100 px-1 py-0.5 rounded select-all break-all">{credentials.database}</code></li>
                          <li>Username &rarr; isi dengan <code className="font-bold text-slate-700 bg-slate-100 px-1 py-0.5 rounded select-all">{credentials.username}</code></li>
                          <li>Password &rarr; isi dengan <code className="font-bold text-slate-700 bg-slate-100 px-1 py-0.5 rounded select-all">{credentials.password}</code></li>
                        </ul>
                      </li>
                      <li>
                        Klik tombol <strong className="text-cyan-700">Test Connection</strong> di pojok kiri bawah.
                        <div className="mt-1.5 bg-yellow-50 border border-yellow-200 p-2 rounded-lg text-[10px] text-amber-700 leading-normal">
                          💡 Jika muncul pop-up unduhan PostgreSQL driver, silakan klik <strong>Download</strong>. DBeaver akan mengunduh file pendukung secara otomatis.
                        </div>
                      </li>
                      <li>
                        Setelah tes koneksi bernilai <strong className="text-emerald-700">SUCCESS/Connected</strong>, klik <strong className="text-slate-800">Finish</strong>. Anda kini dapat membaca dan menulis tabel dari PC lokal secara realtime!
                      </li>
                    </ol>
                  </div>

                </div>
              </div>

              {/* Warning/Infobox */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-500 font-normal leading-normal flex items-start gap-2">
                <span className="text-cyan-600 font-bold shrink-0 font-mono">[!] NOTE</span>
                <p>
                  Database ini bersifat privat di jaringan Google Cloud. Kredensial super admin ini hanya akan ditampilkan saat Anda masuk sebagai <strong>Super Admin Nasional</strong>.
                </p>
              </div>

            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">Kredensial database tidak tersedia di server.</p>
          )}

        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 transition text-slate-700 rounded-xl text-xs font-bold shadow-sm"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
