import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  TrendingUp, 
  Plus, 
  AlertTriangle, 
  Trash2, 
  CheckCircle, 
  TrendingDown, 
  Layers, 
  Settings, 
  AlertCircle, 
  Truck, 
  ArrowRight, 
  Shuffle, 
  BarChart3, 
  Sliders, 
  UserCheck, 
  RefreshCw, 
  FileText, 
  XCircle, 
  Archive,
  Info
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
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

import { Route, Schedule } from '../types.ts';

interface CapacityPlanningHubProps {
  routes: Route[];
  schedules: Schedule[];
  currentUser?: { username: string; role?: string } | null;
}

export default function CapacityPlanningHub({ routes, schedules, currentUser }: CapacityPlanningHubProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservation' | 'vehicle' | 'load' | 'forecast' | 'consolidation' | 'rules'>('dashboard');

  // --- BUSINESS RULES ENGINE CONGFIGURATION ---
  const [rules, setRules] = useState({
    priorityWeightExpress: 5,
    priorityWeightQ9: 4,
    priorityWeightCorporate: 3,
    priorityWeightJumbo: 2,
    reservationExpiryHours: 24,
    allocationMethod: 'Priority Based' as 'First Come First Serve' | 'Priority Based' | 'Quota Based' | 'Hybrid',
    capacityAlertThreshold: 80, // %
    forecastThreshold: 15, // %
  });

  // --- STATE STORES ---
  const [reservations, setReservations] = useState<any[]>([
    {
      id: 1,
      reservation_code: "RES-2026-001",
      route_id: "R001",
      schedule_id: "S001",
      routeName: "LINTAS JAWA UTARA STANDARD (Jakarta → Surabaya)",
      reserved_weight: 3000,
      reserved_volume: 12,
      priority: "Express",
      status: "Reserved",
      allocation_strategy: "Priority Based",
      created_by: "Iwan (Planner)",
      created_at: "2026-06-13T02:00:00Z",
      notes: "SLA Kiriman penting korporasi FMCG Indonesia."
    },
    {
      id: 2,
      reservation_code: "RES-2026-002",
      route_id: "R002",
      schedule_id: "S002",
      routeName: "PRIANGAN BARAT LOGISTICS (Jakarta → Bandung)",
      reserved_weight: 1200,
      reserved_volume: 5,
      priority: "Logistik",
      status: "Draft",
      allocation_strategy: "First Come First Serve",
      created_by: "Bandung Oper",
      created_at: "2026-06-13T03:30:00Z",
      notes: "Paket reguler batch 1 Sektor Priangan."
    },
    {
      id: 3,
      reservation_code: "RES-2026-003",
      route_id: "R001",
      schedule_id: "S001",
      routeName: "LINTAS JAWA UTARA STANDARD (Jakarta → Surabaya)",
      reserved_weight: 500,
      reserved_volume: 2,
      priority: "EMS",
      status: "Confirmed",
      allocation_strategy: "Priority Based",
      created_by: "Iwan (Planner)",
      created_at: "2026-06-12T14:20:00Z",
      notes: "Dokumen kurir udara transit darat."
    },
    {
      id: 4,
      reservation_code: "RES-2026-004",
      route_id: "R003",
      schedule_id: "S003",
      routeName: "INTER-GATEWAY CARGO CORRIDOR (Bandara → Makassar)",
      reserved_weight: 12000,
      reserved_volume: 48,
      priority: "Corporate",
      status: "Reserved",
      allocation_strategy: "Hybrid",
      created_by: "Mac Operator",
      created_at: "2026-06-13T01:10:00Z",
      notes: "Kontrak bulanan sparepart otomotif."
    },
    {
      id: 5,
      reservation_code: "RES-2026-005",
      route_id: "R001",
      schedule_id: "S001",
      routeName: "LINTAS JAWA UTARA STANDARD (Jakarta → Surabaya)",
      reserved_weight: 400,
      reserved_volume: 1.5,
      priority: "Q9",
      status: "Cancelled",
      allocation_strategy: "First Come First Serve",
      created_by: "Iwan",
      created_at: "2026-06-12T20:00:00Z",
      notes: "Dibatalkan oleh pengirim sebelum manifest terikat."
    }
  ]);

  const [bookingSlots, setBookingSlots] = useState<any[]>([
    { id: 1, route_id: "R001", schedule_id: "S001", totalCapacity_kg: 4000, reserved: 3500 },
    { id: 2, route_id: "R002", schedule_id: "S002", totalCapacity_kg: 15000, reserved: 1200 },
    { id: 3, route_id: "R003", schedule_id: "S003", totalCapacity_kg: 21000, reserved: 12000 },
    { id: 4, route_id: "R004", schedule_id: "S004", totalCapacity_kg: 18000, reserved: 4500 }
  ]);

  const [releases, setReleases] = useState<any[]>([
    { id: 1, reservation_code: "RES-2026-005", released_weight: 400, released_at: "2026-06-13T04:10:00Z", released_by: "System Expiry" }
  ]);

  // Forecast state preset
  const [forecasts, setForecasts] = useState<any[]>([
    { id: 1, route_id: "R001", from: "Bandung", to: "Semarang", period: "Weekly", predicted: 12000, current: 8000, gap: 4000, peakFactor: "1.25x [High]" },
    { id: 2, route_id: "R002", from: "Jakarta", to: "Bandung", period: "Weekly", predicted: 6200, current: 15000, gap: -8800, peakFactor: "0.9x [Normal]" },
    { id: 3, route_id: "R003", from: "Jakarta (CGK)", to: "Makassar", period: "Monthly", predicted: 24500, current: 21000, gap: 3500, peakFactor: "1.1x [Moderate]" },
    { id: 4, route_id: "R004", from: "Jakarta", to: "Medan", period: "Weekly", predicted: 22000, current: 18000, gap: 4000, peakFactor: "1.3x [High]" }
  ]);

  // Consolidations candidates (small manifests)
  const [consolidations, setConsolidations] = useState<any[]>([
    { 
      id: 1, 
      route_id: "R001",
      destination: "Semarang Hub", 
      schedule_time: "20:00 Daily",
      manifests: [
        { code: "MNF-REG-901", weight: 300, source: "Bandung Main" },
        { code: "MNF-REG-902", weight: 500, source: "Cirebon DC" },
        { code: "MNF-REG-903", weight: 700, source: "Tasikmalaya KC" }
      ],
      total_weight_kg: 1500,
      action_recommended: "Merge into one transport execution (Fuso Truck saving Rp 2.500.000)",
      status: "Pending"
    },
    { 
      id: 2, 
      route_id: "R002", 
      destination: "Bandung Gedebage SPP", 
      schedule_time: "09:00 Mon-Wed-Fri",
      manifests: [
        { code: "MNF-REG-402", weight: 250, source: "Jakarta Pusat KCU" },
        { code: "MNF-REG-403", weight: 150, source: "Jakarta Timur DC" }
      ],
      total_weight_kg: 400,
      action_recommended: "Merge into lightweight van dispatch instead of CDD Truck",
      status: "Merged"
    }
  ]);

  // Capacity Reservation Form Fields
  const [newRes, setNewRes] = useState({
    route_id: "R001",
    schedule_id: "S001",
    reserved_weight: 1500,
    reserved_volume: 6,
    priority: "Express",
    allocation_strategy: "Priority Based",
    notes: ""
  });

  // UI Local Actions Feedback
  const [alertLogs, setAlertLogs] = useState<any[]>([
    { id: 1, type: "warn", message: "Capacity Remaining < 20% on Lintas Jawa Utara Route R001 (Slot SLOT-RES-001)", time: "10 mins ago" },
    { id: 2, type: "danger", message: "Capacity Overbooked Shortage alert triggered on Route R004 (Jakarta - Medan)", time: "30 mins ago" },
    { id: 3, type: "info", message: "Vehicle Fully Reserved for Booking Reference PK-GIA-737", time: "1 hour ago" },
    { id: 4, type: "danger", message: "Forecast Capacity Shortage: Predicted peak volume 12 Ton exceeds current capacity on Route R001", time: "2 hours ago" }
  ]);

  // Loading indicator for server fetch
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState("");

  // Re-fetch helper to test database connectivity
  const fetchPhase3Data = async () => {
    setIsSyncing(true);
    setSyncFeedback("Loading database records...");
    try {
      const response = await fetch('/api/data');
      if (response.ok) {
        const body = await response.json();
        if (body.reservations && body.reservations.length > 0) {
          // Merge or load from DB if migrated
          setReservations(body.reservations);
        }
        setSyncFeedback("Pristine database state updated!");
      } else {
        setSyncFeedback("Local storage fallback loaded.");
      }
    } catch (e) {
      setSyncFeedback("Standard sandbox local simulation mode active.");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(""), 4000);
    }
  };

  useEffect(() => {
    fetchPhase3Data();
  }, []);

  // --- CALCULATORS AND TRIGGERS ---
  
  // Real-time Selected Reservation Route capacity calculation
  const selectedRouteInfo = routes.find(r => r.id === newRes.route_id) || { route_name: "Rute Lintas Jawa", capacity_kg: 4000 };
  const selectedSlot = bookingSlots.find(s => s.route_id === newRes.route_id) || { totalCapacity_kg: 4000, reserved: 3000 };
  
  const currentAvailableCapacity = Math.max(0, selectedSlot.totalCapacity_kg - selectedSlot.reserved);
  const isInsufficient = newRes.reserved_weight > currentAvailableCapacity;
  const shortageAmount = isInsufficient ? (newRes.reserved_weight - currentAvailableCapacity) : 0;

  // --- VEHICLE PLANNING ENGINE (VRP Calculator) ---
  const [vrpForecast, setVrpForecast] = useState(15000); // Slider 0 - 50 Ton (KG)
  const [vrpVehicleCapacity, setVrpVehicleCapacity] = useState(4000); // 4 Ton / CDD
  const vehicleCountRec = Math.ceil(vrpForecast / vrpVehicleCapacity);

  // --- LOAD PLANNING ENGINE ---
  const [loadTotalWeight, setLoadTotalWeight] = useState(7500); // Preset
  // Recommends CDD A (4000 KG) & CDD B (3500 KG) -> Utilization: 93.75%
  const loadUtilPercentage = Math.min(100, Math.round((loadTotalWeight / 8000) * 100 * 100) / 100);

  // ADD NEW RESERVATION ACTIVE FLOW
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const resCode = `RES-2026-0${reservations.length + 1}`;
    const rName = routes.find(r => r.id === newRes.route_id)?.route_name || "LINTAS EXPRES";

    const payload = {
      reservation_code: resCode,
      route_id: newRes.route_id,
      schedule_id: newRes.schedule_id,
      reserved_weight: newRes.reserved_weight,
      reserved_volume: newRes.reserved_volume,
      priority: newRes.priority,
      status: "Reserved",
      allocation_strategy: newRes.allocation_strategy,
      created_by: currentUser?.username || 'Planner',
      notes: newRes.notes,
      auditLog: {
        id: `AUDIT-${Date.now()}`,
        created_at: new Date().toISOString(),
        created_by: currentUser?.username || 'System',
        action_description: `Membuat Reservasi Kapasitas baru ${resCode} untuk rute ${rName} sebesar ${newRes.reserved_weight} KG.`
      }
    };

    // Optimistic UI updates
    setReservations(prev => [
      {
        ...payload,
        id: Date.now(),
        routeName: `${rName} (Selected Corridor)`,
      },
      ...prev
    ]);

    // Subtract from available slots
    setBookingSlots(prev => prev.map(slot => {
      if (slot.route_id === newRes.route_id) {
        return {
          ...slot,
          reserved: slot.reserved + Number(newRes.reserved_weight)
        };
      }
      return slot;
    }));

    // Trigger alert log if slot occupancy climbs above rule engine capacityAlertThreshold
    const newOccupancy = ((selectedSlot.reserved + Number(newRes.reserved_weight)) / selectedSlot.totalCapacity_kg) * 100;
    if (newOccupancy >= rules.capacityAlertThreshold) {
      setAlertLogs(prev => [
        {
          id: Date.now(),
          type: "danger",
          message: `Kapasitas Overbooked / Terbatas (>= ${rules.capacityAlertThreshold}%) terdeteksi di slot ${resCode}. Tingkat okupansi rute mencapai ${Math.round(newOccupancy)}% !`,
          time: "Just now"
        },
        ...prev
      ]);
    } else {
      setAlertLogs(prev => [
        {
          id: Date.now(),
          type: "info",
          message: `Reservasi ${resCode} berhasil dibuat dengan alur alokasi ${newRes.allocation_strategy}.`,
          time: "Just now"
        },
        ...prev
      ]);
    }

    // Server-side persist route tries
    try {
      await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("Operation completed locally.");
    }

    // Reset Form
    setNewRes(prev => ({
      ...prev,
      reserved_weight: 1000,
      reserved_volume: 4,
      notes: ""
    }));

    // Switch view to reservation history table
    setActiveTab('reservation');
  };

  // CANCEL RESERVATION AND RELEASE AUTOMATIC VALUE BACK
  const handleCancelReservation = async (id: number, code: string, weight: number, rId: string) => {
    // Modify local state
    setReservations(prev => prev.map(res => {
      if (res.id === id) return { ...res, status: 'Cancelled' };
      return res;
    }));

    // Return slots to available
    setBookingSlots(prev => prev.map(slot => {
      if (slot.route_id === rId) {
        return {
          ...slot,
          reserved: Math.max(0, slot.reserved - weight)
        };
      }
      return slot;
    }));

    // Log release transaction
    setReleases(prev => [
      {
        id: Date.now(),
        reservation_code: code,
        released_weight: weight,
        released_at: new Date().toISOString(),
        released_by: currentUser?.username || 'Planner override'
      },
      ...prev
    ]);

    setAlertLogs(prev => [
      {
        id: Date.now(),
        type: "warn",
        message: `Reservasi ${code} dibatalkan. Kapasitas ${weight} KG otomatis dikembalikan ke Slot Available.`,
        time: "Just now"
      },
      ...prev
    ]);

    // Send server-side cancellation patch
    try {
      await fetch(`/api/reservations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Cancelled',
          released_by: currentUser?.username || 'Planner',
          released_weight: weight,
          released_volume: 0,
          auditLog: {
            id: `AUDIT-${Date.now()}`,
            created_at: new Date().toISOString(),
            created_by: currentUser?.username || 'System',
            action_description: `Pembatalan Reservasi ${code}. Mengembalikan kapasitas ${weight} KG ke pool rute.`
          }
        })
      });
    } catch (e) {}
  };

  // CONSOLIDATION TRIGGER
  const handleExecuteMerge = async (cId: number) => {
    setConsolidations(prev => prev.map(c => {
      if (c.id === cId) return { ...c, status: 'Merged' };
      return c;
    }));

    setAlertLogs(prev => [
      {
        id: Date.now(),
        type: "info",
        message: `Konsolidasi manifest sukses! Pengiriman digabung dalam satu sasis transport utama.`,
        time: "Just now"
      },
      ...prev
    ]);

    try {
      await fetch(`/api/consolidations/${cId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Merged' })
      });
    } catch (e) {}
  };

  // --- DATA VISUALIZATION DATA PROCESS ---
  const reservationDashboardData = bookingSlots.map(slot => {
    const routeCode = routes.find(r => r.id === slot.route_id)?.route_code || slot.route_id;
    return {
      name: routeCode,
      Kapasitas: slot.totalCapacity_kg,
      Dipesan: slot.reserved,
      Tersedia: Math.max(0, slot.totalCapacity_kg - slot.reserved),
      Occupancy: Math.round((slot.reserved / slot.totalCapacity_kg) * 100)
    };
  });

  const priorityDistribution = [
    { name: 'Express', value: reservations.filter(r => r.status === 'Reserved' && r.priority === 'Express').length * 3000 + 1000 },
    { name: 'Q9', value: 2000 },
    { name: 'Paket Jumbo', value: 4500 },
    { name: 'Logistik', value: 8000 },
    { name: 'EMS', value: 1500 },
    { name: 'Corporate', value: 12000 }
  ];

  const COLORS = ['#0ea5e9', '#06b6d4', '#14b8a6', '#f59e0b', '#3b82f6', '#8b5cf6'];

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6" id="phase3-planning-hub">
      
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <span className="bg-gradient-to-r from-cyan-600 to-sky-600 text-white text-xs font-bold font-mono px-2.5 py-1 rounded-md tracking-wider">
              PHASE 3 ENHANCED
            </span>
            {isSyncing && <RefreshCw className="w-4 h-4 text-cyan-600 animate-spin" />}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 mt-1">
            Proactive Capacity Planning Hub
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Seat management, load planning, forecasting engine, dan konsolidasi manifest otomatis untuk Pos Indonesia 2026.
          </p>
        </div>

        {syncFeedback && (
          <span className="text-[11px] font-mono text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-md border border-cyan-100 transition-all">
            {syncFeedback}
          </span>
        )}

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchPhase3Data}
            title="Refresh Server Connection"
            className="p-2.5 rounded-lg border border-slate-200 hover:bg-white text-slate-500 hover:text-slate-700 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 bg-slate-100 px-3 py-2 rounded-lg border border-slate-150">
            Method: <strong className="text-slate-700">{rules.allocationMethod}</strong>
          </span>
        </div>
      </div>

      {/* 2. NAVIGATION TABS SUBSECTION */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl max-w-fit border border-slate-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'dashboard' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" /> Dashboard KPI
        </button>

        <button
          onClick={() => setActiveTab('reservation')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'reservation' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Capacity Reservation
        </button>

        <button
          onClick={() => setActiveTab('vehicle')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'vehicle' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
          }`}
        >
          <Truck className="w-3.5 h-3.5" /> Vehicle Requirement VRP
        </button>

        <button
          onClick={() => setActiveTab('load')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'load' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Load Planning
        </button>

        <button
          onClick={() => setActiveTab('forecast')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'forecast' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Predictive Forecasting
        </button>

        <button
          onClick={() => setActiveTab('consolidation')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'consolidation' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-605 hover:text-slate-900 hover:bg-slate-50/50'
          }`}
        >
          <Shuffle className="w-3.5 h-3.5" /> Consolidation Engine
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'rules' ? 'bg-white text-cyan-700 shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/50'
          }`}
        >
          <Settings className="w-3.5 h-3.5" /> Rule Engine Config
        </button>
      </div>

      {/* 3. CONDITIONAL MAIN DISPLAY SEGMENTS */}

      {/* SUB-SECTION 1: DASHBOARD KPI */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* A. 4 METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Total Available Slots</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-slate-800">58,000 <span className="text-xs font-normal text-slate-500">KG</span></p>
                <span className="text-xs font-semibold text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">100% Core</span>
              </div>
              <p className="text-[10px] text-slate-500">Kapasitas total hub terdaftar dalam rute aktif</p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Reserved Volume</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-cyan-700">21,200 <span className="text-xs font-normal text-slate-500">KG</span></p>
                <span className="text-xs font-semibold text-cyan-600 flex items-center bg-cyan-50 px-1.5 py-0.5 rounded">36.5% Occupancy</span>
              </div>
              <p className="text-[10px] text-slate-500">Kapasitas aman di-blok pengirim eksternal/internal</p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Current Idle Capacity</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-emerald-700">36,800 <span className="text-xs font-normal text-slate-500">KG</span></p>
                <span className="text-xs font-semibold text-emerald-600 flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">63.5% Ready</span>
              </div>
              <p className="text-[10px] text-slate-500">Sisa seat kapasitas yang masih dapat dipesan</p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Reservation Confirmed</p>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-black text-indigo-700">
                  {reservations.filter(r => r.status === 'Confirmed').length} / {reservations.length}
                </p>
                <span className="text-xs font-semibold text-indigo-600 flex items-center bg-indigo-50 px-1.5 py-0.5 rounded">Real Time</span>
              </div>
              <p className="text-[10px] text-slate-500">Status rilis manifest siap di iPOS5</p>
            </div>
          </div>

          {/* B. ANALYTICS BLOCK (RECHARTS) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* OCCUPANCY SLOT GRAPH */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-600" /> Slot Seat Occupancy per Rute Koridor
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Analisis kapasitas terpesan vs slot aman tersedia di visualisasi real-time.</p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reservationDashboardData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Dipesan" fill="#0ea5e9" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Tersedia" fill="#e2e8f0" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PRIORITY QUOTA METRIC CIRCLE */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" /> Distribusi Muatan per Kelas Layanan
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Berdasarkan bobot (KG) reservasi aktif.</p>
              </div>

              <div className="h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute text-center">
                  <p className="text-xs text-slate-400 font-mono">Top Heavy</p>
                  <p className="text-lg font-black text-slate-800">Corporate</p>
                </div>
              </div>

              {/* Legends */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                {priorityDistribution.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span className="text-[9px] text-slate-500 font-bold max-w-[50px] truncate">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* C. REAL-TIME ALERTS ENGINE */}
          <div className="bg-amber-50/50 rounded-xl border border-amber-200/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Live Alert Engine Logs
              </h3>
              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Active Threshold {rules.capacityAlertThreshold}%
              </span>
            </div>

            <div className="divide-y divide-amber-100/30 font-mono text-xs">
              {alertLogs.map((alert) => (
                <div key={alert.id} className="py-2.5 flex items-start gap-2 justify-between">
                  <div className="flex items-start gap-2">
                    {alert.type === 'danger' ? (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <span className="text-slate-700 leading-relaxed">{alert.message}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 whitespace-nowrap shrink-0">{alert.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 2: CAPACITY RESERVATION SCREEN */}
      {activeTab === 'reservation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* A. NEW RESERVATION FORM COLUMN */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Buat Reservasi Kapasitas Baru
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Alokasikan slot sebelum manifest keluar dari iPOS5 untuk menjamin ketersediaan armada.
              </p>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-4 text-xs text-slate-600">
              
              <div className="space-y-1">
                <label className="font-semibold block text-slate-700">Pilih Rute Koridor</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-slate-800 focus:bg-white focus:ring-1 focus:ring-cyan-600"
                  value={newRes.route_id}
                  onChange={(e) => {
                    const selectedRouteId = e.target.value;
                    let targetSched = "S001";
                    if (selectedRouteId === "R002") targetSched = "S002";
                    if (selectedRouteId === "R003") targetSched = "S003";
                    setNewRes(prev => ({ ...prev, route_id: selectedRouteId, schedule_id: targetSched }));
                  }}
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.route_code} - {r.route_name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-slate-700">Jadwal Keberangkatan Terikat</label>
                <select
                  value={newRes.schedule_id}
                  onChange={(e) => setNewRes(prev => ({ ...prev, schedule_id: e.target.value }))}
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-slate-800"
                >
                  <option value="S001">S001 - Jam 08:00 WIB (Lintas Jawa Utara)</option>
                  <option value="S002">S002 - Jam 09:00 WIB (Priangan Barat)</option>
                  <option value="S003">S003 - Jam 14:00 WIB (Bandara Soetta Gateway)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold block text-slate-700">Diminta Weight (KG)</label>
                  <input 
                    type="number"
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg font-mono text-slate-800"
                    placeholder="3000"
                    min="1"
                    value={newRes.reserved_weight}
                    onChange={(e) => setNewRes(prev => ({ ...prev, reserved_weight: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-slate-700">Diminta Volume (M³)</label>
                  <input 
                    type="number"
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg font-mono text-slate-800"
                    placeholder="12"
                    min="1"
                    value={newRes.reserved_volume}
                    onChange={(e) => setNewRes(prev => ({ ...prev, reserved_volume: Number(e.target.value) }))}
                  />
                </div>
              </div>

              {/* SEAT MANAGEMENT REALTIME OCCUPANCY BAR */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/50 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-cyan-600" /> Seat Occupancy SLOT
                  </span>
                  <span className="font-mono text-slate-400">CDD: 4000 KG Max</span>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono mt-1 text-slate-500">
                  <span>Reserved: {selectedSlot.reserved} KG</span>
                  <span>Available: {currentAvailableCapacity} KG</span>
                </div>

                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-cyan-500 h-full transition-all"
                    style={{ width: `${Math.min(100, (selectedSlot.reserved / selectedSlot.totalCapacity_kg) * 100)}%` }}
                  />
                  <div 
                    className="bg-indigo-300 h-full transition-all"
                    style={{ width: `${Math.min(100 - (selectedSlot.reserved / selectedSlot.totalCapacity_kg) * 100, (newRes.reserved_weight / selectedSlot.totalCapacity_kg) * 100)}%` }}
                  />
                </div>

                {isInsufficient && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded text-[11px] font-mono leading-relaxed space-y-1">
                    <div className="flex items-center gap-1 font-bold text-red-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>INSUFFICIENT CAPACITY!</span>
                    </div>
                    <div>Sisa Tersedia: {currentAvailableCapacity} KG</div>
                    <div>Diminta: {newRes.reserved_weight} KG</div>
                    <div className="font-bold text-red-900 text-xs pt-0.5 border-t border-red-200/60 mt-1">
                      Kekurangan (Shortage): {shortageAmount} KG
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-slate-700">Shipment Priority Grade</label>
                <select
                  value={newRes.priority}
                  onChange={(e) => setNewRes(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-slate-800"
                >
                  <option value="Express">Express (Prioritas Utama / Q9 Terpilih)</option>
                  <option value="Q9">Q9 (Pos Sameday)</option>
                  <option value="Paket Jumbo">Paket Jumbo</option>
                  <option value="Logistik">Logistik Reguler</option>
                  <option value="EMS">EMS Internasional</option>
                  <option value="Corporate">Corporate / Kontrak Kerjasama</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-slate-700">Allocation Strategy</label>
                <select
                  value={newRes.allocation_strategy}
                  onChange={(e) => setNewRes(prev => ({ ...prev, allocation_strategy: e.target.value }))}
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-slate-800"
                >
                  <option value="First Come First Serve">First Come First Serve (FCFS)</option>
                  <option value="Priority Based">Priority Based (Ubah prioritas jika sempit)</option>
                  <option value="Quota Based">Quota Based (Membagi kuota porsi layanan)</option>
                  <option value="Hybrid">Hybrid Strategy</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold block text-slate-700">Catatan Khusus</label>
                <textarea 
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg"
                  rows={2}
                  value={newRes.notes}
                  onChange={(e) => setNewRes(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Instruksi muatan kargo khusus..."
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 transition-all rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Simpan Reservasi Slot
              </button>

            </form>
          </div>

          {/* B. RESERVATIONS LIST COLUMN */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Daftar Reservasi &amp; Status Alokasi</h3>
                <p className="text-[11px] text-slate-500">Log order reservasi kapasitas aktif dengan kendali penuh rilis muatan.</p>
              </div>

              <span className="text-xs font-mono text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-md border border-cyan-100">
                Active: <strong>{reservations.filter(r => r.status === 'Reserved' || r.status === 'Confirmed').length} Slots</strong>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-3">Ref Code</th>
                    <th className="p-3">Rute / Jadwal</th>
                    <th className="p-3 text-right">Muatan (Weight/Vol)</th>
                    <th className="p-3">Prioritas</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reservations.slice(0, 25).map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="p-3 font-mono font-bold text-[11px] text-slate-800">
                        {res.reservation_code}
                      </td>
                      <td className="p-3 space-y-0.5">
                        <p className="font-semibold text-slate-800">{res.routeName || `Rute ${res.route_id}`}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID Schedule: {res.schedule_id} • Alur: {res.allocation_strategy}</p>
                      </td>
                      <td className="p-3 text-right font-mono text-[11px]">
                        <p className="font-bold text-slate-800">{res.reserved_weight} KG</p>
                        <p className="text-slate-400 text-[10px]">{res.reserved_volume} M³</p>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          res.priority === 'Express' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          res.priority === 'Q9' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          res.priority === 'Corporate' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {res.priority}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          res.status === 'Confirmed' ? 'bg-emerald-150 text-emerald-800' :
                          res.status === 'Reserved' ? 'bg-cyan-150 text-cyan-800 animate-pulse' :
                          res.status === 'Cancelled' ? 'bg-red-50 text-red-700 line-through' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {res.status === 'Reserved' || res.status === 'Draft' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                // Confirm
                                setReservations(prev => prev.map(r => r.id === res.id ? { ...r, status: 'Confirmed' } : r));
                                setAlertLogs(prev => [
                                  {
                                    id: Date.now(),
                                    type: "info",
                                    message: `Reservasi ${res.reservation_code} berhasil ditandai CONFIRMED. Siap dijadwalkan ke iPOS5.`,
                                    time: "Just now"
                                  },
                                  ...prev
                                ]);
                              }}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100/85 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold cursor-pointer transition-all"
                              title="Tandai Confirmed"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleCancelReservation(res.id, res.reservation_code, res.reserved_weight, res.route_id)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100/85 text-red-700 border border-red-200 rounded text-[11px] font-bold cursor-pointer transition-all"
                              title="Batalkan (Kembalikan Kapasitas)"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono italic">Released</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CAPACITY RELEASE RELEASES TRACK LOG */}
            {releases.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                  <Archive className="w-3.5 h-3.5 text-slate-500" /> Histori Release Capacity (Automatic Reflow)
                </h4>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/50 divide-y divide-slate-150 text-[11px] font-mono text-slate-500">
                  {releases.slice(0, 25).map(rel => (
                    <div key={rel.id} className="py-2 flex items-center justify-between">
                      <span>Order <strong className="text-slate-700">{rel.reservation_code}</strong> dibatalkan/dilepas</span>
                      <span className="text-emerald-700 font-bold font-mono">+{rel.released_weight} KG Reflowed</span>
                      <span className="text-slate-400 text-[10px]">{new Date(rel.released_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* SUB-SECTION 3: VEHICLE REQUIREMENT PLANNING (VRP) */}
      {activeTab === 'vehicle' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Vehicle Requirement Planning (VRP)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Algoritma pemenuhan armada berdasarkan proyeksi volume kargo harian/mingguan dan kapasitas masing-masing tipe kendaraan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-5 text-xs text-slate-600">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Input Variabel Perencanaan
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">Forecast Volume Kargo</span>
                  <span className="text-cyan-700 font-mono font-bold">{vrpForecast.toLocaleString()} KG</span>
                </div>
                <input 
                  type="range"
                  min="1000"
                  max="50000"
                  step="500"
                  value={vrpForecast}
                  onChange={(e) => setVrpForecast(Number(e.target.value))}
                  className="w-full accent-cyan-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1,000 KG</span>
                  <span>50,000 KG</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold block text-slate-700">Pilih Kapasitas Unit Kendaraan</label>
                <select
                  value={vrpVehicleCapacity}
                  onChange={(e) => setVrpVehicleCapacity(Number(e.target.value))}
                  className="w-full p-3 border border-slate-200 bg-white rounded-lg text-slate-800 text-xs"
                >
                  <option value={4000}>CDD Box Medium Truck (4.000 KG)</option>
                  <option value={8000}>Fuso Box Large Truck (8.000 KG)</option>
                  <option value={15000}>Wingbox Heavy Truck (15.000 KG)</option>
                  <option value={2000}>Blindvan Courier (2.000 KG)</option>
                </select>
              </div>

              <div className="p-3.5 bg-cyan-50/50 rounded-lg border border-cyan-150/60 leading-relaxed font-semibold text-cyan-900 text-[11px] font-mono">
                <p>Formula Rekomendasi:</p>
                <code className="block mt-1 font-bold text-cyan-800">Count = Ceil( Forecast Volume / Vehicle Capacity )</code>
              </div>
            </div>

            {/* REC RESULT COLUMN */}
            <div className="p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl shadow-md flex flex-col justify-between">
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 px-2.5 bg-indigo-500/25 border border-indigo-400/20 text-indigo-200 rounded-md text-[10px] uppercase font-mono tracking-wider font-bold">
                    System recommendation engine
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-indigo-200 font-mono">Kebutuhan Unit Armada Direkomendasikan:</p>
                  <p className="text-4xl font-extrabold tracking-tight text-white flex items-baseline gap-1.5">
                    {vehicleCountRec} <span className="text-sm font-normal text-indigo-200">Mitra Kendaraan</span>
                  </p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Menyediakan <strong className="text-white">{vehicleCountRec} x {vrpVehicleCapacity === 4000 ? 'CDD Box' : vrpVehicleCapacity === 8000 ? 'Fuso Box' : vrpVehicleCapacity === 15000 ? 'Wingbox Heavy' : 'Blindvan'}</strong> untuk rute ini dapat mengamankan total volume <strong className="text-white">{vrpForecast.toLocaleString()} KG</strong> dengan load factor aman.
                </p>
              </div>

              <div className="border-t border-indigo-500/30 pt-4 mt-6 flex items-center justify-between text-xs font-mono text-indigo-200">
                <span>Security reserve: O-S-Log</span>
                <span className="flex items-center gap-1 font-bold text-white">
                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Optimal Dispatch
                </span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SUB-SECTION 4: LOAD PLANNING SCREEN */}
      {activeTab === 'load' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Load Planning &amp; Layout Optimasi
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Planner dibantu sistem menentukan penugasan kargo ke dalam armada dengan meminimalkan ruang kosong (Overlapping/Load optimization).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">Input Total muatan:</span>
              <input 
                type="number"
                className="w-24 p-2 border border-slate-200 rounded-lg text-xs font-mono text-right"
                value={loadTotalWeight}
                onChange={(e) => setLoadTotalWeight(Number(e.target.value))}
                min="500"
                max="8000"
              />
              <span className="text-xs text-slate-500">KG</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-700 uppercase tracking-widest">Available Fleets Pool</h4>
              <div className="space-y-2">
                <div className="p-3 bg-white rounded border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">CDD Box A (F001)</p>
                    <p className="text-[10px] text-slate-400 font-mono">B-9001-POS • Capacity: 4000 KG</p>
                  </div>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">Ready</span>
                </div>

                <div className="p-3 bg-white rounded border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">CDD Box B (F002)</p>
                    <p className="text-[10px] text-slate-400 font-mono">B-9543-POS • Capacity: 4000 KG</p>
                  </div>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">Ready</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 p-5 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1">
                <UserCheck className="w-4 h-4 text-cyan-600" /> Hasil Rekomendasi Load Planning Layout
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-4 bg-white rounded-lg border border-cyan-200 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-cyan-800">CDD Box A (F001)</span>
                    <span className="text-[10px] font-mono text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded font-bold">Full Load (100%)</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Beban Terisi:</span>
                      <span>4,000 KG</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Dimaksimalkan untuk paket express SLA terpendek harian.</div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">CDD Box B (F002)</span>
                    <span className="text-[10px] font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-bold">Partial Load ({Math.round(Math.max(0, loadTotalWeight - 4000) / 4000 * 100)}%)</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span>Beban Terisi:</span>
                      <span>{Math.max(0, loadTotalWeight - 4000).toLocaleString()} KG</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Sisa muatan diposisikan di bak belakang untuk kemudahan bongkar hub.</div>
                  </div>
                </div>

              </div>

              {/* OVERALL STATISTICS */}
              <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="space-y-1">
                  <p className="font-mono text-slate-500 text-[11px]">Utilization Multi-vehicle calculation:</p>
                  <p className="text-xl font-black text-slate-800">
                    Overall Load Factor: <span className="text-cyan-700">{loadUtilPercentage}%</span>
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setAlertLogs(prev => [
                      {
                        id: Date.now(),
                        type: "info",
                        message: `Layout Load-Planning tersimpan! Menggunakan CDD A (4000 KG) dan CDD B (${(loadTotalWeight - 4000)} KG) dengan efisiensi ${loadUtilPercentage}% `,
                        time: "Just now"
                      },
                      ...prev
                    ]);
                  }}
                  className="px-4 py-2.5 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-lg cursor-pointer transition-all"
                >
                  Gunakan Layout Planning
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SUB-SECTION 5: CAPACITY FORECAST SCREEN */}
      {activeTab === 'forecast' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Corridor Capacity Forecasting
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Gunakan analisa historis manifest bulanan untuk mendeteksi gap kapasitas yang rentan terjadi kemacetan di rute utama.
            </p>
          </div>

          {/* HISTORICAL RECHARTS LINE GRAPH */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Histori Volume Angkutan (Next Week Prediction)</h4>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Prediksi Volume Mingguanvs Alokasi Kapasitas Kontrak Logistik</p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { week: 'W1', JakartaSurabaya: 9500, JakartaMedan: 14000, JakartaBandung: 4000 },
                  { week: 'W2', JakartaSurabaya: 10500, JakartaMedan: 16000, JakartaBandung: 5200 },
                  { week: 'W3', JakartaSurabaya: 11000, JakartaMedan: 19000, JakartaBandung: 4800 },
                  { week: 'W4 [Next Week]', JakartaSurabaya: 12000, JakartaMedan: 22000, JakartaBandung: 6200 },
                ]} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="JakartaSurabaya" stroke="#0ea5e9" strokeWidth={3} name="Jakarta - Surabaya (R001)" />
                  <Line type="monotone" dataKey="JakartaMedan" stroke="#8b5cf6" strokeWidth={3} name="Jakarta - Medan (R004)" />
                  <Line type="monotone" dataKey="JakartaBandung" stroke="#10b981" strokeWidth={2} name="Jakarta - Bandung (R002)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GAP ANALYSIS PANEL */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest">Corridor-wise Capacity Gap Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forecasts.map(forInst => {
                const isOver = forInst.gap > 0;
                return (
                  <div key={forInst.id} className="p-4 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-slate-800">{forInst.from} → {forInst.to}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Period: {forInst.period} • Peak Season Multiplier: {forInst.peakFactor}</p>
                      
                      <div className="flex items-center gap-2 mt-2 font-mono text-[11px] text-slate-600">
                        <span>Predicted: <strong>{forInst.predicted.toLocaleString()} KG</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Capacity: <strong>{forInst.current.toLocaleString()} KG</strong></span>
                      </div>
                    </div>

                    <div className="text-right">
                      {isOver ? (
                        <span className="inline-block p-1 bg-amber-50 text-amber-700 border border-amber-200 rounded font-mono font-bold text-[11px]">
                          GAP: {forInst.gap.toLocaleString()} KG SHORTAGE
                        </span>
                      ) : (
                        <span className="inline-block p-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono font-bold text-[11px]">
                          SAVING: {Math.abs(forInst.gap).toLocaleString()} KG IDLE
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SUB-SECTION 6: CONSOLIDATION ENGINE SCREEN */}
      {activeTab === 'consolidation' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Consolidation Recommendation Engine
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Algoritma cerdas yang mendeteksi manifest-manifest berukuran kecil yang memiliki destinasi dan jadwal yang serupa untuk digabungkan demi efisiensi biaya.
            </p>
          </div>

          <div className="space-y-4">
            {consolidations.slice(0, 25).map(conRec => (
              <div 
                key={conRec.id} 
                className={`p-5 rounded-xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  conRec.status === 'Merged' ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider font-mono ${
                      conRec.status === 'Merged' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {conRec.status === 'Merged' ? 'CONSOLIDATED' : 'PROPOSED'}
                    </span>
                    <span className="font-bold text-slate-800">{conRec.destination}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500 font-mono">Keberangkatan: {conRec.schedule_time}</span>
                  </div>

                  {/* List of small candidate manifests */}
                  <div className="space-y-1.5 pl-3 border-l-2 border-slate-300">
                    <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">Manifests Grouped:</p>
                    <div className="flex flex-wrap gap-2">
                      {conRec.manifests.map((mnf: any) => (
                        <span key={mnf.code} className="bg-white p-1.5 pr-2.5 rounded border border-slate-200 text-[10px] font-mono text-slate-600 flex items-center gap-1 shadow-2xs">
                          <FileText className="w-3 h-3 text-cyan-600" /> {mnf.code} ({mnf.weight} KG • {mnf.source})
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="font-mono text-[11px] text-cyan-800 flex items-center gap-1 font-bold pt-2">
                    <Info className="w-3.5 h-3.5 text-cyan-600" /> Rekomendasi: {conRec.action_recommended}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  {conRec.status === 'Pending' ? (
                    <button 
                      onClick={() => handleExecuteMerge(conRec.id)}
                      className="px-4 py-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <Shuffle className="w-3.5 h-3.5" /> Gabungkan Eksekusi
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600" /> Berhasil Digabung
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* SUB-SECTION 7: CONIFIGURABLE BUSINESS RULES ENGINE */}
      {activeTab === 'rules' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Business Rule Engine [Sandbox Configuration]
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Sebagai Administrator atau National Transport Planner Anda dapat mengkonfigurasi bobot prioritas dan threshold peringatan sistem secara dinamis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-700">
            
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest pb-1 border-b border-slate-100">Priority Level Weights</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Express Priority</label>
                  <input 
                    type="number"
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded"
                    value={rules.priorityWeightExpress}
                    onChange={(e) => setRules(prev => ({ ...prev, priorityWeightExpress: Number(e.target.value) }))}
                    min="1"
                    max="10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Q9 Priority</label>
                  <input 
                    type="number"
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded"
                    value={rules.priorityWeightQ9}
                    onChange={(e) => setRules(prev => ({ ...prev, priorityWeightQ9: Number(e.target.value) }))}
                    min="1"
                    max="10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Corporate</label>
                  <input 
                    type="number"
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded"
                    value={rules.priorityWeightCorporate}
                    onChange={(e) => setRules(prev => ({ ...prev, priorityWeightCorporate: Number(e.target.value) }))}
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Reservation Expiry Window (Hours)</label>
                <input 
                  type="number"
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded"
                  value={rules.reservationExpiryHours}
                  onChange={(e) => setRules(prev => ({ ...prev, reservationExpiryHours: Number(e.target.value) }))}
                  min="1"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">Setelah durasi berakhir, status DRAFT akan dibatalkan otomatis oleh sistem.</span>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest pb-1 border-b border-slate-100">Threshold &amp; Allocation Method</h4>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Capacity Allocation Logic</label>
                <select
                  value={rules.allocationMethod}
                  onChange={(e: any) => setRules(prev => ({ ...prev, allocationMethod: e.target.value }))}
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded"
                >
                  <option value="First Come First Serve">First Come First Serve (FCFS)</option>
                  <option value="Priority Based">Priority Based Strategy (Recommended)</option>
                  <option value="Quota Based">Quota Based Strategy</option>
                  <option value="Hybrid">Hybrid Allocation Mechanism</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Capacity Alert Threshold (%)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded font-mono"
                    value={rules.capacityAlertThreshold}
                    onChange={(e) => setRules(prev => ({ ...prev, capacityAlertThreshold: Number(e.target.value) }))}
                    min="10"
                    max="100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Forecast GAP Alert (%)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded font-mono"
                    value={rules.forecastThreshold}
                    onChange={(e) => setRules(prev => ({ ...prev, forecastThreshold: Number(e.target.value) }))}
                    min="5"
                    max="50"
                  />
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-150 rounded leading-relaxed text-[11px] text-indigo-950 font-bold">
                <p>💡 Aturan Teraktivasi:</p>
                <ul className="list-disc pl-4 space-y-0.5 mt-1 font-normal font-mono">
                  <li>Layanan utama Express mengamankan slot {rules.allocationMethod === 'Priority Based' ? 'lebih awal' : 'sesuai urutan manifest'}.</li>
                  <li>Sistem mengirimkan peringatan (Alert Log) jika occupancy rute mencapai &gt;= {rules.capacityAlertThreshold}%.</li>
                </ul>
              </div>

            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => {
                setAlertLogs(prev => [
                  {
                    id: Date.now(),
                    type: "info",
                    message: "Aturan bisnis (Business Rules Engine) berhasil dimutakhirkan secara global.",
                    time: "Just now"
                  },
                  ...prev
                ]);
              }}
              className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1 text-right"
            >
              <CheckCircle className="w-4 h-4" /> Terapkan Aturan Baru
            </button>
          </div>

        </div>
      )}

      {/* 4. FUTURE ACTION FOOTNOTE PREPARATION */}
      <footer className="bg-slate-100/60 rounded-xl p-4 border border-slate-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-0.5 text-xs">
          <p className="font-bold text-slate-700">Future Phase Preparation</p>
          <p className="text-slate-400 font-mono text-[10px]">Database &amp; APIs ready for Phase 4 (Routing Optimization Engine) &amp; Phase 5 (Autonomous decision logic)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="p-1 px-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded font-mono text-[10px] uppercase font-bold">
            Pos Indonesia EA Compliant
          </span>
        </div>
      </footer>

    </div>
  );
}
