import React, { useState } from 'react';
import { Route, Etape, Schedule, TransportNode, RouteCategory, TransportMode, FrequencyType, Office } from '../types';
import { ChevronRight, ChevronLeft, ArrowUp, ArrowDown, Trash2, Plus, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface RouteWizardProps {
  nodes: TransportNode[];
  routes: Route[];
  offices: Office[];
  onSaveRoute: (route: Route, etapes: Omit<Etape, 'id'>[], schedule: Omit<Schedule, 'id'>) => void;
}

export default function RouteWizard({ nodes, routes, offices, onSaveRoute }: RouteWizardProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [validated, setValidated] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Step 1: Info
  const [routeCode, setRouteCode] = useState<string>('POS-R-XXXX');
  const [routeName, setRouteName] = useState<string>('');
  const [routeCategory, setRouteCategory] = useState<RouteCategory>('Primer');
  const [transportMode, setTransportMode] = useState<TransportMode>('Darat');
  const [capacityKg, setCapacityKg] = useState<number>(10000);
  const [pricePerKg, setPricePerKg] = useState<number>(900);
  const [randomSuffix] = useState<number>(() => Math.floor(Math.random() * 9000 + 1000));

  // Step 2: Nodes
  const [originNode, setOriginNode] = useState<string>('');
  const [destinationNode, setDestinationNode] = useState<string>('');

  // Dynamically generate the official Route Code from settings
  React.useEffect(() => {
    const originPart = originNode ? originNode.toUpperCase() : 'ORG';
    const destPart = destinationNode ? destinationNode.toUpperCase() : 'DST';
    const modePart = transportMode === 'Darat' ? 'DRT' : transportMode === 'Udara' ? 'UDR' : 'LAU';
    const catPart = routeCategory === 'Primer' ? 'PRI' : routeCategory === 'Sekunder' ? 'SEK' : 'TER';
    setRouteCode(`POS-${modePart}-${catPart}-${originPart}${destPart}-${randomSuffix}`);
  }, [originNode, destinationNode, transportMode, routeCategory, randomSuffix]);

  // Step 3: Etapes (Transit points)
  const [transitEtapes, setTransitEtapes] = useState<{
    office_code: string;
    arr: string;
    dep: string;
  }[]>([]);
  const [selectedTransitNode, setSelectedTransitNode] = useState<string>('');

  // Step 4: Schedules
  const [departureTime, setDepartureTime] = useState<string>('08:00');
  const [arrivalTime, setArrivalTime] = useState<string>('20:00');
  const [frequency, setFrequency] = useState<FrequencyType>('Daily');
  const [operatingDays, setOperatingDays] = useState<string[]>(['Senin', 'Rabu', 'Jumat']);

  const getOfficeName = (code: string) => {
    return (offices || []).find((o) => o.office_code === code)?.office_name || `Kantor ${code}`;
  };

  const handleAddTransitNode = () => {
    if (!selectedTransitNode) return;
    if (selectedTransitNode === originNode || selectedTransitNode === destinationNode) {
      alert('Titik transit (etape) tidak boleh sama dengan Asal atau Tujuan.');
      return;
    }
    if (transitEtapes.some((e) => e.office_code === selectedTransitNode)) {
      alert('Titik transit ini sudah ditambahkan.');
      return;
    }

    setTransitEtapes([
      ...transitEtapes,
      { office_code: selectedTransitNode, arr: '12:00', dep: '13:00' }
    ]);
    setSelectedTransitNode('');
  };

  const handleRemoveTransit = (index: number) => {
    setTransitEtapes(transitEtapes.filter((_, idx) => idx !== index));
  };

  const handleMoveTransit = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === transitEtapes.length - 1) return;

    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    const copied = [...transitEtapes];
    // Swap
    const temp = copied[index];
    copied[index] = copied[targetIdx];
    copied[targetIdx] = temp;

    setTransitEtapes(copied);
  };

  const handleUpdateTransitTime = (index: number, field: 'arr' | 'dep', value: string) => {
    const copied = [...transitEtapes];
    copied[index] = { ...copied[index], [field]: value };
    setTransitEtapes(copied);
  };

  // Perform operational business validation checks (National guidelines)
  const validateProcess = () => {
    const errors: string[] = [];

    // Check Code Duplicate
    if (routes.some(r => r.route_code.trim().toUpperCase() === routeCode.trim().toUpperCase())) {
      errors.push(`Kode Rute "${routeCode}" sudah terdaftar secara nasional. Harap gunakan kode unik.`);
    }

    if (!routeName.trim()) {
      errors.push('Nama rute logistik tidak boleh kosong.');
    }

    if (!originNode || !destinationNode) {
      errors.push('Asal dan Tujuan wajib ditentukan.');
    }

    if (originNode === destinationNode) {
      errors.push('Asal dan Tujuan tidak boleh mengarah ke node yang sama.');
    }

    if (capacityKg <= 0) {
      errors.push('Kapasitas muat rute harus lebih besar dari 0 Kg.');
    }

    if (pricePerKg <= 0) {
      errors.push('Tarif kontrak rute (tarif per-kg) harus lebih besar dari Rp 0.');
    }

    // Check schedules
    if (!departureTime || !arrivalTime) {
      errors.push('Jadwal keberangkatan dan kedatangan wajib diisi.');
    }

    setValidationErrors(errors);
    setValidated(errors.length === 0);
    return errors.length === 0;
  };

  const handleNext = () => {
    if (currentStep === 4) {
      validateProcess();
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const executeSave = () => {
    if (!validated) return;

    // Package the transit points into proper Database sequence format
    const dbEtapes: Omit<Etape, 'id'>[] = [];
    
    // 1. Origin Stop (Seq 1)
    dbEtapes.push({
      route_id: '',
      sequence_no: 1,
      transport_node_code: originNode,
      estimated_arrival: 'Start',
      estimated_departure: departureTime
    });

    // 2. Intermediate Stops
    transitEtapes.forEach((et, idx) => {
      dbEtapes.push({
        route_id: '',
        sequence_no: idx + 2,
        transport_node_code: et.office_code,
        estimated_arrival: et.arr,
        estimated_departure: et.dep
      });
    });

    // 3. Destination Stop
    dbEtapes.push({
      route_id: '',
      sequence_no: transitEtapes.length + 2,
      transport_node_code: destinationNode,
      estimated_arrival: arrivalTime,
      estimated_departure: 'End'
    });

    // Package defaults schedules
    const dbSchedule: Omit<Schedule, 'id'> = {
      route_id: '',
      departure_time: departureTime,
      arrival_time: arrivalTime,
      frequency,
      operating_days: operatingDays,
      effective_date: new Date().toISOString().split('T')[0],
      expired_date: '2027-12-31'
    };

    const newRoute: Route = {
      id: `R_MOCK_${Math.floor(Math.random() * 8000 + 1000)}`,
      route_code: routeCode.trim().toUpperCase(),
      route_name: routeName.toUpperCase(),
      route_category: routeCategory,
      transport_mode: transportMode,
      origin_node: originNode,
      destination_node: destinationNode,
      effective_date: new Date().toISOString().split('T')[0],
      expired_date: '2027-12-31',
      status: 'Draft', // Default starting state for operators
      capacity_kg: capacityKg,
      price_per_kg: pricePerKg
    };

    onSaveRoute(newRoute, dbEtapes, dbSchedule);
    
    // Reset wizard
    setCurrentStep(6);
  };

  const toggleDay = (day: string) => {
    if (operatingDays.includes(day)) {
      setOperatingDays(operatingDays.filter(d => d !== day));
    } else {
      setOperatingDays([...operatingDays, day]);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-w-4xl mx-auto">
      {/* ProgressBar */}
      <div className="bg-slate-50 p-4 border-b border-slate-200">
        <div className="flex justify-between text-xs font-mono mb-2">
          {['Rute', 'Terminal', 'Titik Singgah', 'Jadwal', 'Review', 'Selesai'].map((stepName, idx) => (
            <div
              key={stepName}
              className={`${
                currentStep >= idx + 1 ? 'text-cyan-705 font-bold' : 'text-slate-450 text-slate-400'
              } flex items-center gap-1`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                currentStep === idx + 1 ? 'bg-cyan-50 border border-cyan-600 text-cyan-800 font-semibold' :
                currentStep > idx + 1 ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-100 border border-slate-200 text-slate-400'
              }`}>
                {idx + 1}
              </span>
              <span className="hidden md:inline">{stepName}</span>
            </div>
          ))}
        </div>
        <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-600 transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Wizard Content Steps panel */}
      <div className="p-6 min-h-[340px] text-xs">
        {/* Step 1: Informasi Rute */}
        {currentStep === 1 && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Step 1: Informasi Rute Pokok</h4>
              <p className="text-slate-500">Definisikan nomor registrasi rute dan jenis pergerakan angkutan.</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-slate-600 font-semibold text-xs font-mono">Kode Kontrak/Rute (Sistem Otomatis) :</label>
                <div className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-lg text-slate-700 font-mono font-bold flex items-center justify-between">
                  <span>{routeCode}</span>
                  <span className="text-[10px] bg-cyan-100 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded uppercase font-sans tracking-wide">
                    Otomatis
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic">Sandi rute logistik ini dibuat secara otomatis oleh sistem.</p>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold text-xs font-mono">Nama Rute Operasional :</label>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 uppercase focus:bg-white"
                  placeholder="Contoh: MERAK - BAKAUHENI TRANS-SUMATERA"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold text-xs font-mono">Kapasitas Muat Jaringan (Kg) :</label>
                  <input
                    type="number"
                    value={capacityKg}
                    onChange={(e) => setCapacityKg(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-cyan-500 focus:bg-white"
                    placeholder="Maksimal muatan armada (Kg)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold text-xs font-mono">Tarif Per Kg (Rupiah/Kg) :</label>
                  <input
                    type="number"
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-cyan-500 focus:bg-white"
                    placeholder="Contoh: 900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold text-xs font-mono">Kategori Distribusi :</label>
                  <select
                    value={routeCategory}
                    onChange={(e) => setRouteCategory(e.target.value as RouteCategory)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-slate-800 rounded-lg focus:outline-none focus:bg-white"
                  >
                    <option value="Primer">Primer</option>
                    <option value="Sekunder">Sekunder</option>
                    <option value="Tertier">Tertier</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold text-xs font-mono">Moda Transportasi :</label>
                  <select
                    value={transportMode}
                    onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-slate-800 rounded-lg focus:outline-none focus:bg-white"
                  >
                    <option value="Darat">🚚 Jalan Darat</option>
                    <option value="Udara">✈️ Cargo Udara</option>
                    <option value="Laut">🚢 Jalur Laut</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Asal & Tujuan */}
        {currentStep === 2 && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Step 2: Menentukan Asal dan Tujuan Rute</h4>
              <p className="text-slate-500 font-normal">Pilih node asal awal and terminal akhir pengantaran dalam subset Transport Node.</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-slate-600 font-semibold text-xs font-mono">🎯 Transport Node Asal (Origin) :</label>
                <SearchableSelect
                  options={nodes.filter(n => n.is_transport_node).map((n) => ({
                    value: n.office_code,
                    label: `[${n.office_code}] ${getOfficeName(n.office_code)} (${n.node_category})`
                  }))}
                  value={originNode}
                  onChange={setOriginNode}
                  placeholder="Cari dan pilih Node Asal..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold text-xs font-mono">🏁 Transport Node Tujuan (Destination) :</label>
                <SearchableSelect
                  options={nodes.filter(n => n.is_transport_node).map((n) => ({
                    value: n.office_code,
                    label: `[${n.office_code}] ${getOfficeName(n.office_code)} (${n.node_category})`
                  }))}
                  value={destinationNode}
                  onChange={setDestinationNode}
                  placeholder="Cari dan pilih Node Tujuan..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Titik Transit Etape */}
        {currentStep === 3 && (
          <div className="space-y-4 max-w-xl mx-auto">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Step 3: Atur Urutan Pos Transit (Etape Pengiriman)</h4>
              <p className="text-slate-500">
                Gunakan bahasa logistik sederhana. Urutkan titik singgah berdasarkan jalur lintas sebenarnya.
              </p>
            </div>

            {/* Sequence map visualizer bar */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <span className="px-2 py-0.5 bg-cyan-50 text-cyan-800 border border-cyan-205 rounded text-[10px]">Asal</span>
                <span className="text-slate-800">{originNode ? getOfficeName(originNode) : '[Asal belum dipilih]'}</span>
              </div>

              {/* Transit list */}
              <div className="space-y-2 border-l-2 border-dashed border-slate-200 pl-4 py-1">
                {transitEtapes.map((et, idx) => (
                  <div key={et.office_code} className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-bold text-slate-755">
                        <span className="text-cyan-705 font-mono">Etape #{idx + 1}</span>
                        <span>{getOfficeName(et.office_code)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-150 px-2 py-1 rounded">
                          <span className="text-[10px] text-slate-450">ETA:</span>
                          <input
                            type="text"
                            value={et.arr}
                            onChange={(e) => handleUpdateTransitTime(idx, 'arr', e.target.value)}
                            className="bg-transparent border-none text-slate-800 w-full focus:ring-0 focus:outline-none p-0 font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-150 px-2 py-1 rounded">
                          <span className="text-[10px] text-slate-450">ETD:</span>
                          <input
                            type="text"
                            value={et.dep}
                            onChange={(e) => handleUpdateTransitTime(idx, 'dep', e.target.value)}
                            className="bg-transparent border-none text-slate-800 w-full focus:ring-0 focus:outline-none p-0 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Order buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleMoveTransit(idx, 'UP')}
                        disabled={idx === 0}
                        className="p-1 bg-slate-50 border border-slate-200 rounded hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:text-slate-500 transition"
                        title="Geser Naik"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveTransit(idx, 'DOWN')}
                        disabled={idx === transitEtapes.length - 1}
                        className="p-1 bg-slate-50 border border-slate-200 rounded hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:text-slate-500 transition"
                        title="Geser Turun"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveTransit(idx)}
                        className="p-1 bg-red-50 border border-red-200 rounded text-red-700 hover:bg-red-100 transition"
                        title="Hapus Transit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {transitEtapes.length === 0 && (
                  <p className="text-slate-400 italic py-2 text-left">Belum ada titik transit/singgah. Rute bersifat Point-to-Point langsung.</p>
                )}
              </div>

              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px]">Tujuan</span>
                <span className="text-slate-800">{destinationNode ? getOfficeName(destinationNode) : '[Tujuan belum dipilih]'}</span>
              </div>
            </div>

            {/* Selector to append stops */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center gap-3">
              <div className="flex-1">
                <SearchableSelect
                  options={nodes.filter(n => n.is_transport_node && n.office_code !== originNode && n.office_code !== destinationNode).map((n) => ({
                    value: n.office_code,
                    label: `[${n.office_code}] ${getOfficeName(n.office_code)}`
                  }))}
                  value={selectedTransitNode}
                  onChange={setSelectedTransitNode}
                  placeholder="Cari & Pilih Kantor Transit Singgah..."
                />
              </div>
              <button
                onClick={handleAddTransitNode}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm transition text-xs shrink-0"
              >
                <Plus className="w-4 h-4" /> Tambah Pos
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Penjadwalan */}
        {currentStep === 4 && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Step 4: Atur Penjadwalan Armada &amp; Frekuensi</h4>
              <p className="text-slate-500">Rencanakan kapan armada keberangkatan beroperasi.</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold text-xs font-mono">Waktu Berangkat (Asal) :</label>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-slate-850 rounded-lg font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-semibold text-xs font-mono">Estimasi Tiba (Tujuan) :</label>
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-slate-850 rounded-lg font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-semibold text-xs font-mono">Frekuensi Operasional :</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-slate-850 rounded-lg focus:outline-none"
                >
                  <option value="Daily">Daily (Setiap Hari)</option>
                  <option value="Weekly">Weekly (Mingguan Terpilih)</option>
                  <option value="Custom">Custom Angkutan Khusus</option>
                </select>
              </div>

              {frequency === 'Weekly' && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-slate-650 font-bold block mb-1">Pilih Hari Aktif :</label>
                  <div className="flex flex-wrap gap-2">
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => {
                      const isActive = operatingDays.includes(day);
                      return (
                        <button
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold select-none transition ${
                            isActive
                              ? 'bg-cyan-100 border-cyan-400 text-cyan-800'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Review & Validasi */}
        {currentStep === 5 && (
          <div className="space-y-4 max-w-xl mx-auto">
            <div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Step 5: Verifikasi Aturan &amp; Review Draft Jaringan</h4>
              <p className="text-slate-500">
                Sistem melakukan peninjauan kepatuhan standardisasi logistik Pos Indonesia secara otomatis sebelum disimpan.
              </p>
            </div>

            {validated ? (
              <div className="bg-emerald-550/40 bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-3 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-emerald-950 text-xs uppercase font-mono">Hasil Penilaian: VALIDASI LOLOS</h5>
                  <p className="text-[11px] mt-1 text-slate-650 leading-relaxed font-normal">
                    Seluruh aturan rute terpenuhi. Kode unik rute terverifikasi, sequence etape terurut rapi, dan relasi multi-transit tidak tumpang tindih. Rute siap disimpan dengan status awal <strong className="text-cyan-800">Draft</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-amber-950 text-xs uppercase font-mono">Pemberitahuan/Kesalahan Validasi</h5>
                  <p className="text-[11px] mt-1 text-slate-650 leading-relaxed font-normal mb-2">
                    Harap selesaikan peringatan kepatuhan sebelum menyimpan data:
                  </p>
                  <ul className="text-[11px] text-amber-700 font-mono list-disc pl-4 space-y-1">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {validationErrors.length === 0 && (
                      <li>Klik verifikasi untuk menjamin kepatuhan data.</li>
                    )}
                  </ul>
                  <button
                    onClick={validateProcess}
                    className="mt-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-sm transition"
                  >
                    Jalankan Validasi Ulang
                  </button>
                </div>
              </div>
            )}

            {/* Review Card */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Ringkasan Konfigurasi Rute</span>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-slate-700">
                <div>
                  <span className="text-slate-400 block font-mono text-[10px]">Kode Rute:</span>
                  <span className="font-mono text-cyan-800 font-bold">{routeCode.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[10px]">Nama Rute:</span>
                  <span className="font-bold text-slate-900 uppercase">{routeName || 'BELUM DIISI'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[10px]">Kategori / Moda:</span>
                  <span className="font-semibold text-slate-800">{routeCategory} ({transportMode})</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[10px]">Jadwal Keberangkatan:</span>
                  <span className="font-mono text-slate-800">{departureTime} s.d. {arrivalTime} ({frequency})</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[10px]">Kapasitas Muat:</span>
                  <span className="font-bold text-slate-800 font-mono">{capacityKg.toLocaleString('id-ID')} Kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[10px]">Tarif Rute:</span>
                  <span className="font-bold text-orange-600 font-mono">Rp {pricePerKg.toLocaleString('id-ID')} / Kg</span>
                </div>
              </div>

              {/* Transit Sequence visualizer */}
              <div className="pt-2">
                <span className="text-slate-400 block text-[10px] uppercase font-mono mb-1.5">Alur Rantai Pengantaran:</span>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-cyan-800 font-bold">{originNode ? getOfficeName(originNode) : '[Belum]'}</span>
                  {transitEtapes.map(et => (
                    <React.Fragment key={et.office_code}>
                      <span className="text-slate-400">→</span>
                      <span className="text-slate-700">{getOfficeName(et.office_code)}</span>
                    </React.Fragment>
                  ))}
                  <span className="text-slate-400">→</span>
                  <span className="text-emerald-700 font-bold">{destinationNode ? getOfficeName(destinationNode) : '[Belum]'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Selesai */}
        {currentStep === 6 && (
          <div className="space-y-4 max-w-md mx-auto text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-600 mx-auto animate-bounce mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-slate-905 text-slate-900 mb-2">Simpan/Usulan Rute Berhasil Diajukan!</h4>
              <p className="text-slate-500 leading-relaxed font-normal mb-6">
                Rute logistik baru Anda telah terdaftar dalam sistem dengan status <strong className="text-cyan-705 text-cyan-800 font-bold">Draft</strong>. Regional Admin akan meninjau kelayakan operasional kargo ini secepatnya.
              </p>
              
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setRouteName('');
                  setCapacityKg(10000);
                  setPricePerKg(900);
                  setTransitEtapes([]);
                  setValidated(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-705 font-semibold transition text-xs rounded-lg shadow-sm text-slate-700"
              >
                Buat Rute Lainnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer controls */}
      {currentStep < 6 && (
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg shadow-sm transition flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali
          </button>

          {currentStep === 5 ? (
            <button
              onClick={executeSave}
              disabled={!validated}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition font-mono flex items-center gap-1.5 shadow-sm"
            >
              Simpan &amp; Hubungkan Rute
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && (!routeCode.substring(3).trim() || !routeName)) ||
                (currentStep === 2 && (!originNode || !destinationNode || (originNode === destinationNode)))
              }
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1"
            >
              Lanjutkan <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
