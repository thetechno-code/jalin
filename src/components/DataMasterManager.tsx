import React, { useState } from 'react';
import { Office, TransportNode, NodeCategory, OfficeType } from '../types';
import { PlusCircle, Search, Pin, ShieldCheck, CheckSquare, Edit, X, RefreshCw } from 'lucide-react';

interface DataMasterManagerProps {
  offices: Office[];
  nodes: TransportNode[];
  onAddOffice: (office: Office) => void;
  onToggleTransportNode: (node: TransportNode) => void;
  onUpdateNode: (node: TransportNode) => void;
}

export default function DataMasterManager({
  offices,
  nodes,
  onAddOffice,
  onToggleTransportNode,
  onUpdateNode
}: DataMasterManagerProps) {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Trigger registration form modal
  const [showAddOffice, setShowAddOffice] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newType, setNewType] = useState<OfficeType>('KC');
  const [newRegion, setNewRegion] = useState<string>('REG-02');
  const [addOfficeError, setAddOfficeError] = useState<string>('');

  // Transport Node config modal
  const [configuringOffice, setConfiguringOffice] = useState<Office | null>(null);
  const [nodeCategory, setNodeCategory] = useState<NodeCategory>('Regional Hub');
  const [parentNodeCode, setParentNodeCode] = useState<string>('');
  const [serviceArea, setServiceArea] = useState<string>('');

  const nodeCategories: NodeCategory[] = [
    'National Hub',
    'Regional Hub',
    'Local Hub',
    'Gateway',
    'Processing Center',
    'Distribution Center'
  ];

  const handleCreateOffice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) {
      setAddOfficeError('Semua field wajib diisi.');
      return;
    }
    if (offices.some((o) => o.office_code === newCode)) {
      setAddOfficeError(`Kode Kantor ${newCode} sudah terdaftar secara nasional.`);
      return;
    }

    onAddOffice({
      office_code: newCode,
      office_name: newName.toUpperCase(),
      office_type: newType,
      region_code: newRegion
    });

    // Reset Form
    setNewCode('');
    setNewName('');
    setAddOfficeError('');
    setShowAddOffice(false);
  };

  const handleEscalateToNode = (office: Office) => {
    // Check if configuration already exists or create new one
    const existing = nodes.find((n) => n.office_code === office.office_code);
    if (existing) {
      // Toggle off
      onToggleTransportNode({
        ...existing,
        is_transport_node: !existing.is_transport_node
      });
    } else {
      // Trigger config dialog
      setConfiguringOffice(office);
      const parentNodeOption = nodes.find(n => n.node_category === 'National Hub')?.office_code || '';
      setParentNodeCode(parentNodeOption);
      setServiceArea(`Layanan wilayah Kantor ${office.office_name}`);
    }
  };

  const handleSaveNodeConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringOffice) return;

    onToggleTransportNode({
      office_code: configuringOffice.office_code,
      is_transport_node: true,
      node_category: nodeCategory,
      parent_node_code: parentNodeCode || undefined,
      service_area: serviceArea,
      geographic_center: {
        lat: -7.0 + (Math.random() - 0.5) * 3, // mock random range within main islands
        lng: 110.0 + (Math.random() - 0.5) * 10
      }
    });

    setConfiguringOffice(null);
  };

  // Filter office listings
  const filteredOffices = offices.filter((o) => {
    const matchesSearch =
      o.office_code.includes(searchTerm) ||
      o.office_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'ALL' || o.office_type === selectedType;
    return matchesSearch && matchesType;
  });

  const getActiveNodeConfig = (code: string) => {
    return nodes.find((n) => n.office_code === code && n.is_transport_node);
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 w-full md:max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari Kantor Induk Nasional (Kode atau Nama)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-sm text-slate-850 placeholder-slate-400 rounded-lg focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Office Type Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-xs font-mono text-slate-400">Tipe Kantor:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-xs text-slate-850 border-none focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="ALL">Semua Jenis</option>
              <option value="KCU">KCU (Kantor Cabang Utama)</option>
              <option value="KC">KC (Kantor Cabang)</option>
              <option value="HUB">HUB (Logistics Hub)</option>
              <option value="SPP">SPP (Sentral Pengolahan Pos)</option>
              <option value="DC">DC (Distribution Center)</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddOffice(true)}
            className="flex items-center gap-1.5 bg-cyan-650 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Tambah Kantor Baru
          </button>
        </div>
      </div>

      {/* Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Office Master List table */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 p-4 border-b border-slate-150 flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">Daftar Kantor Pos Terdaftar</h4>
            <span className="text-xs text-slate-500 font-mono">
              Total: {filteredOffices.length} dari {offices.length} Kantor {filteredOffices.length > 25 ? `(Tampil 25 Teratas)` : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-550 font-mono border-b border-slate-200">
                  <th className="p-3">Kode Kantor</th>
                  <th className="p-3">Nama Kantor</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3 text-center">Fungsi Transport Node</th>
                  <th className="p-3 text-right">Aksi Aktivasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {filteredOffices.slice(0, 25).map((o) => {
                  const activeNodeConfig = getActiveNodeConfig(o.office_code);
                  const isNode = !!activeNodeConfig;

                  return (
                    <tr key={o.office_code} className="hover:bg-slate-50/60 transition duration-150">
                      <td className="p-3 font-mono text-cyan-800 font-bold">{o.office_code}</td>
                      <td className="p-3 font-semibold text-slate-800">{o.office_name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          o.office_type === 'KCU' ? 'bg-red-50 text-red-700 border-red-200' :
                          o.office_type === 'SPP' ? 'bg-orange-50 text-orange-705 border-orange-200' :
                          o.office_type === 'HUB' ? 'bg-cyan-50 text-cyan-705 border-cyan-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {o.office_type}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isNode ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-cyan-50 border border-cyan-200 text-cyan-800 rounded-full text-[10px] font-semibold">
                            <Pin className="w-3 h-3 rotate-45" /> {activeNodeConfig.node_category}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Bukan Transport Node</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleEscalateToNode(o)}
                          className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition ${
                            isNode
                              ? 'bg-red-50 hover:bg-red-100 border border-red-200 text-red-700'
                              : 'bg-cyan-50 hover:bg-cyan-100 border border-cyan-205 text-cyan-800'
                          }`}
                        >
                          {isNode ? 'Deaktivasi Node' : 'Escalate ke Node'}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredOffices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Tidak ditemukan kantor yang cocok dengan kueri pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subset Node Analytics panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Informasi Subset Node Transportasi</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Transport Node adalah kantor terpilih fungsional yang secara fisik dapat dilewati rute, memuat logistik, dan mengalokasikan slot etape transit.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase block font-mono">Kantor Nasional</span>
                <span className="text-lg font-bold text-slate-800 mt-1 block">{offices.length}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-cyan-600 block font-mono">Transport Nodes</span>
                <span className="text-lg font-bold text-cyan-705 mt-1 block">{nodes.filter(n=>n.is_transport_node).length}</span>
              </div>
            </div>

            {/* Hub configuration charts */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Sebaran Kategori Node Transportasi</span>
              <div className="space-y-3">
                {['National Hub', 'Regional Hub', 'Local Hub', 'Gateway'].map((cat) => {
                  const count = nodes.filter(n => n.node_category === cat && n.is_transport_node).length;
                  const percent = nodes.length ? (count / nodes.length) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-600 font-medium">{cat}</span>
                        <span className="text-slate-500 font-mono font-semibold">{count} node</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-600 rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Create Office Form */}
      {showAddOffice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-xl p-6 shadow-2xl relative space-y-4 animate-scaleUp">
            <button
              onClick={() => { setShowAddOffice(false); setAddOfficeError(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">Daftarkan Kantor Pos Baru</h3>
            <p className="text-xs text-slate-500">Menambahkan entri kantor baru ke Master Kantor Nasional Pos Indonesia.</p>

            {addOfficeError && (
              <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 text-xs rounded-lg font-mono">
                {addOfficeError}
              </div>
            )}

            <form onSubmit={handleCreateOffice} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Kode Kantor Pos (office_code):</label>
                <input
                   type="text"
                   maxLength={5}
                   value={newCode}
                   onChange={(e) => setNewCode(e.target.value.replace(/\D/g, ''))}
                   placeholder="Contoh: 40122"
                   className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 font-medium">Nama Kantor Pos (office_name):</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: KC KUNINGAN"
                  className="w-full bg-slate-50 border border-slate-205 py-2.5 px-3 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Jenis Kantor:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as OfficeType)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-0"
                  >
                    <option value="KCU">KCU</option>
                    <option value="KC">KC</option>
                    <option value="HUB">HUB</option>
                    <option value="SPP">SPP</option>
                    <option value="PUSAT">PUSAT</option>
                    <option value="REGIONAL">REGIONAL</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 font-medium">Wilayah Regional:</label>
                  <select
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-0 font-medium"
                  >
                    <option value="PUSAT">Kantor Pusat</option>
                    <option value="REGIONAL">Kantor Regional</option>
                    <option value="REG-01">Regional 1 Medan</option>
                    <option value="REG-02">Regional 2 Jakarta</option>
                    <option value="REG-03">Regional 3 Bandung</option>
                    <option value="REG-04">Regional 4 Semarang</option>
                    <option value="REG-05">Regional 5 Surabaya</option>
                    <option value="REG-06">Regional 6 Makassar</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition mt-4 text-xs font-mono shadow-sm"
              >
                Simpan Ke Master Kantor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Node Escalation details configuration */}
      {configuringOffice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-205 max-w-md w-full rounded-xl p-6 shadow-2xl relative space-y-4 animate-scaleUp">
            <button
              onClick={() => setConfiguringOffice(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">Konfigurasi Parameter Node</h3>
            <div className="text-xs text-slate-500">
              Konfigurasikan spesifikasi peran logistik untuk <strong className="text-cyan-800">{configuringOffice.office_name}</strong>.
            </div>

            <form onSubmit={handleSaveNodeConfig} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-550 font-medium">Kategori Node (Transport Category):</label>
                <select
                  value={nodeCategory}
                  onChange={(e) => setNodeCategory(e.target.value as NodeCategory)}
                  className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg text-slate-800 focus:outline-none"
                >
                  {nodeCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-550 font-medium">Parent Node (Atasan Rujukan):</label>
                <select
                  value={parentNodeCode}
                  onChange={(e) => setParentNodeCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg text-slate-800 focus:outline-none"
                >
                  <option value="">Tidak ada parent (Induk Utama)</option>
                  {nodes.filter(n=>n.is_transport_node).map((n) => (
                    <option key={n.office_code} value={n.office_code}>
                      [{n.office_code}] {offices.find(o=>o.office_code === n.office_code)?.office_name || n.office_code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-550 font-medium">Cakupan Wilayah (Service Area):</label>
                <textarea
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-lg text-slate-800 focus:outline-none focus:border-cyan-500 focus:bg-white"
                  placeholder="Contoh: Melayani area Jawa Barat III dan pesisir utara."
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-[11px] leading-relaxed text-slate-500">
                ⭐ <strong className="text-slate-700">Spasial Info:</strong> Lokasi GPS akan dipasang berbasis mapping pusat geografis kantor Pos Indonesia secara default.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition font-mono shadow-sm"
              >
                Aktifkan Sebagai Transport Node
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
