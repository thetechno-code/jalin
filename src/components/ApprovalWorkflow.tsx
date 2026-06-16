import React from 'react';
import { Route, WorkflowStatus, UserRole, Office } from '../types';
import { Shield, CheckCircle, RefreshCw, Send, Lock, Ban, Eye } from 'lucide-react';

interface ApprovalWorkflowProps {
  routes: Route[];
  offices: Office[];
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onUpdateStatus: (routeId: string, nextStatus: WorkflowStatus, actor: string) => void;
}

export default function ApprovalWorkflow({
  routes,
  offices,
  currentRole,
  onChangeRole,
  onUpdateStatus
}: ApprovalWorkflowProps) {
  const getOfficeName = (code: string) => {
    return (offices || []).find((o) => o.office_code === code)?.office_name || `ID ${code}`;
  };

  const roles: UserRole[] = [
    'Operator Hub',
    'Regional Admin',
    'Super Admin Nasional',
    'Viewer',
    'Auditor'
  ];

  // Helper to determine what workflow actions this current role can perform
  const canPerformAction = (status: WorkflowStatus, nextStatus: WorkflowStatus) => {
    if (currentRole === 'Super Admin Nasional') return true;
    if (currentRole === 'Regional Admin') {
      // Regional can review submitted items, or reject them
      return (status === 'Submitted' && nextStatus === 'Reviewed') || (status === 'Submitted' && nextStatus === 'Rejected');
    }
    if (currentRole === 'Operator Hub') {
      // Operator can submit draft items
      return (status === 'Draft' && nextStatus === 'Submitted') || (status === 'Rejected' && nextStatus === 'Draft');
    }
    return false;
  };

  const getStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case 'Published': return 'bg-green-100 text-green-800 border border-green-200';
      case 'Approved': return 'bg-cyan-100 text-cyan-800 border border-cyan-200';
      case 'Reviewed': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'Submitted': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Rejected': return 'bg-red-100 text-red-855 border border-red-200 text-red-700';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  return (
    <div className="space-y-6 text-xs text-slate-805">
      {/* Role Switcher banner */}
      <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 p-4 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-50 text-cyan-800 border border-cyan-200 rounded-lg">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Security &amp; Governance Center</h4>
            <p className="text-[11px] text-slate-500 font-mono">Beralih peran (Role Management) untuk menguji persetujuan alur kerja nasional.</p>
          </div>
        </div>

        {/* Radio switches */}
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => onChangeRole(r)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold select-none transition shadow-sm ${
                currentRole === r
                  ? 'bg-cyan-600 text-white font-bold border-cyan-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              👤 {r}
            </button>
          ))}
        </div>
      </div>

      {/* Grid status columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Operator Draft/Submitted Block */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono border-b border-slate-200 pb-2">
            ✏️ Usulan &amp; Draft Baru ({routes.filter(r => r.status === 'Draft' || r.status === 'Submitted' || r.status === 'Rejected').length})
          </h4>

          <div className="space-y-3">
            {routes
              .filter((r) => r.status === 'Draft' || r.status === 'Submitted' || r.status === 'Rejected')
              .map((rt) => (
                <div key={rt.id} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-cyan-800 font-bold">{rt.route_code}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getStatusBadge(rt.status)}`}>
                      {rt.status}
                    </span>
                  </div>

                  <div>
                     <h5 className="font-bold text-slate-800 uppercase">{rt.route_code}: {rt.route_name}</h5>
                     <p className="text-[10px] text-slate-500 mt-0.5">{getOfficeName(rt.origin_node)} s.d {getOfficeName(rt.destination_node)}</p>
                     <div className="mt-2 grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded border border-slate-150 font-mono text-[9px] text-slate-500">
                       <div>📦 Cap: <span className="font-bold text-slate-700">{(rt.capacity_kg ?? 10000).toLocaleString('id-ID')} Kg</span></div>
                       <div>💰 Tarif: <span className="font-bold text-orange-600">Rp {(rt.price_per_kg ?? 900).toLocaleString('id-ID')}/Kg</span></div>
                     </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-2 pt-1.5 border-t border-slate-100">
                    {rt.status === 'Draft' && canPerformAction(rt.status, 'Submitted') ? (
                      <button
                        onClick={() => onUpdateStatus(rt.id, 'Submitted', `${currentRole} Actor`)}
                        className="flex-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 shadow-sm transition"
                      >
                        <Send className="w-3 h-3" /> Ajukan Ke Regional
                      </button>
                    ) : rt.status === 'Rejected' && canPerformAction(rt.status, 'Draft') ? (
                      <button
                        onClick={() => onUpdateStatus(rt.id, 'Draft', `${currentRole} Actor`)}
                        className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold rounded-lg text-[10px] transition"
                      >
                        Reset ke Draft
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic flex items-center gap-1 font-mono">
                        <Lock className="w-3 h-3" /> Terkunci (Butuh operator Hub)
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Column 2: Regional Review Gate */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono border-b border-slate-200 pb-2">
            🔍 Peninjauan Regional ({routes.filter(r => r.status === 'Reviewed').length})
          </h4>

          <div className="space-y-3">
            {routes
              .filter((r) => r.status === 'Submitted' || r.status === 'Reviewed')
              .map((rt) => (
                <div key={rt.id} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-cyan-800 font-bold">{rt.route_code}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getStatusBadge(rt.status)}`}>
                      {rt.status}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-800 uppercase">{rt.route_code}: {rt.route_name}</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">{getOfficeName(rt.origin_node)} s.d {getOfficeName(rt.destination_node)}</p>
                    <div className="mt-2 grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded border border-slate-150 font-mono text-[9px] text-slate-500">
                      <div>📦 Cap: <span className="font-bold text-slate-700">{(rt.capacity_kg ?? 10000).toLocaleString('id-ID')} Kg</span></div>
                      <div>💰 Tarif: <span className="font-bold text-orange-600">Rp {(rt.price_per_kg ?? 950).toLocaleString('id-ID')}/Kg</span></div>
                    </div>
                  </div>

                  {/* Regional actions */}
                  <div className="flex gap-2 pt-1.5 border-t border-slate-100">
                    {rt.status === 'Submitted' && canPerformAction(rt.status, 'Reviewed') ? (
                      <>
                        <button
                          onClick={() => onUpdateStatus(rt.id, 'Reviewed', `${currentRole} Reviewer`)}
                          className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] shadow-sm transition"
                        >
                          Loloskan Review
                        </button>
                        <button
                          onClick={() => onUpdateStatus(rt.id, 'Rejected', `${currentRole} Auditor`)}
                          className="py-1.5 px-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-[10px] font-semibold transition"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic flex items-center gap-1 font-mono">
                        <Lock className="w-3 h-3" /> Tertahan (Butuh Regional Admin)
                      </span>
                    )}
                  </div>
                </div>
              ))}

            {routes.filter(r=>r.status === 'Reviewed').length === 0 && (
              <p className="text-center text-slate-400 italic py-4 font-mono">Belum ada rute dalam antrian review wilayah.</p>
            )}
          </div>
        </div>

        {/* Column 3: National Approval & Publish */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono border-b border-slate-200 pb-2">
            👑 Otorisasi &amp; Publikasi ({routes.filter(r => r.status === 'Approved' || r.status === 'Published').length})
          </h4>

          <div className="space-y-3">
            {routes
              .filter((r) => r.status === 'Reviewed' || r.status === 'Approved' || r.status === 'Published')
              .map((rt) => (
                <div key={rt.id} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-cyan-800 font-bold">{rt.route_code}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getStatusBadge(rt.status)}`}>
                      {rt.status}
                    </span>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-800 uppercase">{rt.route_code}: {rt.route_name}</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">{getOfficeName(rt.origin_node)} s.d {getOfficeName(rt.destination_node)}</p>
                    <div className="mt-2 grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded border border-slate-150 font-mono text-[9px] text-slate-500">
                      <div>📦 Cap: <span className="font-bold text-slate-700">{(rt.capacity_kg ?? 10000).toLocaleString('id-ID')} Kg</span></div>
                      <div>💰 Tarif: <span className="font-bold text-orange-600">Rp {(rt.price_per_kg ?? 950).toLocaleString('id-ID')}/Kg</span></div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1.5 border-t border-slate-100">
                    {rt.status === 'Reviewed' && canPerformAction(rt.status, 'Approved') ? (
                      <button
                        onClick={() => onUpdateStatus(rt.id, 'Approved', `${currentRole} Operator`)}
                        className="flex-1 py-1.5 px-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-[10px] shadow-sm transition"
                      >
                        Beri Approval (Setuju)
                      </button>
                    ) : rt.status === 'Approved' && canPerformAction(rt.status, 'Published') ? (
                      <button
                        onClick={() => onUpdateStatus(rt.id, 'Published', `${currentRole} Publisher`)}
                        className="flex-1 py-1 px-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 shadow-sm transition"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Publish Rute Nasional
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic flex items-center gap-1 font-mono">
                        <Lock className="w-3 h-3" /> Pasif (Rute Aktif &amp; Berjalan)
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
}
