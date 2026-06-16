import React, { useState } from 'react';
import { ExcelRow, Route, Etape, Schedule, TransportNode, Office } from '../types';
import { Download, UploadCloud, AlertTriangle, CheckSquare, RotateCcw, AlertOctagon, HelpCircle } from 'lucide-react';

interface ExcelUploadSimulatorProps {
  nodes: TransportNode[];
  routes: Route[];
  etapes: Etape[];
  offices: Office[];
  onImportBulk: (importedRoutes: Route[], importedEtapes: Etape[]) => void;
}

export default function ExcelUploadSimulator({ nodes, routes, etapes, offices, onImportBulk }: ExcelUploadSimulatorProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [importedStatus, setImportedStatus] = useState<'IDLE' | 'PARSED' | 'COMMITTED' | 'ROLLEDBACK'>('IDLE');
  const [excelRows, setExcelRows] = useState<ExcelRow[]>([]);

  // Realistic mock spreadsheet preset entries
  const SAMPLE_ROWS: ExcelRow[] = [
    {
      row_no: 2,
      route_code: 'RT-XLS-01',
      route_name: 'EXCEL LINTAS MADURA',
      route_category: 'Tertier',
      transport_mode: 'Darat',
      origin_node: '60000', // Surabaya
      destination_node: '64100', // Madiun (Wait, is Madiun in Madura? Its a mock local route KC)
      etape_sequence: '60000,45100,64100',
      vehicle_code: 'CDD',
      validation_errors: []
    },
    {
      row_no: 3,
      route_code: 'RT-001', // Duplicate Route code (Will trigger validation error)
      route_name: 'EXCEL DUPLICATED SPEEDWAY',
      route_category: 'Primer',
      transport_mode: 'Darat',
      origin_node: '10000',
      destination_node: '60000',
      etape_sequence: '10000,60000',
      vehicle_code: 'WBOX',
      validation_errors: []
    },
    {
      row_no: 4,
      route_code: 'RT-XLS-03',
      route_name: 'CORRUPT GATEWAY ARTERY',
      route_category: 'Primer',
      transport_mode: 'Udara',
      origin_node: '99000',
      destination_node: '99000', // Same Origin/Destination (Error)
      etape_sequence: '99000,99000',
      vehicle_code: 'PCARGO',
      validation_errors: []
    },
    {
      row_no: 5,
      route_code: 'RT-XLS-04',
      route_name: 'SULAWESI-PAPUA SPEEDWAY',
      route_category: 'Primer',
      transport_mode: 'Udara',
      origin_node: '90000', // Makassar
      destination_node: '99000', // Jayapura
      etape_sequence: '90000,99000',
      vehicle_code: 'PCARGO',
      validation_errors: []
    }
  ];

  // Triggers dynamic generation/download of a template CSV
  const handleDownloadTemplate = () => {
    const headers = 'row_no,route_code,route_name,route_category,transport_mode,origin_node,destination_node,etape_sequence,vehicle_code\n';
    const row1 = '2,RT-XLS-01,EXCEL LINTAS UTARA,Primer,Darat,10000,60000,"10000,45100,50000,60000",WBOX\n';
    const row2 = '3,RT-XLS-02,SULAWESI CENTRAL AIRWAY,Primer,Udara,90000,19000,"90000,19000",PCARGO\n';

    const blob = new Blob([headers + row1 + row2], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'N22_Transport_Route_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Simulates file loading and parses validation rules
  const handleSimulateUpload = (fileName: string) => {
    setSelectedFile(fileName);
    setIsParsing(true);
    setImportedStatus('IDLE');

    setTimeout(() => {
      // Run validation rules
      const parsed = SAMPLE_ROWS.map((row) => {
        const errors: string[] = [];

        // 1. Check duplicate route code
        if (routes.some((r) => r.route_code === row.route_code)) {
          errors.push(`Aturan duplikat: Kode Rute "${row.route_code}" sudah aktif dalam sistem.`);
        }

        // 2. Origin/Destination same limit
        if (row.origin_node === row.destination_node) {
          errors.push('Aturan batas: Asas asal dan tujuan tidak boleh mengarah ke satu Hub yang sama.');
        }

        // 3. Check active nodes
        const originActive = nodes.some((n) => n.office_code === row.origin_node && n.is_transport_node);
        const destActive = nodes.some((n) => n.office_code === row.destination_node && n.is_transport_node);

        if (!originActive) {
          errors.push(`Asas integrasi: Kode kantor asal "${row.origin_node}" tidak terdaftar sebagai Transport Node aktif.`);
        }
        if (!destActive) {
          errors.push(`Asas integrasi: Kode kantor tujuan "${row.destination_node}" tidak terdaftar sebagai Transport Node aktif.`);
        }

        // Validate sequence
        const stopCodes = row.etape_sequence.split(',');
        stopCodes.forEach((sc) => {
          if (!(offices || []).some(io => io.office_code === sc)) {
            errors.push(`Referensi error: Kode kantor transit "${sc}" tidak ada di database kantor pos pusat.`);
          }
        });

        return {
          ...row,
          status: errors.length === 0 ? 'Valid' : 'Error',
          validation_errors: errors
        };
      });

      setExcelRows(parsed);
      setIsParsing(false);
      setImportedStatus('PARSED');
    }, 1200);
  };

  // Import valid records bulk
  const handleCommitBulk = () => {
    const validRows = excelRows.filter((r) => r.status === 'Valid');
    if (validRows.length === 0) {
      alert('Tidak ada baris data valid yang siap di-import.');
      return;
    }

    const newRoutes: Route[] = validRows.map((vr) => ({
      id: `R_XLS_${vr.route_code}`,
      route_code: vr.route_code,
      route_name: vr.route_name,
      route_category: vr.route_category as any,
      transport_mode: vr.transport_mode as any,
      origin_node: vr.origin_node,
      destination_node: vr.destination_node,
      effective_date: '2026-06-12',
      expired_date: '2027-12-31',
      status: 'Published' // Imported excel items automatically approved in bulk
    }));

    // Convert stop sequences
    const newEtapes: Etape[] = [];
    validRows.forEach((vr) => {
      const stops = vr.etape_sequence.split(',');
      stops.forEach((st, idx) => {
        newEtapes.push({
          id: `E_XLS_${vr.route_code}_${idx}`,
          route_id: `R_XLS_${vr.route_code}`,
          sequence_no: idx + 1,
          transport_node_code: st,
          estimated_arrival: idx === 0 ? 'Start' : '15:00',
          estimated_departure: idx === stops.length - 1 ? 'End' : '16:00'
        });
      });
    });

    onImportBulk(newRoutes, newEtapes);
    setImportedStatus('COMMITTED');
  };

  // Fully undo transaction (Rollback)
  const handleRollback = () => {
    // Perform simulated cascade cleanup of bulk routes
    setImportedStatus('ROLLEDBACK');
  };

  const handleExportRoutesAndEtapes = () => {
    const headers = [
      'No',
      'ID Rute',
      'Kode Rute',
      'Nama Rute',
      'Kategori',
      'Moda Transportasi',
      'Kode Asal',
      'Kantor Asal',
      'Kode Tujuan',
      'Kantor Tujuan',
      'Kapasitas (Kg)',
      'Tarif (Rp/Kg)',
      'Status',
      'No Urut Etape',
      'Kode Kantor Transit',
      'Nama Kantor Transit',
      'Estimasi Datang',
      'Estimasi Pergi'
    ];

    const rows: string[][] = [];
    let counter = 1;

    routes.forEach((route) => {
      const routeEtapes = etapes
        .filter((e) => e.route_id === route.id)
        .sort((a, b) => a.sequence_no - b.sequence_no);

      const base = [
        route.id,
        route.route_code,
        route.route_name,
        route.route_category,
        route.transport_mode,
        route.origin_node,
        getOfficeName(route.origin_node),
        route.destination_node,
        getOfficeName(route.destination_node),
        (route.capacity_kg ?? 10000).toString(),
        (route.price_per_kg ?? 900).toString(),
        route.status
      ];

      if (routeEtapes.length === 0) {
        rows.push([counter.toString(), ...base, '1', route.origin_node, getOfficeName(route.origin_node), 'Mulai', 'Selesai']);
        counter++;
      } else {
        routeEtapes.forEach((etape) => {
          rows.push([
            counter.toString(),
            ...base,
            etape.sequence_no.toString(),
            etape.transport_node_code,
            getOfficeName(etape.transport_node_code),
            etape.estimated_arrival || '-',
            etape.estimated_departure || '-'
          ]);
          counter++;
        });
      }
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((val) => {
            const cleanVal = val ? val.replace(/"/g, '""') : '';
            return `"${cleanVal}"`;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `N22_DATASET_RUTE_ETAP_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getOfficeName = (code: string) => {
    return (offices || []).find((o) => o.office_code === code)?.office_name || `ID ${code}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Excel / CSV Massal Importer &amp; Exporter</h4>
          <p className="text-xs text-slate-400">Pratinjau data angkutan N22 Angkutan, verifikasi kepatuhan, ekspor database, atau integrasikan sekaligus.</p>
        </div>

        <div className="flex flex-wrap gap-2.5 self-start md:self-center">
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs text-white font-mono flex items-center gap-1.5 rounded transition cursor-pointer"
            title="Download Template untuk Import Rute"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" /> Download Template (.CSV)
          </button>
          <button
            onClick={handleExportRoutesAndEtapes}
            className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-750 border border-emerald-700 text-xs text-white font-mono flex items-center gap-1.5 rounded transition cursor-pointer font-bold"
            title="Download Seluruh Data Master Rute dan Etape ke Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Export Rute &amp; Etape (.CSV)
          </button>
        </div>
      </div>

      {importedStatus === 'IDLE' && (
        <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto">
          <UploadCloud className="w-12 h-12 text-cyan-400 opacity-60 animate-bounce" />
          <div>
            <h5 className="font-bold text-white text-xs">Simulasi Pengunggahan Dokumen N22</h5>
            <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
              Tarik file CSV angkutan milik Anda ke sini, atau klik tombol di bawah ini untuk mensimulasikan parsing spreadsheet.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => handleSimulateUpload('Draft_N22_Jalur_Lintas_Utama.csv')}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs text-cyan-400 font-mono rounded-lg transition"
            >
              Simulasikan Upload 📂
            </button>
          </div>
        </div>
      )}

      {isParsing && (
        <div className="text-center py-12 space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-mono">Membaca berkas kontainer... Memeriksa integritas topologi nasional...</p>
        </div>
      )}

      {importedStatus !== 'IDLE' && !isParsing && (
        <div className="space-y-6 animate-fadeIn">
          {/* Status bar */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500 uppercase">Dokumen:</span>
              <strong className="text-xs text-cyan-400 font-mono italic">{selectedFile}</strong>
            </div>

            <div className="flex gap-2">
              {importedStatus === 'PARSED' && (
                <>
                  <button
                    onClick={handleCommitBulk}
                    className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold rounded-lg transition w-full md:w-auto"
                  >
                    Setujui &amp; Import Unit Valid
                  </button>
                  <button
                    onClick={() => { setSelectedFile(null); setImportedStatus('IDLE'); }}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-xs text-slate-400 rounded-lg"
                  >
                    Batal
                  </button>
                </>
              )}

              {importedStatus === 'COMMITTED' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-400 font-mono font-semibold">🟢 Berhasil di-import ke Database!</span>
                  <button
                    onClick={handleRollback}
                    className="px-3 py-1 bg-red-950 border border-red-900 hover:bg-red-900 text-red-400 text-xs font-mono font-bold flex items-center gap-1 rounded transition"
                  >
                    <RotateCcw className="w-3 h-3" /> Transaksi Rollback
                  </button>
                </div>
              )}

              {importedStatus === 'ROLLEDBACK' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-amber-400 font-mono font-semibold">⚠️ Transaksi Telah Dibatalkan (Clean Schema)!</span>
                  <button
                    onClick={() => { setSelectedFile(null); setImportedStatus('IDLE'); }}
                    className="px-3.5 py-1 bg-slate-800 text-xs text-slate-300 rounded"
                  >
                    Selesai
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Verification Table */}
          <div className="border border-slate-850 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-950 text-xs font-bold text-white uppercase border-b border-slate-850">
              Pratinjau Data &amp; Hasil Peninjauan Validitas Baris
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-950 text-slate-500 font-mono border-b border-slate-850">
                    <th className="p-3">Baris</th>
                    <th className="p-3">Kode Rute</th>
                    <th className="p-3">Nama Rute</th>
                    <th className="p-3">Asal → Tujuan</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Deskripsi Validasi / Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {excelRows.map((row) => (
                    <tr key={row.row_no} className="hover:bg-slate-850/30">
                      <td className="p-3 font-mono text-slate-500">{row.row_no}</td>
                      <td className="p-3 font-mono text-cyan-400 font-bold">{row.route_code}</td>
                      <td className="p-3 max-w-[120px] truncate uppercase font-semibold text-slate-300">{row.route_name}</td>
                      <td className="p-3 text-[10px] text-slate-400">
                        {getOfficeName(row.origin_node)} → {getOfficeName(row.destination_node)}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === 'Valid' ? 'bg-green-950 text-green-400 border border-green-900' : 'bg-red-950 text-red-400 border border-red-900'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[10px] space-y-1">
                        {row.validation_errors.length === 0 ? (
                          <span className="text-slate-400 flex items-center gap-1">
                            <CheckSquare className="w-3.5 h-3.5 text-green-400" /> Aturan Rute Lolos Kepatuhan.
                          </span>
                        ) : (
                          row.validation_errors.map((err, idx) => (
                            <div key={idx} className="text-red-400 flex items-start gap-1">
                              <AlertOctagon className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                              <span>{err}</span>
                            </div>
                          ))
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
