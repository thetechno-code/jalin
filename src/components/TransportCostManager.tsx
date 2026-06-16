import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  Sliders, 
  MapPin, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  XSquare, 
  TrendingUp, 
  FileCheck, 
  ArrowRight, 
  Search, 
  FileText,
  Percent,
  Weight,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import SearchableSelect from './SearchableSelect';
import { Route, Vendor, Fleet, Office } from '../types';

export interface Contract {
  id: string;
  contract_number: string;
  vendor_id: string;
  vendor_name: string;
  effective_date: string;
  expired_date: string;
  route_id: string;
  route_code: string;
  vehicle_type: string;
  tariff_scheme: 'Fixed Trip' | 'Per KG' | 'Per KM' | 'Per Volume' | 'Hybrid';
  tariff_value: number; // e.g. 3000000 or 500 or 7000
  min_charge: number;
  max_capacity: number; // in KG
}

export interface InvoiceReconciliation {
  id: string;
  invoice_no: string;
  vendor_id: string;
  vendor_name: string;
  route_code: string;
  manifest_weight: number;
  manifest_volume: number;
  claimed_amount: number;
  calculated_amount: number;
  variance: number;
  recon_status: 'Draft' | 'Submitted' | 'Matched' | 'Need Review' | 'Approved' | 'Rejected' | 'Paid';
  dispute_detected: boolean;
  dispute_message?: string;
  upload_date: string;
}

interface TransportCostManagerProps {
  routes: Route[];
  vendors: Vendor[];
  fleets: Fleet[];
  offices: Office[];
}

