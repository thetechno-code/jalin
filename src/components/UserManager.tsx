import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Building, 
  HelpCircle, 
  Key, 
  Eye, 
  EyeOff, 
  Info,
  Lock,
  Search,
  UserCheck
} from 'lucide-react';
import { LogisticsUser, Office, UserRole } from '../types';
import SearchableSelect from './SearchableSelect';

interface UserManagerProps {
  users: LogisticsUser[];
  offices: Office[];
  currentUser: any;
  onSaveUser: (user: LogisticsUser) => Promise<boolean>;
  onDeleteUser: (userId: number) => Promise<boolean>;
}

export default function UserManager({
  users,
  offices,
  currentUser,
  onSaveUser,
  onDeleteUser
}: UserManagerProps) {
  const [editingUser, setEditingUser] = useState<LogisticsUser | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Operator Hub');
  const [officeCode, setOfficeCode] = useState('10000');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Security guard check
  const isSuperAdmin = currentUser && currentUser.role === 'Super Admin Nasional';

  const getRoleIcon = (roleName: UserRole) => {
    switch (roleName) {
      case 'Super Admin Nasional': return <Shield className="w-3.5 h-3.5 text-orange-600" />;
      case 'Regional Admin': return <Building className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Operator Hub': return <Users className="w-3.5 h-3.5 text-cyan-600" />;
      case 'Auditor': return <UserCheck className="w-3.5 h-3.5 text-amber-600" />;
      default: return <Eye className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-slate-150 shadow-sm max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 rounded-full bg-orange-50 text-orange-600 animate-pulse border border-orange-200">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">Akses Terbatas Keamanan</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-normal">
            Halaman Manajemen Hak Akses Pengguna hanya dapat diakses oleh <span className="font-bold text-orange-700">Super Admin Nasional</span>.
          </p>
        </div>
        <div className="text-[11px] text-slate-400 font-mono bg-slate-50 px-3 py-2 rounded-lg italic">
          Peran Anda Saat Ini: "{currentUser ? currentUser.role : 'Guest'}"
        </div>
      </div>
    );
  }

  // Get office designation label
  const getOfficeLabel = (code: string) => {
    const o = offices.find((of) => of.office_code === code);
    return o ? `${o.office_name} (${o.office_type})` : `Kantor ${code}`;
  };

  const handleCreateNewClick = () => {
    setIsAdding(true);
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setRole('Operator Hub');
    setOfficeCode('10000');
    setStatus('Aktif');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleEditClick = (user: LogisticsUser) => {
    setEditingUser(user);
    setIsAdding(false);
    setUsername(user.username);
    setPassword(user.password || '');
    setFullName(user.full_name);
    setRole(user.role);
    setOfficeCode(user.office_code);
    setStatus(user.status);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !fullName.trim()) {
      setErrorMsg('Semua kolom bertanda bintang (*) wajib diisi.');
      return;
    }

    // Check for unique username in inputs when adding
    if (isAdding) {
      const exists = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
      if (exists) {
        setErrorMsg(`Username "${username}" sudah digunakan oleh akun lain.`);
        return;
      }
    }

    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('');

      const userData: LogisticsUser = {
        id: editingUser ? editingUser.id : undefined,
        username: username.trim(),
        password: password.trim(),
        full_name: fullName.trim(),
        role,
        office_code: officeCode,
        status
      };

      const ok = await onSaveUser(userData);
      if (ok) {
        setSuccessMsg(editingUser ? 'Akun pengguna berhasil diperbarui!' : 'Akun pengguna baru berhasil didaftarkan!');
        setIsAdding(false);
        setEditingUser(null);
      } else {
        setErrorMsg('Simpan data gagal. Terjadi kesalahan internal.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal menyimpan perubahan ke database.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async (userId: number) => {
    if (!confirm('Apakah anda yakin ingin menghapus permanen pengguna ini? Tindakan ini akan diaudit.')) {
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const ok = await onDeleteUser(userId);
      if (ok) {
        setSuccessMsg('Akun pengguna berhasil dihapus secara permanen.');
      } else {
        setErrorMsg('Gagal menghapus akun.');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal menghapus akun.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-wider font-bold text-orange-400 uppercase">Master Data Privilese</span>
          </div>
          <h2 className="text-lg font-extrabold tracking-tight">Manajemen User &amp; Peran Regional</h2>
          <p className="text-xs text-slate-400 max-w-xl font-light">
            Daftarkan akun login pegawai, tentukan unit penempatan kantor, serta ikat level hak akses spesifik per masing-masing draf rute.
          </p>
        </div>

        {!isAdding && !editingUser && (
          <button
            onClick={handleCreateNewClick}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-xl text-xs transition shadow-md"
          >
            <UserPlus className="w-4 h-4" /> Daftar Pengguna Baru
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <UserCheck className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-205 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <X className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Editor Panel */}
      {(isAdding || editingUser) && (
        <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-xs font-extrabold font-mono uppercase text-cyan-800 tracking-wider">
              {editingUser ? `Sunting Pengguna: ${editingUser.username}` : 'Daftarkan Unit Pengguna Baru'}
            </h3>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingUser(null);
                setErrorMsg('');
              }}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-500 font-medium text-xs font-mono">Nama Lengkap Pegawai * :</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Siti Aminah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-medium text-xs font-mono">Username Login * :</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  placeholder="e.g., sitiaminah (huruf kecil)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-medium text-xs font-mono flex justify-between">
                  <span>Kata Sandi (Password) * :</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-cyan-850 text-cyan-600 hover:underline font-bold"
                  >
                    {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan keamanan sandi..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-slate-500 font-medium text-xs font-mono">Unit Kantor Penempatan * :</label>
                <SearchableSelect
                  options={offices.map((o) => ({
                    value: o.office_code,
                    label: `[${o.office_code}] ${o.office_name} (${o.office_type})`
                  }))}
                  value={officeCode}
                  onChange={setOfficeCode}
                  placeholder="Cari & pilih Unit Kantor..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-medium text-xs font-mono">Peran Otorisasi (User Role) * :</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none font-medium"
                >
                  <option value="Super Admin Nasional">Super Admin Nasional (Seluruh Regional)</option>
                  <option value="Regional Admin">Regional Admin (Wilayah Tertentu)</option>
                  <option value="Operator Hub">Operator Hub (Operasional Draf)</option>
                  <option value="Auditor">Auditor (Log Pelacakan)</option>
                  <option value="Viewer">Viewer (Hanya Baca)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-medium text-xs font-mono">Status Akun :</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="user_status"
                      checked={status === 'Aktif'}
                      onChange={() => setStatus('Aktif')}
                      className="text-cyan-600 focus:ring-0"
                    />
                    <span>Aktif (Dapat Login)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-705 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="user_status"
                      checked={status === 'Nonaktif'}
                      onChange={() => setStatus('Nonaktif')}
                      className="text-red-650 focus:ring-0"
                    />
                    <span className="text-red-700 font-bold">Nonaktif (Penangguhan)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 bg-slate-100 font-bold rounded-lg text-slate-650 hover:bg-slate-200 transition text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-lg transition text-xs shadow"
              >
                {loading ? 'Menyimpan...' : 'Simpan Akral User'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari user (nama, username, peran)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white transition"
            />
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
            <Users className="w-3.5 h-3.5" /> Total Pegawai: <strong>{users.length} Akun</strong> {filteredUsers.length > 25 && "(Tampil 25 Teratas)"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-550 border-b border-slate-200 font-mono text-[10px] uppercase">
                <th className="p-3">Username / Profil</th>
                <th className="p-3">Nama Pegawai</th>
                <th className="p-3">Hak Akses Peran</th>
                <th className="p-3">Penempatan Kantor</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.slice(0, 25).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3">
                      <div className="font-mono text-cyan-800 font-extrabold">{u.username}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{u.full_name}</div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${
                        u.role === 'Super Admin Nasional' ? 'bg-orange-50 border-orange-200 text-orange-700 font-bold' :
                        u.role === 'Regional Admin' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                        u.role === 'Operator Hub' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' :
                        u.role === 'Auditor' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        {getRoleIcon(u.role)}
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="max-w-xs truncate text-slate-600 font-medium">
                        [{u.office_code}] {getOfficeLabel(u.office_code)}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        u.status === 'Aktif' 
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' 
                          : 'bg-red-50 border border-red-200 text-red-700'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleEditClick(u)}
                          className="p-1 px-2 rounded-md hover:bg-cyan-50 text-cyan-700 transition"
                          title="Sunting Privilese"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {/* Protect current logged-in user from deletion */}
                        {u.username !== currentUser.username && (
                          <button
                            onClick={() => handleDeleteClick(u.id!)}
                            className="p-1 px-2 rounded-md hover:bg-red-50 text-red-600 transition"
                            title="Hapus Pegawai"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    Belum ada pegawai terdaftar dengan kriteria pencarian ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
