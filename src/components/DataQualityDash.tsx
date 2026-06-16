import React from 'react';
import { Route, Etape, Schedule, RouteCapacity, TransportNode, Office } from '../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, Info, RefreshCcw } from 'lucide-react';

interface DataQualityDashProps {
  routes: Route[];
  etapes: Etape[];
  schedules: Schedule[];
  capacities: RouteCapacity[];
  nodes: TransportNode[];
  offices: Office[];
}

export default function DataQualityDash({
  routes,
  etapes,
  schedules,
  capacities,
  nodes,
  offices
}: DataQualityDashProps) {
  
  const getOfficeName = (code: string) => {
    return (offices || []).find((o) => o.office_code === code)?.office_name || `ID ${code}`;
  };

  // 1. Routes without stops (Etape counts)
  const routesWithoutEtapes = routes.filter(
    (rt) => !etapes.some((e) => e.route_id === rt.id)
  );

  // 2. Routes without schedules (Timetable counts)
  const routesWithoutSchedules = routes.filter(
    (rt) => !schedules.some((s) => s.route_id === rt.id)
  );

  // 3. Routes without capacity matrices
  const routesWithoutCapacities = routes.filter(
    (rt) => !capacities.some((c) => c.route_id === rt.id)
  );

  // 4. Inactive Transport Nodes (is_active === false)
  const inactiveNodes = nodes.filter((n) => !n.is_transport_node);

  // 5. Expired routes (Expired Date < current local time 2026-06-12)
  const currentDateStr = '2026-06-12';
  const expiredRoutes = routes.filter(
    (rt) => rt.expired_date < currentDateStr
  );

  const totalIssues =
    routesWithoutEtapes.length +
    routesWithoutSchedules.length +
    routesWithoutCapacities.length +
    expiredRoutes.length;

  return (
    <div className="space-y-6 text-xs text-slate-705">
      {/* High level quality KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-mono">Daftar Rute Tanpa Etape</span>
            <span className={`text-lg font-bold mt-1 block ${routesWithoutEtapes.length > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
              {routesWithoutEtapes.length} rute
            </span>
          </div>
          <AlertTriangle className={`w-6 h-6 ${routesWithoutEtapes.length > 0 ? 'text-amber-500 animate-pulse' : 'text-slate-300'}`} />
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-mono">Rute Tanpa Jadwal</span>
            <span className={`text-lg font-bold mt-1 block ${routesWithoutSchedules.length > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
              {routesWithoutSchedules.length} rute
            </span>
          </div>
          <AlertTriangle className={`w-6 h-6 ${routesWithoutSchedules.length > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-mono">Rute Tanpa Kapasitas</span>
            <span className={`text-lg font-bold mt-1 block ${routesWithoutCapacities.length > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
              {routesWithoutCapacities.length} rute
            </span>
          </div>
          <AlertTriangle className={`w-6 h-6 ${routesWithoutCapacities.length > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block font-mono">Status Mutu Jaringan</span>
            <span className={`text-lg font-bold mt-1 block ${totalIssues > 0 ? 'text-red-600 font-extrabold' : 'text-emerald-600'}`}>
              {totalIssues > 0 ? 'Attention Required' : 'Excellent (100%)'}
            </span>
          </div>
          <ShieldCheck className={`w-6 h-6 ${totalIssues > 0 ? 'text-red-500 animate-bounce' : 'text-emerald-500'}`} />
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagnostic list */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Temuan Kerusakan Mutu (Rantai Etape &amp; Kapasitas)</h4>

          <div className="space-y-3 max-h-[350px] overflow-y-auto">
            {routesWithoutEtapes.map((r) => (
              <div key={r.id} className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3 shadow-inner">
                <AlertOctagon className="w-4 h-4 text-red-550 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900">Rute Tanpa TerminalTransit (Etape Kosong)</p>
                  <p className="text-[11px] text-red-800 mt-0.5">Rute <strong className="text-red-950 font-mono">{r.route_code} ({r.route_name})</strong> tidak didaftarkan etape transit. Manifest logistik gagal di-generate.</p>
                </div>
              </div>
            ))}

            {routesWithoutSchedules.map((r) => (
              <div key={r.id} className="bg-amber-50 p-4 rounded-lg border border-amber-250 border border-amber-200 flex items-start gap-3 shadow-inner">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">Tidak ada Jadwal Keberangkatan (Timetable)</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">Rute <strong className="text-amber-950 font-mono">{r.route_code} ({r.route_name})</strong> tidak memiliki jam terbang operasional terdaftar.</p>
                </div>
              </div>
            ))}

            {routesWithoutCapacities.map((r) => (
              <div key={r.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-start gap-3 shadow-inner">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800">Volume Muatan Kendaraan Nol (Missing Capacity Matric)</p>
                  <p className="text-[11px] text-slate-650 mt-0.5 text-slate-600">Rute <strong className="text-slate-800 font-mono">{r.route_code}</strong> tidak diberikan alokasi armada CDD/Fuso/Wingbox.</p>
                </div>
              </div>
            ))}

            {totalIssues === 0 && (
              <div className="text-center p-8 text-slate-400 italic font-mono bg-slate-50 rounded-lg border border-slate-200">Selamat, semua data rute dan kapasitas terhubung 100% sempurna tanpa temuan kepatuhan.</div>
            )}
          </div>
        </div>

        {/* Resolution Guide */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">Pencegahan Kerusakan Data (Enterprise Best Practices)</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Dalam pengolahan data logistik skala besar seperti Pos Indonesia, integritas relasi spasial sangat krusial. Sistem **N22POS** menerapkan perlindungan berlapis di sisi database:
            </p>
            <ul className="text-xs text-slate-600 pl-4 list-disc space-y-3 font-normal">
              <li>
                <strong className="text-slate-800">Referential Integrity Constraints:</strong> Kolom <code className="bg-slate-100 border border-slate-250 text-cyan-800 px-1 py-0.5 rounded font-mono">transport_node_code</code> diproteksi Foreign Key yang merujuk pada Master Kantor Nasional yang sah.
              </li>
              <li>
                <strong className="text-slate-800">Time-Overlap Prevention:</strong> Validasi lapis kedua (second-tier) mendeteksi tabrakan slot waktu transit etape pada satu gerbang yang sama.
              </li>
              <li>
                <strong className="text-slate-800">Draft Lock protection:</strong> Rute dengan temuan error "Rute tanpa Etape" sengaja dinonaktifkan dari Manifest Generator secara otomatis sebelum operator mereviewnya.
              </li>
            </ul>
          </div>

          <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200 flex items-center gap-2 text-cyan-800 font-semibold font-mono text-[10px] shadow-inner">
            <RefreshCcw className="w-4 h-4 animate-spin text-cyan-600" />
            <span>Diagnostic check: RUNNING REAL-TIME DATA INSPECTION</span>
          </div>
        </div>
      </div>
    </div>
  );
}
