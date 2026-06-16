import React, { useState } from 'react';
import { Route, Schedule, RouteCapacity, VehicleType, Office, Vendor, Fleet } from '../types';
import { INITIAL_VEHICLE_TYPES } from '../data/mockData';
import { Calendar, Truck, Layers, ChevronRight, Save, Clock, Trash2, Plus, AlertCircle } from 'lucide-react';

interface CapacitySchedulerProps {
  routes: Route[];
  schedules: Schedule[];
  capacities: RouteCapacity[];
  offices: Office[];
  vendors: Vendor[];
  fleets: Fleet[];
  onSaveSchedule: (schedule: Schedule) => void;
  onAllocateCapacity: (routeId: string, vehicleCode: string) => void;
  onDeleteCapacity: (capacityId: string) => void;
}

export default function CapacityScheduler({
  routes,
  schedules,
  capacities,
  offices,
  vendors,
  fleets,
  onSaveSchedule,
  onAllocateCapacity,
  onDeleteCapacity
}: CapacitySchedulerProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');
  
  // Schedule state
  const [depTime, setDepTime] = useState<string>('08:00');
  const [arrTime, setArrTime] = useState<string>('18:00');
  const [selectedFreq, setSelectedFreq] = useState<'Daily' | 'Weekly'>('Daily');

  // Vendor & Fleet allocation selection
  const [selectedVendorId, setSelectedVendorId] = useState<string>(vendors[0]?.id || 'V001');
  const [selectedFleetId, setSelectedFleetId] = useState<string>('');

  const getOfficeName = (code: string) => {
    return (offices || []).find((o) => o.office_code === code)?.office_name || `ID ${code}`;
  };

  const activeRoute = routes.find(r => r.id === selectedRouteId);
  const activeSchedules = schedules.filter(s => s.route_id === selectedRouteId);
  const activeCapacities = capacities.filter(c => c.route_id === selectedRouteId);

  // Filter fleets belonging to the selected vendor
  const vendorFleets = fleets.filter(f => f.vendor_id === selectedVendorId);

  // Helper helper to resolve fleet's vehicle code based on its parameters
  const getVehicleCodeFromFleetName = (fleet: Fleet): string => {
    const name = (fleet.vehicle_name || '').toLowerCase();
    if (name.includes('wingbox') || fleet.max_weight >= 18000) return 'WBOX';
    if (name.includes('fuso') || fleet.max_weight >= 8000) return 'FUSO';
    if (name.includes('737') || fleet.vehicle_mode === 'Udara') return 'PCARGO';
    if (name.includes('pelni') || fleet.vehicle_mode === 'Laut') return 'KCARGO';
    return 'CDD'; // standard CDD default fallback
  };

  const handlePushSchedule = () => {
    if (!selectedRouteId) return;
    const newSchedule: Schedule = {
      id: `S_MOCK_${Math.floor(Math.random() * 900 + 100)}`,
      route_id: selectedRouteId,
      departure_time: depTime,
      arrival_time: arrTime,
      frequency: selectedFreq,
      operating_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
      effective_date: '2026-06-12',
      expired_date: '2027-12-31'
    };
    onSaveSchedule(newSchedule);
  };

  const handleAddCapacity = () => {
    if (!selectedRouteId) return;

    // Resolve the active selected fleet
    const targetFleetId = selectedFleetId || vendorFleets[0]?.id;
    if (!targetFleetId) {
      alert('Pilih armada kendaraan vendor yang ingin dialokasikan terlebih dahulu.');
      return;
    }

    const fleet = fleets.find(f => f.id === targetFleetId);
    if (!fleet) {
      alert('Armada tidak valid.');
      return;
    }

    const resolvedCode = getVehicleCodeFromFleetName(fleet);
    onAllocateCapacity(selectedRouteId, resolvedCode);
  };

  const getVehicleName = (code: string) => {
    return INITIAL_VEHICLE_TYPES.find(v => v.vehicle_code === code)?.vehicle_name || code;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs text-slate-700">
      {/* Route Selector sidebar */}
      <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-200 pb-2">
          <Layers className="w-4 h-4 text-cyan-600" />
          <span>Pilih Koridor Angkutan</span>
        </h4>

        <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
          {routes.map((rt) => (
            <button
              key={rt.id}
              onClick={() => setSelectedRouteId(rt.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all text-xs shadow-sm ${
                selectedRouteId === rt.id
                  ? 'bg-[#1C2D5A]/5 border-[#1C2D5A] text-cyan-900 font-medium'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
               }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-cyan-850 font-bold">{rt.route_code}</span>
                <span className={`text-[8px] font-mono px-1.5 rounded font-bold ${
                  rt.transport_mode === 'Udara' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  rt.transport_mode === 'Laut' ? 'bg-teal-100 text-teal-800 border border-teal-200' :
                  'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {rt.transport_mode}
                </span>
              </div>
              <h5 className="font-bold text-slate-800 uppercase truncate mt-1 text-[11px]">{rt.route_code}: {rt.route_name}</h5>
              <div className="text-[10px] text-slate-500 mt-1 truncate">
                {getOfficeName(rt.origin_node)} → {getOfficeName(rt.destination_node)}
              </div>
              <div className="text-[9px] text-slate-500 mt-1.5 flex gap-2 font-mono bg-slate-50 border border-slate-100 p-1 py-0.5 rounded">
                <span className="text-slate-600 font-bold">📦 {(rt.capacity_kg ?? 10000).toLocaleString('id-ID')} Kg</span>
                <span className="text-slate-400">|</span>
                <span className="text-orange-600 font-bold">Rp {(rt.price_per_kg ?? 900).toLocaleString('id-ID')}/Kg</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Scheduler and capacity panels */}
      <div className="lg:col-span-8 space-y-6">
        {activeRoute ? (
          <>
            {/* 1. Schedule Timetable Planner */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <Calendar className="w-5 h-5 text-cyan-600" />
                <span>Pengaturan Jadwal Keberangkatan (Timetable)</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px] uppercase font-mono">Keberangkatan:</label>
                  <input
                    type="time"
                    value={depTime}
                    onChange={(e) => setDepTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2 text-slate-900 font-mono rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px] uppercase font-mono">Kedatangan:</label>
                  <input
                    type="time"
                    value={arrTime}
                    onChange={(e) => setArrTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2 text-slate-900 font-mono rounded"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-500 text-[10px]/[1px] uppercase font-mono">Frekuensi:</label>
                  <select
                    value={selectedFreq}
                    onChange={(e) => setSelectedFreq(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 p-2 text-slate-900 rounded"
                  >
                    <option value="Daily">Daily (Setiap Hari)</option>
                    <option value="Weekly">Weekly (Mingguan)</option>
                  </select>
                </div>

                <button
                  onClick={handlePushSchedule}
                  className="w-full py-2 bg-[#1C2D5A] hover:bg-[#1C2D5A]/90 text-white font-bold rounded-lg shadow-sm transition font-mono flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" /> Tambah Jadwal
                </button>
              </div>

              {/* Current Timetable listings */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold font-mono">Jadwal Terdaftar pada Rute</span>
                <div className="space-y-2">
                  {activeSchedules.map((s, idx) => (
                    <div key={s.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-4">
                        <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] text-[#1C2D5A] font-bold font-mono shadow-sm">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-800 text-sm font-mono">{s.departure_time} s.d. {s.arrival_time}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Frekuensi: {s.frequency} | Masa Aktif s.d 31 Des 2026</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 border border-green-200 rounded font-mono text-[9px] font-bold">ACTIVE</span>
                      </div>
                    </div>
                  ))}

                  {activeSchedules.length === 0 && (
                    <div className="text-center p-6 text-slate-400 italic bg-slate-50 border border-slate-200 rounded-lg font-mono">
                      Rute ini belum memiliki running schedule. Cargo tidak dapat ditiadakan sebelum dijadwalkan.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Vehicles / Weight Cargo Capacity allotment based on Vendors' Registered Fleets */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <Truck className="w-5 h-5 text-cyan-600" />
                <span>Alokasi Kapasitas &amp; Jenis Armada Angkutan</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner">
                {/* 1. Vendor select bar */}
                <div className="md:col-span-5 space-y-1 text-left">
                  <label className="text-slate-500 text-[10px] uppercase font-mono font-bold">Pilih Kontrak Vendor:</label>
                  <select
                    value={selectedVendorId}
                    onChange={(e) => {
                      setSelectedVendorId(e.target.value);
                      const fList = fleets.filter(f => f.vendor_id === e.target.value);
                      setSelectedFleetId(fList[0]?.id || '');
                    }}
                    className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded font-bold"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.vendor_name} ({v.vendor_code})</option>
                    ))}
                  </select>
                </div>

                {/* 2. Fleets selection nested filtered by vendor */}
                <div className="md:col-span-5 space-y-1 text-left">
                  <label className="text-slate-500 text-[10px] uppercase font-mono font-bold">Pilih Kargo Vendor Fleet:</label>
                  <select
                    value={selectedFleetId}
                    onChange={(e) => setSelectedFleetId(e.target.value)}
                    className="w-full bg-white border border-slate-300 p-2 text-slate-900 rounded font-mono font-medium"
                  >
                    {vendorFleets.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.license_plate} - {f.vehicle_name} (Max: {(f.max_weight/1000).toFixed(1)} T)
                      </option>
                    ))}
                    {vendorFleets.length === 0 && (
                      <option value="">-- No fleets registered for vendor --</option>
                    )}
                  </select>
                </div>

                {/* 3. Execute Allocation Trigger */}
                <button
                  onClick={handleAddCapacity}
                  className="w-full md:col-span-2 py-2 bg-[#1C2D5A] hover:bg-[#1C2D5A]/95 text-white font-bold rounded-lg shadow transition font-mono flex items-center justify-center gap-1.5 cursor-pointer h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" /> Alokasikan
                </button>
              </div>

              {vendorFleets.length === 0 && (
                <div className="px-3 py-2 bg-amber-50 border border-amber-250 border-dashed rounded-lg text-amber-800 text-[10.5px] leading-relaxed flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Vendor terpilih belum memiliki unit kendaraan di modul armada. Daftarkan di Master Data Vendor terlebih dahulu.</span>
                </div>
              )}

              {/* Dynamic Matrix of allocated vessels/trucks */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block mb-2">Matrix Alokasi Sisa Muatan Armada</span>

                <div className="space-y-4">
                  {activeCapacities.map((c) => {
                    const weightCap = c.max_weight || 10000;
                    const volumeCap = c.max_volume || 20;

                    return (
                      <div key={c.id} className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3 shadow-sm relative">
                        {/* Allocation top items with Delete buttons */}
                        <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                          <div>
                            <h6 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>{getVehicleName(c.vehicle_code)}</span>
                            </h6>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-1.5 py-0.5 bg-cyan-55 bg-cyan-100 border border-cyan-200 text-cyan-800 rounded font-mono text-[9px] font-extrabold uppercase">
                              {c.vehicle_code}
                            </span>
                            
                            {/* Delete Button for Capacity Allocation */}
                            <button
                              onClick={() => onDeleteCapacity(c.id)}
                              className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded transition duration-150 cursor-pointer"
                              title="Hapus / Hentikan Alokasi Armada"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Weight capacity graph */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-600 font-medium">Reserved Cargo Weight: <strong>{c.reserved_capacity}%</strong></span>
                            <span className="text-slate-600 font-mono">Kapasitas Maksimal: <strong>{weightCap.toLocaleString()} kg</strong></span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                            <div className="h-full bg-amber-500" style={{ width: `${c.reserved_capacity}%` }}></div>
                            <div className="h-full bg-cyan-500" style={{ width: `${c.available_capacity}%` }}></div>
                          </div>
                        </div>

                        {/* Volume capacity graph */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-600 font-medium">Kubikasi Box Tersedia: <strong>{c.available_capacity}%</strong></span>
                            <span className="text-slate-600 font-mono font-mono">Volume Maksimal: <strong>{volumeCap.toLocaleString()} m³</strong></span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                            <div className="h-full bg-amber-500" style={{ width: `${100 - c.available_capacity}%` }}></div>
                            <div className="h-full bg-cyan-500" style={{ width: `${c.available_capacity}%` }}></div>
                          </div>
                        </div>

                        {/* Legends color code */}
                        <div className="flex gap-4 text-[9px] text-slate-500 pt-1">
                          <div className="flex items-center gap-1 font-mono">
                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                            <span>Di-booking Manifest</span>
                          </div>
                          <div className="flex items-center gap-1 font-mono flex-auto">
                            <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                            <span>Menunggu Booking Slot (Sisa Space)</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {activeCapacities.length === 0 && (
                    <div className="text-center p-6 text-slate-400 italic bg-slate-50 border border-slate-200 rounded-lg font-mono border-dashed">
                      Rute ini belum diberikan alokasi armada aktif atau tidak ada armada vendor yang teralokasikan.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-500 italic">Pilih salah satu koridor angkutan di navigasi kiri terlebih dahulu.</div>
        )}
      </div>
    </div>
  );
}
