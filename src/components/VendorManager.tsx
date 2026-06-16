import React, { useState } from 'react';
import { Vendor, Fleet, TransportMode } from '../types';
import { 
  Users, Truck, Plane, Ship, Star, Award, Building2, PlusCircle, 
  Edit, Trash2, Mail, Phone, Search, Info, ShieldCheck, X, 
  MapPin, Clipboard, Scale, Box, CheckCircle, AlertTriangle
} from 'lucide-react';

interface VendorManagerProps {
  vendors: Vendor[];
  fleets: Fleet[];
  onSaveVendor: (vendor: Vendor) => Promise<void>;
  onDeleteVendor: (id: string) => Promise<void>;
  onSaveFleet: (fleet: Fleet) => Promise<void>;
  onDeleteFleet: (id: string) => Promise<void>;
  currentRole: string;
}

export default function VendorManager({
  vendors,
  fleets,
  onSaveVendor,
  onDeleteVendor,
  onSaveFleet,
  onDeleteFleet,
  currentRole
}: VendorManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'vendors' | 'fleets'>('vendors');
  
  // Search & Filter state
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorTypeFilter, setVendorTypeFilter] = useState('ALL');
  const [fleetSearch, setFleetSearch] = useState('');
  const [fleetModeFilter, setFleetModeFilter] = useState('ALL');

  // Modals state
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [showFleetModal, setShowFleetModal] = useState(false);
  const [editingFleet, setEditingFleet] = useState<Fleet | null>(null);

  // Vendor form state
  const [vCode, setVCode] = useState('');
  const [vName, setVName] = useState('');
  const [vType, setVType] = useState<'BUMN' | 'Swasta' | 'Internasional' | 'Koperasi'>('Swasta');
  const [vContactPerson, setVContactPerson] = useState('');
  const [vContactPhone, setVContactPhone] = useState('');
  const [vContactEmail, setVContactEmail] = useState('');
  const [vStatus, setVStatus] = useState<'Aktif' | 'Suspended'>('Aktif');
  const [vRating, setVRating] = useState<number>(5);
  const [vendorError, setVendorError] = useState('');

  // Fleet form state
  const [fLicense, setFLicense] = useState('');
  const [fName, setFName] = useState('');
  const [fMode, setFMode] = useState<TransportMode>('Darat');
  const [fMaxWeight, setFMaxWeight] = useState(10000);
  const [fMaxVolume, setFMaxVolume] = useState(30);
  const [fVendorId, setFVendorId] = useState('');
  const [fStatus, setFStatus] = useState<'Tersedia' | 'Beroperasi' | 'Perbaikan'>('Tersedia');
  const [fleetError, setFleetError] = useState('');

  // Selected Vendor Detail Sidebar
  const [selectedVendorForDetail, setSelectedVendorForDetail] = useState<Vendor | null>(null);

  const canModify = currentRole === 'Super Admin Nasional' || currentRole === 'Operator Hub';

  // Vendor handlers
  const handleOpenAddVendor = () => {
    setEditingVendor(null);
    setVCode(`VND-${Math.floor(1000 + Math.random() * 9000)}`);
    setVName('');
    setVType('Swasta');
    setVContactPerson('');
    setVContactPhone('');
    setVContactEmail('');
    setVStatus('Aktif');
    setVRating(5);
    setVendorError('');
    setShowVendorModal(true);
  };

  const handleOpenEditVendor = (v: Vendor) => {
    setEditingVendor(v);
    setVCode(v.vendor_code);
    setVName(v.vendor_name);
    setVType(v.vendor_type);
    setVContactPerson(v.contact_person);
    setVContactPhone(v.contact_phone);
    setVContactEmail(v.contact_email);
    setVStatus(v.status);
    setVRating(v.rating);
    setVendorError('');
    setShowVendorModal(true);
  };

  const handleSaveVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vCode || !vName || !vContactPerson || !vContactPhone || !vContactEmail) {
      setVendorError('Harap lengkapi semua data formulir.');
      return;
    }
    
    // Check code unique on creation
    if (!editingVendor && vendors.some(v => v.vendor_code === vCode)) {
      setVendorError(`Kode Vendor ${vCode} sudah terdaftar.`);
      return;
    }

    const payload: Vendor = {
      id: editingVendor ? editingVendor.id : `V_${Date.now()}`,
      vendor_code: vCode.toUpperCase().trim(),
      vendor_name: vName.toUpperCase().trim(),
      vendor_type: vType,
      contact_person: vContactPerson,
      contact_phone: vContactPhone,
      contact_email: vContactEmail,
      status: vStatus,
      rating: vRating
    };

    try {
      await onSaveVendor(payload);
      setShowVendorModal(false);
      if (selectedVendorForDetail?.id === payload.id) {
        setSelectedVendorForDetail(payload);
      }
    } catch (err) {
      setVendorError('Gagal menyimpan vendor ke Cloud SQL.');
    }
  };

  const handleDeleteVendorClick = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus vendor "${name}"? Seluruh armada angkutan terkait akan ikut terhapus.`)) {
      try {
        await onDeleteVendor(id);
        if (selectedVendorForDetail?.id === id) {
          setSelectedVendorForDetail(null);
        }
      } catch (err) {
        alert('Gagal menghapus vendor.');
      }
    }
  };

  // Fleet handlers
  const handleOpenAddFleet = () => {
    setEditingFleet(null);
    setFLicense('');
    setFName('');
    setFMode('Darat');
    setFMaxWeight(12000);
    setFMaxVolume(40);
    setFVendorId(vendors[0]?.id || '');
    setFStatus('Tersedia');
    setFleetError('');
    setShowFleetModal(true);
  };

  const handleOpenEditFleet = (f: Fleet) => {
    setEditingFleet(f);
    setFLicense(f.license_plate);
    setFName(f.vehicle_name);
    setFMode(f.vehicle_mode);
    setFMaxWeight(f.max_weight);
    setFMaxVolume(f.max_volume);
    setFVendorId(f.vendor_id);
    setFStatus(f.status);
    setFleetError('');
    setShowFleetModal(true);
  };

  const handleSaveFleetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fLicense || !fName || !fVendorId) {
      setFleetError('Harap lengkapi semua field armada.');
      return;
    }

    if (!editingFleet && fleets.some(f => f.license_plate.replace(/\s+/g, '').toUpperCase() === fLicense.replace(/\s+/g, '').toUpperCase())) {
      setFleetError(`Instansi Armada No Pelat "${fLicense}" sudah terdaftar.`);
      return;
    }

    const payload: Fleet = {
      id: editingFleet ? editingFleet.id : `F_${Date.now()}`,
      license_plate: fLicense.toUpperCase().trim(),
      vehicle_name: fName.trim(),
      vehicle_mode: fMode,
      max_weight: Number(fMaxWeight),
      max_volume: Number(fMaxVolume),
      vendor_id: fVendorId,
      status: fStatus
    };

    try {
      await onSaveFleet(payload);
      setShowFleetModal(false);
    } catch (err) {
      setFleetError('Gagal menyimpan armada ke Cloud SQL.');
    }
  };

  const handleDeleteFleetClick = async (id: string, plate: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus armada "${plate}"?`)) {
      try {
        await onDeleteFleet(id);
      } catch (err) {
        alert('Gagal menghapus armada.');
      }
    }
  };

  // Filter listings
  const filteredVendors = vendors.filter(v => {
    const matchS = v.vendor_name.toLowerCase().includes(vendorSearch.toLowerCase()) || 
                   v.vendor_code.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                   v.contact_person.toLowerCase().includes(vendorSearch.toLowerCase());
    const matchT = vendorTypeFilter === 'ALL' || v.vendor_type === vendorTypeFilter;
    return matchS && matchT;
  });

  const filteredFleets = fleets.filter(f => {
    const matchS = f.vehicle_name.toLowerCase().includes(fleetSearch.toLowerCase()) || 
                   f.license_plate.toLowerCase().includes(fleetSearch.toLowerCase());
    const matchM = fleetModeFilter === 'ALL' || f.vehicle_mode === fleetModeFilter;
    return matchS && matchM;
  });

  const getVendorName = (id: string) => {
    return vendors.find(v => v.id === id)?.vendor_name || `Vendor ID ${id}`;
  };

  // Stats calculation
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => v.status === 'Aktif').length;
  const totalFleets = fleets.length;
  const activeFleets = fleets.filter(f => f.status === 'Beroperasi').length;
  const avgRating = vendors.reduce((sum, v) => sum + v.rating, 0) / (totalVendors || 1);

  return (
    <div className="space-y-6">
      {/* 1. Statistics Cards Widget */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Total Vendor Angkutan</span>
            <h3 className="text-2xl font-bold text-slate-850 tracking-tight mt-1">{totalVendors} <span className="text-xs text-slate-400 font-normal">Perusahaan</span></h3>
            <p className="text-[10px] text-green-600 font-mono mt-0.5">🟢 {activeVendors} Status Aktif</p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg text-indigo-650">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Kekuatan Armada Armada</span>
            <h3 className="text-2xl font-bold text-slate-850 tracking-tight mt-1">{totalFleets} <span className="text-xs text-slate-400 font-normal">Kendaraan</span></h3>
            <p className="text-[10px] text-orange-500 font-mono mt-0.5">🚚 {fleets.filter(f=>f.vehicle_mode === 'Darat').length} • ✈️ {fleets.filter(f=>f.vehicle_mode === 'Udara').length} • 🚢 {fleets.filter(f=>f.vehicle_mode === 'Laut').length}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-650">
            <Truck className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Rerata Rating Vendor</span>
            <div className="flex items-center gap-1.5 mt-1">
              <h3 className="text-2xl font-bold text-slate-850 tracking-tight">{avgRating.toFixed(1)}</h3>
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(avgRating) ? 'fill-current text-amber-400' : 'text-slate-200'}`} />
                ))}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">Komitmen SLA Kerja 100%</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg text-amber-650">
            <Award className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-slate-500">Kapasitas Maksimal</span>
            <h3 className="text-lg font-bold text-slate-850 tracking-tight mt-1">
              {(fleets.reduce((sum, f) => sum + f.max_weight, 0) / 1000).toLocaleString('id-ID')} Ton
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Volume: {fleets.reduce((sum, f) => sum + f.max_volume,0).toLocaleString('id-ID')} m³</p>
          </div>
          <div className="bg-cyan-50 p-3 rounded-lg text-cyan-650">
            <Scale className="w-6 h-6 text-cyan-600" />
          </div>
        </div>
      </div>

      {/* 2. TAB TOGGLER (Vendors vs. Fleets) */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveSubTab('vendors'); setSelectedVendorForDetail(null); }}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'vendors' 
              ? 'border-cyan-600 text-cyan-700 font-extrabold bg-slate-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4" /> 1. Manajemen Vendor Mitra Angkutan ({vendors.length})
        </button>
        <button
          onClick={() => { setActiveSubTab('fleets'); setSelectedVendorForDetail(null); }}
          className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'fleets' 
              ? 'border-cyan-600 text-cyan-700 font-extrabold bg-slate-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-4 h-4" /> 2. Detail Data Armada Angkutan ({fleets.length})
        </button>
      </div>

      {/* 3. WORKSPACE FOR ACTIVE TAB */}
      {activeSubTab === 'vendors' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Vendors Table Area */}
          <div className={`${selectedVendorForDetail ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
            {/* Filter Panel */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3 border border-slate-200 rounded-xl">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Vendor (Nama, Kode, Contact Person)..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 text-xs text-slate-850 rounded-lg focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={vendorTypeFilter}
                  onChange={(e) => setVendorTypeFilter(e.target.value)}
                  className="bg-white text-xs text-slate-850 border border-slate-200 p-2 rounded-lg focus:outline-none"
                >
                  <option value="ALL">Semua Jenis Vendor</option>
                  <option value="BUMN">🏛️ BUMN</option>
                  <option value="Swasta">💼 Swasta</option>
                  <option value="Internasional">🌐 Internasional</option>
                  <option value="Koperasi">🤝 Koperasi</option>
                </select>

                {canModify && (
                  <button
                    onClick={handleOpenAddVendor}
                    className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition"
                  >
                    <PlusCircle className="w-4 h-4" /> Register Vendor Baru
                  </button>
                )}
              </div>
            </div>

            {filteredVendors.length > 25 && (
              <div className="text-[10px] bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg font-medium font-mono">
                💡 Ditemukan {filteredVendors.length} vendor. Tampilan dibatasi hanya 25 vendor teratas untuk optimasi performa.
              </div>
            )}

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-mono border-b border-slate-200 text-[10px] uppercase">
                      <th className="p-3">Kode Vendor</th>
                      <th className="p-3">Nama Perusahaan</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3">Contact Person</th>
                      <th className="p-3">Armada Aktif</th>
                      <th className="p-3">Rating Kerja</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVendors.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          <Users className="w-8 h-8 mx-auto opacity-30 mb-2" />
                          Tidak ada data vendor angkutan yang ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredVendors.slice(0, 25).map((vendor) => {
                        const vendorFleets = fleets.filter(f => f.vendor_id === vendor.id);
                        const isSelected = selectedVendorForDetail?.id === vendor.id;
                        return (
                          <tr 
                            key={vendor.id} 
                            onClick={() => setSelectedVendorForDetail(vendor)}
                            className={`hover:bg-slate-50 transition cursor-pointer ${
                              isSelected ? 'bg-cyan-50/40 hover:bg-cyan-100/10' : ''
                            }`}
                          >
                            <td className="p-3 font-mono font-bold text-slate-700">{vendor.vendor_code}</td>
                            <td className="p-3 font-bold text-slate-850">{vendor.vendor_name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                vendor.vendor_type === 'BUMN' 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                  : vendor.vendor_type === 'Swasta'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {vendor.vendor_type}
                              </span>
                            </td>
                            <td className="p-3">
                              <div>{vendor.contact_person}</div>
                              <div className="text-[10px] text-slate-400">{vendor.contact_email}</div>
                            </td>
                            <td className="p-3 font-mono font-bold text-indigo-600">
                              {vendorFleets.length} Unit
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <span className="font-bold">{vendor.rating}</span>
                                <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                vendor.status === 'Aktif' 
                                  ? 'bg-green-50 text-green-700 border border-green-200' 
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {vendor.status}
                              </span>
                            </td>
                            <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditVendor(vendor)}
                                  className="p-1 text-slate-500 hover:text-cyan-600 hover:bg-slate-100 rounded transition cursor-pointer"
                                  title="Edit Vendor"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                {canModify && (
                                  <button
                                    onClick={() => handleDeleteVendorClick(vendor.id, vendor.vendor_name)}
                                    className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded transition cursor-pointer"
                                    title="Hapus Vendor"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Detail Vendor */}
          {selectedVendorForDetail && (
            <div className="col-span-1 lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[10px] uppercase font-mono font-extrabold text-cyan-600">Profil Kerja Vendor</span>
                <button
                  onClick={() => setSelectedVendorForDetail(null)}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[9px] font-mono uppercase bg-slate-150 text-slate-800 px-2 py-0.5 rounded font-bold border border-slate-200">
                  Code: {selectedVendorForDetail.vendor_code}
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm mt-2">{selectedVendorForDetail.vendor_name}</h4>
                <div className="flex text-amber-500 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < selectedVendorForDetail.rating ? 'fill-current text-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                <div className="flex items-center gap-2 text-slate-650">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-705 truncate font-medium">{selectedVendorForDetail.contact_email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-650">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-705 font-mono">{selectedVendorForDetail.contact_phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-650">
                  <span className="font-bold text-slate-400 shrink-0 text-[10px] uppercase font-mono">PIC:</span>
                  <span className="text-slate-705 font-semibold">{selectedVendorForDetail.contact_person}</span>
                </div>
              </div>

              {/* Asssociated Fleets inside selected vendor */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Armada Yang Terkait:</span>
                  <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.2 rounded font-bold text-[9px] font-mono">
                    {fleets.filter(f => f.vendor_id === selectedVendorForDetail.id).length} Unit
                  </span>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {fleets.filter(f => f.vendor_id === selectedVendorForDetail.id).length === 0 ? (
                    <div className="text-center py-4 bg-slate-50 rounded border border-slate-100 text-[11px] text-slate-450">
                      Tidak ada armada yang didaftarkan untuk vendor ini.
                    </div>
                  ) : (
                    fleets.filter(f => f.vendor_id === selectedVendorForDetail.id).map(f => (
                      <div key={f.id} className="bg-slate-50 border border-slate-150 p-2 rounded flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{f.license_plate}</p>
                          <p className="text-[10px] text-slate-500">{f.vehicle_name}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-1.5 py-0.2 text-[8px] font-mono font-extrabold rounded ${
                            f.vehicle_mode === 'Darat' ? 'bg-orange-100 text-orange-700' : f.vehicle_mode === 'Udara' ? 'bg-cyan-100 text-cyan-700' : 'bg-teal-100 text-teal-700'
                          }`}>
                            {f.vehicle_mode}
                          </span>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{(f.max_weight/1000)} Ton</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Fleets Armada Tab */
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3 border border-slate-200 rounded-xl">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Armada (Pelat Nomor, Tipe Armada)..."
                value={fleetSearch}
                onChange={(e) => setFleetSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 text-xs text-slate-850 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={fleetModeFilter}
                onChange={(e) => setFleetModeFilter(e.target.value)}
                className="bg-white text-xs text-slate-850 border border-slate-200 p-2 rounded-lg focus:outline-none"
              >
                <option value="ALL">Semua Jalur Transport</option>
                <option value="Darat">🚚 Jalan Darat</option>
                <option value="Udara">✈️ Cargo Udara</option>
                <option value="Laut">🚢 Tol Laut</option>
              </select>

              {canModify && (
                <button
                  onClick={handleOpenAddFleet}
                  disabled={vendors.length === 0}
                  className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" /> Tambah Armada Baru
                </button>
              )}
            </div>
          </div>

          {filteredFleets.length > 25 && (
            <div className="text-[10px] bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg font-medium font-mono">
              💡 Ditemukan {filteredFleets.length} armada. Tampilan dibatasi hanya 25 armada teratas untuk optimasi performa.
            </div>
          )}

          {/* Fleets Grid Card List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFleets.length === 0 ? (
              <div className="col-span-1 lg:col-span-3 bg-white border p-12 rounded-xl text-center text-slate-400">
                <Truck className="w-10 h-10 mx-auto opacity-30 mb-2" />
                Tidak ada data armada angkutan terdaftar.
              </div>
            ) : (
              filteredFleets.slice(0, 25).map((fleet) => {
                let ModeIcon = Truck;
                let bgIconColor = 'bg-orange-50 text-orange-600 border-orange-120';
                if (fleet.vehicle_mode === 'Udara') {
                  ModeIcon = Plane;
                  bgIconColor = 'bg-cyan-50 text-cyan-600 border-cyan-120';
                } else if (fleet.vehicle_mode === 'Laut') {
                  ModeIcon = Ship;
                  bgIconColor = 'bg-emerald-50 text-emerald-600 border-emerald-120';
                }

                return (
                  <div key={fleet.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 hover:shadow transition relative flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            No Pelat / Registrasi
                          </span>
                          <h4 className="text-md font-extrabold text-slate-900 tracking-tight mt-1">{fleet.license_plate}</h4>
                        </div>
                        <div className={`p-2 rounded-lg border flex items-center justify-center shrink-0 ${bgIconColor}`}>
                          <ModeIcon className="w-5 h-5" />
                        </div>
                      </div>

                      <div>
                        <p className="text-slate-800 font-bold text-xs">{fleet.vehicle_name}</p>
                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono uppercase font-bold">
                          Owner: <span className="text-cyan-700 truncate max-w-[140px] inline-block">{getVendorName(fleet.vendor_id)}</span>
                        </p>
                      </div>

                      {/* Weight Volume Bar */}
                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold leading-none uppercase">Max Load</span>
                            <span className="text-slate-755 font-bold">{fleet.max_weight.toLocaleString('id-ID')} Kg</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono">
                          <Box className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <span className="text-[9px] text-slate-400 block font-bold leading-none uppercase">Max Volume</span>
                            <span className="text-slate-755 font-bold">{fleet.max_volume.toLocaleString('id-ID')} m³</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        fleet.status === 'Tersedia' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : fleet.status === 'Beroperasi'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {fleet.status}
                      </span>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleOpenEditFleet(fleet)}
                          className="px-2 py-1 hover:bg-slate-100 rounded text-slate-700 flex items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
                        >
                          <Edit className="w-3 h-3 text-cyan-600" /> Edit
                        </button>
                        {canModify && (
                          <button
                            onClick={() => handleDeleteFleetClick(fleet.id, fleet.license_plate)}
                            className="px-2 py-1 hover:bg-slate-100 rounded text-red-600 flex items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" /> Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== 4. VENDOR CREATE/EDIT MODAL ==================== */}
      {showVendorModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide font-mono uppercase">
                {editingVendor ? 'Edit Profil Mitra Vendor' : 'Registrasi Vendor Angkutan Baru'}
              </h3>
              <button
                onClick={() => setShowVendorModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVendorSubmit} className="p-6 space-y-4">
              {vendorError && (
                <div className="bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-200 text-xs flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> {vendorError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Kode Vendor (Unik)</label>
                  <input
                    type="text"
                    disabled={!!editingVendor}
                    value={vCode}
                    onChange={(e) => setVCode(e.target.value)}
                    placeholder="e.g. VND-POSLOG"
                    className="w-full bg-slate-50 disabled:opacity-60 border border-slate-200 p-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:bg-white focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Jenis Kemitraan</label>
                  <select
                    value={vType}
                    onChange={(e) => setVType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:bg-white"
                  >
                    <option value="BUMN">BUMN</option>
                    <option value="Swasta">Swasta</option>
                    <option value="Internasional">Internasional</option>
                    <option value="Koperasi">Koperasi</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Nama Perusahaan / Corporate name</label>
                <input
                  type="text"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  placeholder="e.g. PT POS LOGISTIK INDONESIA"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:bg-white focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Contact Person (PIC Lapangan)</label>
                <input
                  type="text"
                  value={vContactPerson}
                  onChange={(e) => setVContactPerson(e.target.value)}
                  placeholder="Nama Lengkap Staff PIC"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">No Telp Whatsapp</label>
                  <input
                    type="text"
                    value={vContactPhone}
                    onChange={(e) => setVContactPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Email Kantor</label>
                  <input
                    type="email"
                    value={vContactEmail}
                    onChange={(e) => setVContactEmail(e.target.value)}
                    placeholder="corporate@domain.com"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Rating SLA Binaan (1-5)</label>
                  <select
                    value={vRating}
                    onChange={(e) => setVRating(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 rounded-lg focus:outline-none"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ 5 - Sangat Istimewa</option>
                    <option value="4">⭐⭐⭐⭐ 4 - Bagus / Sesuai Kontrak</option>
                    <option value="3">⭐⭐⭐ 3 - Cukup / Evaluasi Berkala</option>
                    <option value="2">⭐⭐ 2 - Rendah / Teguran Pertama</option>
                    <option value="1">⭐ 1 - Buruk / Tangguhkan Kerja</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Status Hubungan Kontrak</label>
                  <select
                    value={vStatus}
                    onChange={(e) => setVStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-800 rounded-lg focus:outline-none"
                  >
                    <option value="Aktif">🟢 Aktif (Kerja Berjalan)</option>
                    <option value="Suspended">🔴 Suspended (Ditangguhkan)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 justify-end border-t border-slate-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="px-4 py-2 bg-slate-105 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
                >
                  Simpan Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ==================== 5. FLEET CREATE/EDIT MODAL ==================== */}
      {showFleetModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm tracking-wide font-mono uppercase">
                {editingFleet ? 'Edit Detail Teknis Armada Angkutan' : 'Registrasi Armada Armada Pos Baru'}
              </h3>
              <button
                onClick={() => setShowFleetModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFleetSubmit} className="p-6 space-y-4">
              {fleetError && (
                <div className="bg-red-50 text-red-700 p-2.5 rounded-lg border border-red-200 text-xs flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> {fleetError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">No Pelat / Registrasi (Unik)</label>
                  <input
                    type="text"
                    disabled={!!editingFleet}
                    value={fLicense}
                    onChange={(e) => setFLicense(e.target.value)}
                    placeholder="e.g. B-9812-POS"
                    className="w-full bg-slate-50 disabled:opacity-60 border border-slate-200 p-2.5 text-xs text-slate-850 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Vendor Pemilik (Mitra)</label>
                  <select
                    value={fVendorId}
                    onChange={(e) => setFVendorId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-850 rounded-lg focus:outline-none"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.vendor_name} ({v.vendor_code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Nama Seri Kendaraan</label>
                  <input
                    type="text"
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    placeholder="e.g. Hino Wingbox Truck Heavy"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-850 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Jalur / Moda Transport</label>
                  <select
                    value={fMode}
                    onChange={(e) => setFMode(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-850 rounded-lg focus:outline-none"
                  >
                    <option value="Darat">🚚 Darat (Jalan Raya & Kereta)</option>
                    <option value="Udara">✈️ Udara (Urukan Udara)</option>
                    <option value="Laut">🚢 Laut (Tol Laut Kontainer)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Maks Kargo Berat (Payload Kg)</label>
                  <input
                    type="number"
                    value={fMaxWeight}
                    onChange={(e) => setFMaxWeight(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-850 rounded-lg focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Maks Kapasitas Kubikasi (Volume m³)</label>
                  <input
                    type="number"
                    value={fMaxVolume}
                    onChange={(e) => setFMaxVolume(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-850 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block font-mono">Status Operasional Armada</label>
                <select
                  value={fStatus}
                  onChange={(e) => setFStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-850 rounded-lg focus:outline-none"
                >
                  <option value="Tersedia">🟢 Tersedia (Bebas Ditugaskan)</option>
                  <option value="Beroperasi">🔵 Beroperasi (Sedang Jalan Rute)</option>
                  <option value="Perbaikan">🔴 Perbaikan (Maintenance Sipil)</option>
                </select>
              </div>

              <div className="flex gap-2.5 justify-end border-t border-slate-100 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowFleetModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg transition animate-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
                >
                  Simpan Spesifikasi Armada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