export default function TransportCostManager({
  routes,
  vendors,
  fleets,
  offices
}: TransportCostManagerProps) {
  const [activeTab, setActiveTab] = useState<'contracts' | 'simulation' | 'reconciliation' | 'dashboard' | 'details'>('dashboard');

  // --- 1. State for Contracts & Tariffs ---
  const [contracts, setContracts] = useState<Contract[]>(() => {
    const saved = localStorage.getItem('tms_contracts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    // Prepopulated mock contracts
    return [
      {
        id: 'CON-001',
        contract_number: 'SPK/POSLOG/2026/004',
        vendor_id: 'V001',
        vendor_name: 'PT POS LOGISTIK INDONESIA',
        effective_date: '2026-01-01',
        expired_date: '2026-12-31',
        route_id: 'R001',
        route_code: 'RT-001-PRIMER',
        vehicle_type: 'WBOX',
        tariff_scheme: 'Fixed Trip',
        tariff_value: 12000000,
        min_charge: 12000000,
        max_capacity: 25000
      },
      {
        id: 'CON-002',
        contract_number: 'SPK/POSLOG/2026/005',
        vendor_id: 'V001',
        vendor_name: 'PT POS LOGISTIK INDONESIA',
        effective_date: '2026-01-01',
        expired_date: '2026-12-31',
        route_id: 'R003',
        route_code: 'RT-003-TERTIER',
        vehicle_type: 'CDD',
        tariff_scheme: 'Per KG',
        tariff_value: 500,
        min_charge: 1500000,
        max_capacity: 4000
      },
      {
        id: 'CON-003',
        contract_number: 'SPK/GIA/2026/099',
        vendor_id: 'V002',
        vendor_name: 'PT GARUDA INDONESIA (PERSERO) TBK',
        effective_date: '2026-02-15',
        expired_date: '2027-02-14',
        route_id: 'R002',
        route_code: 'RT-002-PRIMER',
        vehicle_type: 'PCARGO',
        tariff_scheme: 'Per KM',
        tariff_value: 8000,
        min_charge: 5000000,
        max_capacity: 22000
      },
      {
        id: 'CON-004',
        contract_number: 'SPK/SWA/2026/101',
        vendor_id: 'V004',
        vendor_name: 'PT INDOCARGO NUSA UTAMA',
        effective_date: '2026-03-01',
        expired_date: '2026-12-31',
        route_id: 'R004',
        route_code: 'RT-004-SEKUNDER',
        vehicle_type: 'FUSO',
        tariff_scheme: 'Hybrid',
        tariff_value: 3000000, // base trip fee + per kg calculation
        min_charge: 3500000,
        max_capacity: 8000
      }
    ];
  });

  // Save contracts to localStorage
  useEffect(() => {
    localStorage.setItem('tms_contracts', JSON.stringify(contracts));
  }, [contracts]);

  // Form state for creating contract
  const [newContractNo, setNewContractNo] = useState('');
  const [newContractVendorId, setNewContractVendorId] = useState(vendors[0]?.id || 'V001');
  const [newContractRouteId, setNewContractRouteId] = useState(routes[0]?.id || 'R001');
  const [newContractVehicle, setNewContractVehicle] = useState('CDD');
  const [newContractScheme, setNewContractScheme] = useState<'Fixed Trip' | 'Per KG' | 'Per KM' | 'Per Volume' | 'Hybrid'>('Fixed Trip');
  const [newContractTariff, setNewContractTariff] = useState(3000000);
  const [newContractMinCharge, setNewContractMinCharge] = useState(3000000);
  const [newContractMaxCap, setNewContractMaxCap] = useState(4000);

  const handleAddContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractNo) {
      alert('Nomor kontrak tidak boleh kosong');
      return;
    }
    const vendor = vendors.find(v => v.id === newContractVendorId);
    const route = routes.find(r => r.id === newContractRouteId);
    
    const newCon: Contract = {
      id: 'CON-' + Date.now(),
      contract_number: newContractNo,
      vendor_id: newContractVendorId,
      vendor_name: vendor?.vendor_name || 'PT VENDOR MITRA',
      effective_date: new Date().toISOString().split('T')[0],
      expired_date: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      route_id: newContractRouteId,
      route_code: route?.route_code || 'RT-CUSTOM',
      vehicle_type: newContractVehicle,
      tariff_scheme: newContractScheme,
      tariff_value: Number(newContractTariff),
      min_charge: Number(newContractMinCharge),
      max_capacity: Number(newContractMaxCap)
    };

    setContracts([newCon, ...contracts]);
    setNewContractNo('');
  };

  const handleDeleteContract = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus kontrak tarif ini?')) {
      setContracts(contracts.filter(c => c.id !== id));
    }
  };


  // --- 2. State for Cost Simulator ---
  const [simOrigin, setSimOrigin] = useState('10000'); // jakarta
  const [simDestination, setSimDestination] = useState('60000'); // surabaya
  const [simWeight, setSimWeight] = useState(4200);
  const [simVolume, setSimVolume] = useState(15);
  const [simDistance, setSimDistance] = useState(780); // KM

  const [simulationResults, setSimulationResults] = useState<any[]>([]);

  const handleRunSimulation = () => {
    // We will search for contracts matching origin and destination offices
    // If route matches RT-001 or RT-002, Bandung Cirebon, etc.
    const matchingRoutes = routes.filter(r => 
      r.origin_node === simOrigin && r.destination_node === simDestination
    );

    const results = matchingRoutes.map((route, index) => {
      // Find matching contracts
      const routeContracts = contracts.filter(c => c.route_id === route.id);
      
      const details = routeContracts.map(con => {
        let calculated = 0;
        let rateDesc = '';

        if (con.tariff_scheme === 'Fixed Trip') {
          calculated = con.tariff_value;
          rateDesc = `Rp ${con.tariff_value.toLocaleString('id-ID')}/trip (Flat)`;
        } else if (con.tariff_scheme === 'Per KG') {
          calculated = Math.max(con.min_charge, simWeight * con.tariff_value);
          rateDesc = `Rp ${con.tariff_value.toLocaleString('id-ID')}/KG (Min: Rp ${con.min_charge.toLocaleString('id-ID')})`;
        } else if (con.tariff_scheme === 'Per KM') {
          calculated = Math.max(con.min_charge, simDistance * con.tariff_value);
          rateDesc = `Rp ${con.tariff_value.toLocaleString('id-ID')}/KM (Min: Rp ${con.min_charge.toLocaleString('id-ID')})`;
        } else if (con.tariff_scheme === 'Per Volume') {
          calculated = Math.max(con.min_charge, simVolume * con.tariff_value);
          rateDesc = `Rp ${con.tariff_value.toLocaleString('id-ID')}/m³ (Min: Rp ${con.min_charge.toLocaleString('id-ID')})`;
        } else if (con.tariff_scheme === 'Hybrid') {
          // Trip fee + rp 250 per kg over 1000kg
          const extraKg = Math.max(0, simWeight - 1000);
          calculated = con.tariff_value + (extraKg * 400); 
          rateDesc = `Rp ${con.tariff_value.toLocaleString('id-ID')} Trip Fee + Rp 400/KG di atas 1 Ton`;
        }

        const costPerKg = calculated / simWeight;
        const utilization = Math.min(100, (simWeight / con.max_capacity) * 100);

        return {
          contract_no: con.contract_number,
          vendor_name: con.vendor_name,
          vehicle_type: con.vehicle_type,
          calculated_cost: calculated,
          rate_description: rateDesc,
          cost_per_kg: costPerKg,
          utilization: utilization,
          efficiency: utilization < 60 ? 'Inefficient' : 'Efficient',
          transit_time: index === 0 ? '16 Jam' : '19 Jam'
        };
      });

      // If no contract found, emulate a default swasta rate
      if (details.length === 0) {
        const estCost = simWeight * 900; // standard proxy Rp 900/Kg
        details.push({
          contract_no: 'TARIFF-STANDAR-POS',
          vendor_name: 'TARIF LOGISTIK NASIONAL (MOCK)',
          vehicle_type: 'WBOX',
          calculated_cost: estCost,
          rate_description: `Rp 900/KG (Tarif Standar)`,
          cost_per_kg: 900,
          utilization: 65,
          efficiency: 'Efficient',
          transit_time: '18 Jam'
        });
      }

      return {
        route_id: route.id,
        route_code: route.route_code,
        route_name: route.route_name,
        mode: route.transport_mode,
        options: details
      };
    });

    setSimulationResults(results);
  };

  useEffect(() => {
    handleRunSimulation();
  }, [simOrigin, simDestination, simWeight, simVolume, simDistance, contracts]);


  // --- 3. State for Auto Reconciliation & Invoices ---
  const [invoices, setInvoices] = useState<InvoiceReconciliation[]>(() => {
    const saved = localStorage.getItem('tms_invoices');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 'INV-001',
        invoice_no: 'INV-POSLOG-2026-9021',
        vendor_id: 'V001',
        vendor_name: 'PT POS LOGISTIK INDONESIA',
        route_code: 'RT-001-PRIMER',
        manifest_weight: 18000,
        manifest_volume: 45,
        claimed_amount: 12000000,
        calculated_amount: 12000000,
        variance: 0,
        recon_status: 'Matched',
        dispute_detected: false,
        upload_date: '2026-06-10'
      },
      {
        id: 'INV-002',
        invoice_no: 'INV-POSLOG-2026-9022',
        vendor_id: 'V001',
        vendor_name: 'PT POS LOGISTIK INDONESIA',
        route_code: 'RT-003-TERTIER',
        manifest_weight: 3500,
        manifest_volume: 12,
        claimed_amount: 2250000, // claimed high
        calculated_amount: 1750000, // 3500 kg * rp 500 = 1750000
        variance: 500000,
        recon_status: 'Need Review',
        dispute_detected: true,
        dispute_message: 'Potential Billing Dispute: Tagihan vendor lebih tinggi Rp 500.000 dari rute tarif kontrak SPK/POSLOG/2026/005.',
        upload_date: '2026-06-11'
      },
      {
        id: 'INV-003',
        invoice_no: 'INV-INDOCARGO-7013',
        vendor_id: 'V004',
        vendor_name: 'PT INDOCARGO NUSA UTAMA',
        route_code: 'RT-004-SEKUNDER',
        manifest_weight: 6000,
        manifest_volume: 20,
        claimed_amount: 5000000, // claimed high
        calculated_amount: 5000000, // 3000000 + 5000 * 400 = 5000000
        variance: 0,
        recon_status: 'Matched',
        dispute_detected: false,
        upload_date: '2026-06-12'
      },
      {
        id: 'INV-004',
        invoice_no: 'INV-GARUDA-009A',
        vendor_id: 'V002',
        vendor_name: 'PT GARUDA INDONESIA (PERSERO) TBK',
        route_code: 'RT-002-PRIMER',
        manifest_weight: 12000,
        manifest_volume: 80,
        claimed_amount: 8500000, // Claimed Rp 8.5jt
        calculated_amount: 6240000, // distance 780 KM * 8000 = 6240000
        variance: 2260000,
        recon_status: 'Need Review',
        dispute_detected: true,
        dispute_message: 'Potential Billing Dispute: Selisih tarif Rp 2.260.000 terdeteksi dari perhitungan kontrak udara SPK/GIA/2026/099.',
        upload_date: '2026-06-13'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('tms_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Form states for manual invoice entry
  const [invNo, setInvNo] = useState('');
  const [invVendorId, setInvVendorId] = useState('V001');
  const [invRouteCode, setInvRouteCode] = useState('RT-001-PRIMER');
  const [invWeight, setInvWeight] = useState(4000);
  const [invClaimed, setInvClaimed] = useState(3000000);

  // Filters & Search for Transport Cost Details
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  // Derived state: filtered & sorted invoices list
  const filteredInvoices = [...invoices].filter(inv => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = inv.invoice_no.toLowerCase().includes(query) || 
                          inv.vendor_name.toLowerCase().includes(query) ||
                          inv.route_code.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'ALL' || inv.recon_status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime();
    } else if (sortBy === 'highest_claimed') {
      return b.claimed_amount - a.claimed_amount;
    } else if (sortBy === 'highest_variance') {
      return b.variance - a.variance;
    }
    return 0;
  });

  const handleExportToExcel = () => {
    const headers = ["No Invoice", "Nama Vendor", "Rute Koridor", "Berat Kargo (KG)", "Volume (M3)", "Tanggal Upload", "Tagihan Klaim (Rp)", "Tarif Kontrak AC (Rp)", "Selisih / Variance (Rp)", "Status Rekonsiliasi"];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_no,
      inv.vendor_name,
      inv.route_code,
      inv.manifest_weight,
      inv.manifest_volume,
      inv.upload_date,
      inv.claimed_amount,
      inv.calculated_amount,
      inv.variance,
      inv.recon_status
    ]);

    // Construct spreadsheet CSV layout separated by semicolon for MS Excel compatibility with BOM
    const csvContent = "\uFEFF" + [
      headers.join(";"),
      ...rows.map(row => row.map(val => {
        if (typeof val === 'string') {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(";"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `detail_biaya_angkutan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invNo) {
      alert('Isi nomor Invoice terlebih dahulu.');
      return;
    }

    const vendorMatch = vendors.find(v => v.id === invVendorId);
    
    // Find contract for this route and vendor
    const activeRouteMatch = routes.find(r => r.route_code === invRouteCode);
    const contractMatch = contracts.find(c => c.route_id === activeRouteMatch?.id && c.vendor_id === invVendorId);

    let calculated = 3000000; // fallback standard default
    if (contractMatch) {
      if (contractMatch.tariff_scheme === 'Fixed Trip') {
        calculated = contractMatch.tariff_value;
      } else if (contractMatch.tariff_scheme === 'Per KG') {
        calculated = Math.max(contractMatch.min_charge, invWeight * contractMatch.tariff_value);
      } else if (contractMatch.tariff_scheme === 'Per KM') {
        calculated = Math.max(contractMatch.min_charge, 780 * contractMatch.tariff_value); // standard distance 780
      } else if (contractMatch.tariff_scheme === 'Per Volume') {
        calculated = Math.max(contractMatch.min_charge, 15 * contractMatch.tariff_value);
      } else if (contractMatch.tariff_scheme === 'Hybrid') {
        const extraKg = Math.max(0, invWeight - 1000);
        calculated = contractMatch.tariff_value + (extraKg * 400);
      }
    } else {
      // rough fallback scale
      calculated = invWeight * 800;
    }

    const variance = Math.abs(invClaimed - calculated);
    const isDisputed = variance > 50000; // tolerate Rp 50.000 variance max

    const newInvoice: InvoiceReconciliation = {
      id: 'INV-' + Date.now(),
      invoice_no: invNo,
      vendor_id: invVendorId,
      vendor_name: vendorMatch?.vendor_name || 'PT MITRA VENDOR',
      route_code: invRouteCode,
      manifest_weight: invWeight,
      manifest_volume: Math.ceil(invWeight / 300), // proxy volume
      claimed_amount: invClaimed,
      calculated_amount: calculated,
      variance: variance,
      recon_status: isDisputed ? 'Need Review' : 'Matched',
      dispute_detected: isDisputed,
      dispute_message: isDisputed 
        ? `Potential Billing Dispute: Selisih tagihan sebesar Rp ${variance.toLocaleString('id-ID')} terdeteksi.`
        : undefined,
      upload_date: new Date().toISOString().split('T')[0]
    };

    setInvoices([newInvoice, ...invoices]);
    setInvNo('');
    alert(`Invoice ${invNo} berhasil dimasukkan! Status Pencocokan: ${newInvoice.recon_status}`);
  };

  const handleUpdateStatus = (invId: string, status: any) => {
    setInvoices(invoices.map(inv => 
      inv.id === invId 
        ? { ...inv, recon_status: status, dispute_detected: status === 'Need Review' || status === 'Rejected' }
        : inv
    ));
  };


  // --- Helper definitions for autocomplete ---
  const officeOptions = offices && offices.length > 0 
    ? offices.map(o => ({ value: o.office_code, label: `${o.office_name} (${o.office_code})` }))
    : [
        { value: "10000", label: "KCU JAKARTA PUSAT (10000)" },
        { value: "40000", label: "KCU BANDUNG (40000)" },
        { value: "50000", label: "KCU SEMARANG (50000)" },
        { value: "60000", label: "KCU SURABAYA KEBONROJO (60000)" },
        { value: "45100", label: "KC CIREBON (45100)" },
        { value: "55011", label: "KC YOGYAKARTA (55011)" }
      ];


  // --- 4. KPIs & Performance Analytics Calculations ---
  const totalCost = invoices.filter(inv => inv.recon_status === 'Approved' || inv.recon_status === 'Paid' || inv.recon_status === 'Matched').reduce((acc, curr) => acc + curr.calculated_amount, 0);
  const totalVariance = invoices.reduce((acc, curr) => acc + curr.variance, 0);
  const disputeCount = invoices.filter(inv => inv.dispute_detected).length;
  const matchRate = invoices.length > 0 ? ((invoices.filter(i => i.recon_status === 'Matched').length) / invoices.length) * 100 : 100;
  
  // Calculate average cost per KG
  const totalWeight = invoices.reduce((acc, curr) => acc + curr.manifest_weight, 0);
  const totalCalculated = invoices.reduce((acc, curr) => acc + curr.calculated_amount, 0);
  const avgCostPerKg = totalWeight > 0 ? totalCalculated / totalWeight : 1000;

  // Pie chart data: Cost per Vendor
  const costPerVendorDataMap: Record<string, number> = {};
  invoices.forEach(inv => {
    costPerVendorDataMap[inv.vendor_name] = (costPerVendorDataMap[inv.vendor_name] || 0) + inv.calculated_amount;
  });
  const costPerVendorData = Object.entries(costPerVendorDataMap).map(([name, val]) => ({
    name: name.replace('PT ', '').replace(' (PERSERO) TBK', ''),
    value: val
  }));

  // Bar chart data: Cost per Route
  const costPerRouteMap: Record<string, number> = {};
  invoices.forEach(inv => {
    costPerRouteMap[inv.route_code] = (costPerRouteMap[inv.route_code] || 0) + inv.calculated_amount;
  });
  const costPerRouteData = Object.entries(costPerRouteMap).map(([code, val]) => ({
    route: code.replace('-PRIMER', '').replace('-SEKUNDER', '').replace('-TERTIER', ''),
    biaya: val
  }));

  const COLORS = ['#1C2D5A', '#0EA5E9', '#F59E0B', '#10B981', '#6366F1'];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      
      {/* Title Header with descriptive badge */}
      <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 border border-emerald-200 bg-emerald-50 rounded-lg p-0.5" />
            <span>Transport Management &amp; Invoice Reconciliation</span>
          </h3>
          <p className="text-xs text-slate-500 font-normal">
            Sistem validasi tagihan vendor otomatis, audit rute biaya per KG nasional, simulasi planner, dan mitigasi dispute penagihan.
          </p>
        </div>
        
        {/* Module Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-[#1C2D5A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dashboard Biaya</span>
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'contracts'
                ? 'bg-[#1C2D5A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Kontrak &amp; Tarif</span>
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'simulation'
                ? 'bg-[#1C2D5A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulasi Rute</span>
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'reconciliation'
                ? 'bg-[#1C2D5A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Rekonsiliasi Invoice</span>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'details'
                ? 'bg-[#1C2D5A] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Detail Biaya &amp; Export</span>
          </button>
        </div>
      </div>

      {/* --- MODULE SCREEN 1: BIAYA DASHBOARD & ANALYTICS --- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Executive Finance KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-black font-mono block">TOTAL RECONCILED COST</span>
              <div className="text-xl font-bold text-slate-900 font-sans tracking-tight">
                Rp {totalCost.toLocaleString('id-ID')}
              </div>
              <p className="text-[9px] text-slate-400">Total tagihan terverifikasi &amp; disinkronkan</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner space-y-1">
              <span className="text-[9px] text-emerald-650 uppercase font-black font-mono block text-emerald-700">AVG COST PER KG</span>
              <div className="text-xl font-bold text-emerald-800 font-sans tracking-tight">
                Rp {avgCostPerKg.toLocaleString('id-ID', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-slate-500">/ KG</span>
              </div>
              <p className="text-[9px] text-slate-400">Rata-rata biaya kiriman nasional</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner space-y-1">
              <span className="text-[9px] text-red-650 uppercase font-black font-mono block text-amber-600">DISPUTE VARIANCE</span>
              <div className="text-xl font-bold text-red-700 font-sans tracking-tight">
                Rp {totalVariance.toLocaleString('id-ID')}
              </div>
              <p className="text-[9px] text-slate-400">Total selisih billing (SLA/Tarif mismatch)</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner space-y-1">
              <span className="text-[9px] text-cyan-650 uppercase font-black font-mono block text-cyan-700">RECON BATCH MATCHING</span>
              <div className="text-xl font-bold text-cyan-800 font-sans tracking-tight">
                {matchRate.toFixed(1)}%
              </div>
              <p className="text-[9px] text-slate-400">SLA Keberhasilan rekonsiliasi otomatis</p>
            </div>
          </div>

          {/* Graphical Analytics Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Cost per Route Chart */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold font-mono tracking-wider block">NATIONAL COST PER ROUTE CORRIDOR</span>
              <div className="h-[220px] w-full">
                {costPerRouteData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 italic">No cost records yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costPerRouteData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="route" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} contentStyle={{ fontSize: 11 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="biaya" fill="#1C2D5A" radius={[4, 4, 0, 0]} name="Total Biaya (Rupiah)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Cost per Vendor Share Chart */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
              <span className="text-[10px] text-slate-500 uppercase font-bold font-mono tracking-wider block">VENDOR FINANCIAL SHARE (%)</span>
              <div className="h-[220px] w-full flex items-center justify-center">
                {costPerVendorData.length === 0 ? (
                  <span className="text-slate-400 italic">No distribution metrics</span>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center w-full justify-around h-full">
                    <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costPerVendorData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {costPerVendorData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Customize label legend */}
                    <div className="w-1/2 text-[10px] space-y-1.5 font-mono">
                      {costPerVendorData.map((entry, idx) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span className="truncate text-slate-700 font-bold max-w-[150px]">{entry.name}</span>
                          <span className="text-slate-500">({Math.round(entry.value / totalCalculated * 100 || 0)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Active Disputes & Alerts Log */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-amber-900 font-mono tracking-wider flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
              <span>LOG PERINGATAN REKONSILIASI BIAYA &amp; DISPUTE PENAGIHAN ({disputeCount})</span>
            </h4>
            <div className="space-y-2">
              {invoices.filter(inv => inv.dispute_detected).map(inv => (
                <div key={inv.id} className="bg-white border border-amber-200 rounded-lg p-3 text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 text-[9px] font-bold rounded uppercase">DISPUTE</span>
                      <span className="font-extrabold text-slate-800 font-mono">{inv.invoice_no}</span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-600 font-medium">{inv.vendor_name}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed italic">
                      {inv.dispute_message || `Terjadi selisih penagihan vendor sebesar Rp ${inv.variance.toLocaleString('id-ID')} pada rute ${inv.route_code}.`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 font-mono block">Variance Amount</span>
                    <strong className="text-red-600 font-mono font-bold text-sm">Rp {inv.variance.toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              ))}
              {invoices.filter(inv => inv.dispute_detected).length === 0 && (
                <p className="text-emerald-800 text-[11px] font-mono italic">✓ Seluruh tagihan vendor tercatat sinkron sempurna dengan hitungan siber-kontrak NTNMS.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* --- MODULE SCREEN 2: CONTRACT & TARIFF POLICY --- */}
      {activeTab === 'contracts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Input Form for contract registration */}
            <form onSubmit={handleAddContract} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 h-fit shadow-inner">
              <h4 className="text-xs font-bold text-[#1C2D5A] uppercase tracking-wider font-mono flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-700" />
                <span>Registrasi Kontrak Tarif Baru</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nomor Kontrak:</label>
                  <input 
                    type="text" 
                    value={newContractNo}
                    onChange={(e) => setNewContractNo(e.target.value)}
                    placeholder="Contoh: SPK/POSLOG/2026/009"
                    className="w-full bg-white border border-slate-200 p-2 text-slate-800 font-mono rounded-lg focus:border-cyan-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Pilih Vendor Mitra:</label>
                  <select 
                    value={newContractVendorId}
                    onChange={(e) => setNewContractVendorId(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2 rounded-lg"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.vendor_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Pilih Rute Koridor:</label>
                  <select 
                    value={newContractRouteId}
                    onChange={(e) => setNewContractRouteId(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2 rounded-lg font-mono"
                  >
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.route_code} ({r.route_name})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Jenis Kendaraan:</label>
                    <select 
                      value={newContractVehicle}
                      onChange={(e) => setNewContractVehicle(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg font-mono"
                    >
                      <option value="CDD">CDD Box</option>
                      <option value="FUSO">Fuso Box</option>
                      <option value="WBOX">Wingbox Truck</option>
                      <option value="PCARGO">B737 Cargo Jet</option>
                      <option value="KCARGO">Pelni Logistics</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Skema Biaya:</label>
                    <select 
                      value={newContractScheme}
                      onChange={(e) => setNewContractScheme(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg focus:outline-none"
                    >
                      <option value="Fixed Trip">Fixed Trip (Flat)</option>
                      <option value="Per KG">Per KG</option>
                      <option value="Per KM">Per KM</option>
                      <option value="Per Volume">Per Volume (m³)</option>
                      <option value="Hybrid">Hybrid (Flat+KG)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nilai Tarif (Rp):</label>
                    <input 
                      type="number" 
                      value={newContractTariff}
                      onChange={(e) => setNewContractTariff(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg font-semibold font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Minimum Charge (Rp):</label>
                    <input 
                      type="number" 
                      value={newContractMinCharge}
                      onChange={(e) => setNewContractMinCharge(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg font-semibold font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kapasitas Maks Batas (KG):</label>
                  <input 
                    type="number" 
                    value={newContractMaxCap}
                    onChange={(e) => setNewContractMaxCap(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 p-2 rounded-lg font-mono font-medium"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-[#1C2D5A] hover:bg-slate-800 text-white font-extrabold font-mono rounded-xl transition duration-150 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> DAFTARKAN TARIF KONTRAK
                </button>
              </div>
            </form>

            {/* List of active contracts registered with delete option */}
            <div className="lg:col-span-2 space-y-4">
              <span className="text-[10px] text-slate-500 uppercase font-black font-mono tracking-wider block">DAFTAR KONTRAK TARIF EKSTERNAL AKTIF</span>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {contracts.map(con => (
                  <div key={con.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-cyan-500 hover:shadow-md transition">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-cyan-100 text-[#1C2D5A] text-[9.5px] font-black rounded-lg border border-cyan-200 font-mono">{con.contract_number}</span>
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[8.5px] font-bold rounded uppercase">{con.tariff_scheme}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 text-xs font-semibold">{con.vendor_name}</span>
                        </div>
                        
                        <div className="text-[11px] font-medium text-slate-800 space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400">Rute:</span>
                            <strong className="text-cyan-900 font-bold">{con.route_code}</strong>
                            <span className="text-slate-450 text-slate-400 font-normal">| Armada:</span>
                            <strong className="font-extrabold text-slate-700 font-mono bg-slate-50 px-1 border border-slate-100 rounded">{con.vehicle_type}</strong>
                          </div>
                          <div>
                            <span className="text-slate-450 text-slate-400">Skema Biaya:</span>
                            <span className="font-bold text-slate-900 font-mono ml-1">
                              Rp {con.tariff_value.toLocaleString('id-ID')} {con.tariff_scheme === 'Fixed Trip' ? '/Trip' : `/${con.tariff_scheme.replace('Per ', '')}`}
                            </span>
                          </div>
                          <div className="flex text-[10px] text-slate-500 gap-4 pt-1 font-mono">
                            <span>SLA Minimum: Rp {con.min_charge?.toLocaleString('id-ID')}</span>
                            <span>Kapasitas: {(con.max_capacity/1000).toFixed(1)} Ton</span>
                            <span className="text-slate-400">Expired: {con.expired_date}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteContract(con.id)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition shrink-0 cursor-pointer"
                        title="Hapus Kontrak Tarif"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {contracts.length === 0 && (
                  <p className="text-slate-450 italic text-center p-12 border border-dashed rounded-xl font-mono text-xs">Belum ada kontrak tarif vendor yang didaftarkan.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MODULE SCREEN 3: ROUTE PLANNER COST SIMULATOR --- */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-inner">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-cyan-600" />
              <span>LOGISTIK PLANNER SIMULASI TARIF MULTI-RUTE</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end text-xs font-sans">
              <div className="space-y-1.5 text-left">
                <label className="font-bold text-slate-600">Kantor POS Asal (Origin):</label>
                <SearchableSelect 
                  options={officeOptions} 
                  value={simOrigin} 
                  onChange={setSimOrigin} 
                  placeholder="Pilih Asal..." 
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="font-bold text-slate-600">Kantor POS Tujuan (Destination):</label>
                <SearchableSelect 
                  options={officeOptions} 
                  value={simDestination} 
                  onChange={setSimDestination} 
                  placeholder="Pilih Tujuan..." 
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Kargo Berat (KG):</label>
                <input 
                  type="number" 
                  value={simWeight}
                  onChange={(e) => setSimWeight(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white border border-slate-300 p-2.5 rounded-lg font-bold font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">Jalur Jarak (KM):</label>
                <input 
                  type="number" 
                  value={simDistance}
                  onChange={(e) => setSimDistance(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-white border border-slate-300 p-2.5 rounded-lg font-bold font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleRunSimulation}
                className="w-full py-2.5 bg-[#1C2D5A] text-white font-extrabold font-mono hover:bg-slate-800 transition duration-150 cursor-pointer rounded-lg shadow"
              >
                HITUNG SIMULASI
              </button>
            </div>
          </div>

          {/* Simulation Output list comparing options */}
          <div className="space-y-4">
            <span className="text-[10px] text-slate-500 uppercase font-black font-mono tracking-wider block">HASIL PERBANDINGAN RUTE &amp; ESTIMASI BIAYA</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {simulationResults.map((resItem, idx) => (
                <div key={resItem.route_id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded-lg border text-[10px] font-mono">{resItem.route_code}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Modul: {resItem.mode}</span>
                    </div>
                    <h5 className="font-bold text-slate-800 text-sm">{resItem.route_name}</h5>
                    
                    <div className="space-y-4 border-t border-slate-100 pt-3">
                      {resItem.options.map((opt: any, optIdx: number) => (
                        <div key={optIdx} className="space-y-3">
                          <div className="flex justify-between items-start text-xs border-b border-dashed border-slate-100 pb-2.5">
                            <div>
                              <strong className="block font-bold text-slate-800 text-[11px]">{opt.vendor_name}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">SPK: {opt.contract_no} • {opt.vehicle_type}</span>
                              <span className="text-[10px] text-slate-500 block mt-1">SLA Waktu Tempuh: <strong>{opt.transit_time}</strong></span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-mono">Simulated Cost</span>
                              <strong className="text-cyan-800 font-extrabold font-mono text-[15px] block">Rp {opt.calculated_cost.toLocaleString('id-ID')}</strong>
                              <span className="text-[9px] text-[#10B981] font-mono leading-none block mt-0.5">Rp {Math.round(opt.calculated_cost/simWeight).toLocaleString('id-ID')}/KG</span>
                            </div>
                          </div>

                          {/* Space efficiency indicator layer */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] font-semibold text-slate-500 font-mono">
                              <span>Load Ratio: {opt.utilization.toFixed(1)}%</span>
                              <span>Target Cap: {(conCapLimit(opt.vehicle_type)/1000).toFixed(1)} Ton</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  opt.utilization > 95 ? 'bg-red-500' : opt.utilization < 40 ? 'bg-amber-400' : 'bg-[#10B981]'
                                }`} 
                                style={{ width: `${opt.utilization}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center pt-0.5">
                              <span className={`text-[9px] font-bold ${opt.efficiency === 'Efficient' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {opt.efficiency === 'Efficient' ? '✓ Cost Efficient Standard' : '⚠ Cost Inefficient Load Factor'}
                              </span>
                              {opt.utilization < 50 && (
                                <span className="text-[8px] bg-red-150 bg-red-50 text-red-700 px-1 rounded uppercase font-bold tracking-tight">Kargo Kurang Padat</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation badge highlighting the cheapest route */}
                  {simulationResults.length > 1 && (
                    <div className="mt-4 border-t border-slate-150 pt-3 flex justify-between items-center">
                      <span className="text-[9px] text-slate-400 italic">Disarankan oleh NTNMS Optimizer</span>
                      {Math.min(...simulationResults.map(r => r.options[0]?.calculated_cost || 99999999)) === resItem.options[0]?.calculated_cost ? (
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono text-[10px] font-black rounded-lg flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 " />
                          <span>REKOMENDASI: SAVE Rp {(Math.max(...simulationResults.map(r => r.options[0]?.calculated_cost || 0)) - Math.min(...simulationResults.map(r => r.options[0]?.calculated_cost || 0))).toLocaleString('id-ID')}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-medium font-mono">Higher cost premium</span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {simulationResults.length === 0 && (
                <div className="bg-slate-50 border border-dashed rounded-2xl p-12 text-center col-span-2 text-slate-405 font-mono italic text-xs">
                  Tidak ada rute terdaftar untuk kriteria Pencarian Asal &amp; Tujuan yang dipilih. Buat rute baru terlebih dahulu.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODULE SCREEN 4: INVOICE AUTOMATIC RECONCILIATION --- */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Simulation form to upload / simulate an invoice */}
            <form onSubmit={handleUploadInvoice} className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 h-fit shadow-inner">
              <h4 className="text-xs font-bold text-[#1C2D5A] uppercase tracking-wider font-mono flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-700" />
                <span>Simulasi Upload Invoice Vendor</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Nomor Invoice:</label>
                  <input 
                    type="text" 
                    value={invNo}
                    onChange={(e) => setInvNo(e.target.value)}
                    placeholder="Contoh: INV/GARUDA/2026/012A"
                    className="w-full bg-white border border-slate-200 p-2 text-slate-800 font-mono rounded-lg focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Pilih Vendor Mitra:</label>
                  <select 
                    value={invVendorId}
                    onChange={(e) => setInvVendorId(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2 rounded-lg"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.vendor_name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Rute Kode Terkait:</label>
                  <select 
                    value={invRouteCode}
                    onChange={(e) => setInvRouteCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 p-2 rounded-lg font-mono focus:outline-none"
                  >
                    {routes.map(r => (
                      <option key={r.route_code} value={r.route_code}>{r.route_code} ({r.route_name})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Berat Kargo Terbawa (KG):</label>
                    <input 
                      type="number" 
                      value={invWeight}
                      onChange={(e) => setInvWeight(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg font-mono font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Jumlah Tagihan Claim (Rp):</label>
                    <input 
                      type="number" 
                      value={invClaimed}
                      onChange={(e) => setInvClaimed(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white border border-slate-200 p-2 rounded-lg font-mono font-bold"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-[#1C2D5A] hover:bg-slate-800 text-white font-extrabold font-mono rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" /> UPLOAD &amp; RECON MATCHING
                </button>
              </div>
            </form>

            {/* Reconciliation Matching results logs and status actions */}
            <div className="lg:col-span-2 space-y-4">
              <span className="text-[10px] text-slate-500 uppercase font-black font-mono tracking-wider block">DAFTAR RECON STATUS TAGIHAN (SYSTEM AUTOMATCHING)</span>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {invoices.map(inv => (
                  <div key={inv.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-cyan-200 transition space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-extrabold text-[10px] font-mono border rounded">{inv.invoice_no}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Uploaded: {inv.upload_date}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600 text-xs font-semibold">{inv.vendor_name}</span>
                        </div>
                        <span className="text-[11px] font-normal text-slate-500 font-mono block pt-1">
                          Rute: <strong>{inv.route_code}</strong> • Muatan: <strong>{inv.manifest_weight.toLocaleString()} KG</strong>
                        </span>
                      </div>

                      {/* Matching Status display */}
                      <span className={`px-2 py-1 rounded font-mono text-[9px] font-black uppercase ${
                        inv.recon_status === 'Matched' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        inv.recon_status === 'Need Review' ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' :
                        inv.recon_status === 'Approved' ? 'bg-sky-100 text-sky-800 border-sky-200 border' :
                        inv.recon_status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200 border' :
                        'bg-slate-150 text-slate-700'
                      }`}>
                        {inv.recon_status}
                      </span>
                    </div>

                    {/* Breakdown variance table comparing Vendor invoice with System calculates */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono shadow-inner">
                      <div>
                        <span className="text-[8.5px] text-slate-400 block">Claim Vendor Invoice</span>
                        <strong className="text-slate-800 text-[11px]">Rp {inv.claimed_amount.toLocaleString('id-ID')}</strong>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-slate-400 block">System Contract Rates</span>
                        <strong className="text-slate-800 text-[11px]">Rp {inv.calculated_amount.toLocaleString('id-ID')}</strong>
                      </div>
                      <div>
                        <span className="text-[8.5px] text-slate-400 block">Discrepancy / Variance</span>
                        <strong className={`text-[11px] font-bold ${inv.variance > 0 ? 'text-red-650 text-red-650 font-black' : 'text-emerald-700'}`}>
                          Rp {inv.variance.toLocaleString('id-ID')}
                        </strong>
                      </div>
                    </div>

                    {/* Dispute Alert box */}
                    {inv.dispute_detected && (
                      <div className="bg-red-50 border border-red-100 px-3 py-2 rounded-lg flex items-center gap-2.5 text-xs text-red-800 leading-normal">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 animate-bounce" />
                        <span className="font-semibold italic">{inv.dispute_message}</span>
                      </div>
                    )}

                    {/* Quick action controls for review */}
                    <div className="flex gap-2 justify-end pt-1">
                      {inv.recon_status === 'Need Review' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(inv.id, 'Approved')}
                            className="px-2.5 py-1 text-[10px] bg-sky-600 hover:bg-sky-700 text-white font-bold rounded shadow cursor-pointer font-mono"
                          >
                            ✓ Approve Billing
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(inv.id, 'Rejected')}
                            className="px-2.5 py-1 text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow cursor-pointer font-mono"
                          >
                            × Reject &amp; Open Dispute
                          </button>
                        </>
                      )}
                      {inv.recon_status === 'Matched' && (
                        <button
                          onClick={() => handleUpdateStatus(inv.id, 'Approved')}
                          className="px-2.5 py-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow cursor-pointer font-mono"
                        >
                          ✓ SINKRONKAN UNTUK PEMBAYARAN
                        </button>
                      )}
                      {inv.recon_status === 'Approved' && (
                        <span className="text-[10px] text-sky-850 font-mono font-extrabold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
                          <span>TERSETUJUI UNTUK DISPENSASI NOTA DEBIT</span>
                        </span>
                      )}
                      {inv.recon_status === 'Rejected' && (
                        <span className="text-[10px] text-red-855 font-mono font-extrabold flex items-center gap-1">
                          <XSquare className="w-3.5 h-3.5 text-red-650" />
                          <span>DITOLAK - MENUNGGU TINDAKAN REKO OPERATOR VENDOR</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MODULE SCREEN 5: DETAIL BIAYA ANGKUTAN & EXPORT EXCEL --- */}
      {activeTab === 'details' && (
        <div className="space-y-4 animate-fade-in text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#1C2D5A] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Ekspor Rekapitulasi Riwayat Realisasi Biaya Angkutan</span>
              </h4>
              <p className="text-[11px] text-slate-500 font-normal">
                Pencarian detail, audit menyeluruh, dan ekspor spreadsheet untuk keperluan rekonsiliasi keuangan mitra vendor Pos Indonesia.
              </p>
            </div>

            {/* Excel Export Action Button */}
            <button
              onClick={handleExportToExcel}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold font-mono rounded-lg transition-all shadow-md flex items-center gap-2 cursor-pointer text-xs shrink-0"
              id="btn-export-excel-costs"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT EXCEL (CSV)</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white border border-slate-200 p-3.5 rounded-xl text-xs shadow-sm">
            <div className="space-y-1">
              <label className="font-bold text-slate-600 font-mono text-[10px] uppercase">Cari No Invoice / Vendor / Rute:</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama vendor atau nomor invoice..."
                  className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-2 rounded-lg text-slate-800 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 font-mono text-[10px] uppercase">Filter Status Rekon:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">Semua Status</option>
                <option value="Matched">Matched (Sinkron)</option>
                <option value="Need Review">Need Review (Perlu Tinjauan)</option>
                <option value="Approved">Approved (Disetujui Keuangan)</option>
                <option value="Rejected">Rejected (Dispute Terbuka)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-600 font-mono text-[10px] uppercase font-bold">Urutan Kolom:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-cyan-500"
              >
                <option value="newest">Terbaru Diupload</option>
                <option value="highest_claimed">Biaya Claimed Tertinggi</option>
                <option value="highest_variance">Variance Selisih Terbesar</option>
              </select>
            </div>
          </div>

          {/* Interactive Costs Data Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[#1C2D5A] font-bold font-mono text-[10px] uppercase tracking-wider">
                    <th className="p-3">No Invoice</th>
                    <th className="p-3">Vendor / Mitra</th>
                    <th className="p-3">Rute Koridor</th>
                    <th className="p-3 text-right">Berat / Volume</th>
                    <th className="p-3 text-right">Tagihan Klaim (Rp)</th>
                    <th className="p-3 text-right">Sesuai Kontrak (Rp)</th>
                    <th className="p-3 text-right">Selisih (Variance)</th>
                    <th className="p-3 text-center">Status Rekon</th>
                    <th className="p-3 text-center">Audit Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-700">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors text-[11px] font-mono">
                      <td className="p-3 font-extrabold text-slate-900 truncate max-w-[140px]" title={inv.invoice_no}>
                        {inv.invoice_no}
                      </td>
                      <td className="p-3 font-semibold text-slate-700 truncate max-w-[160px]" title={inv.vendor_name}>
                        {inv.vendor_name}
                      </td>
                      <td className="p-3 font-semibold text-slate-650 text-slate-650">
                        {inv.route_code}
                      </td>
                      <td className="p-3 text-right text-slate-500">
                        {inv.manifest_weight.toLocaleString('id-ID')} Kg <br />
                        <span className="text-[9px] text-slate-400">{inv.manifest_volume} m³</span>
                      </td>
                      <td className="p-3 text-right font-extrabold text-slate-900">
                        Rp {inv.claimed_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-right font-semibold text-cyan-900">
                        Rp {inv.calculated_amount.toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 text-right">
                        {inv.variance > 0 ? (
                          <span className="text-red-650 text-red-600 font-extrabold">
                            +Rp {inv.variance.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold">✓ Rp 0</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          inv.recon_status === 'Matched' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          inv.recon_status === 'Need Review' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          inv.recon_status === 'Approved' ? 'bg-sky-100 text-sky-800 border-sky-200 border' :
                          inv.recon_status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200 border' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {inv.recon_status}
                        </span>
                      </td>
                      <td className="p-3 text-center text-slate-400 text-[10px]">
                        {inv.upload_date}
                      </td>
                    </tr>
                  ))}

                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-405 italic bg-slate-50 font-mono text-xs font-medium">
                        Tidak ada record biaya angkutan untuk kriteria pencarian yang aktif.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary statistics at table footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap justify-between items-center text-xs text-slate-600 gap-4 font-mono">
              <div className="flex gap-4">
                <span>Total Item: <strong>{filteredInvoices.length} Invoices</strong></span>
                <span>•</span>
                <span>Akumulasi Total: <strong className="text-slate-900 font-bold">Rp {filteredInvoices.reduce((a, b) => a + b.claimed_amount, 0).toLocaleString('id-ID')}</strong></span>
                <span>•</span>
                <span>Total Selisih: <strong className="text-red-700 font-bold">Rp {filteredInvoices.reduce((a, b) => a + b.variance, 0).toLocaleString('id-ID')}</strong></span>
              </div>
              <span className="text-[10px] text-slate-400 italic">✓ Export ready data aligned to Excel formatting.</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Private helpers
const conCapLimit = (vehicleType: string): number => {
  if (vehicleType === 'CDD') return 4000;
  if (vehicleType === 'FUSO') return 8000;
  if (vehicleType === 'WBOX') return 25000;
  if (vehicleType === 'PCARGO') return 22000;
  return 500000;
};
