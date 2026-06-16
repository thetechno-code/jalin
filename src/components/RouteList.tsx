import React, { useState, useMemo } from 'react';
import { Route, Office, Etape, Schedule, RouteCapacity, RouteCategory, TransportMode, WorkflowStatus } from '../types';
import { 
  Search, 
  Filter, 
  MapPin, 
  Truck, 
  Plane, 
  Ship, 
  Calendar, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  FileText, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react';

interface RouteListProps {
  routes: Route[];
  offices: Office[];
  etapes: Etape[];
  schedules: Schedule[];
  capacities: RouteCapacity[];
}

export default function RouteList({
  routes = [],
  offices = [],
  etapes = [],
  schedules = [],
  capacities = []
}: RouteListProps) {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // Sort state
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'capacity' | 'status' | 'mode'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Expanded route ID state for showing sub-etape/schedule details
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  // Helper: Get office name
  const getOfficeName = (code: string) => {
    return offices.find((o) => o.office_code === code)?.office_name || `Kantoor [${code}]`;
  };

  // Helper: Get office regional/type
  const getOfficeDetails = (code: string) => {
    const off = offices.find((o) => o.office_code === code);
    if (!off) return null;
    return `${off.office_type} - ${off.region_code}`;
  };

  // Toggle route details
  const handleToggleRoute = (routeId: string) => {
    if (expandedRouteId === routeId) {
      setExpandedRouteId(null);
    } else {
      setExpandedRouteId(routeId);
    }
  };

  // Status mapping for badge colors
  const getStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case 'Published':
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
      case 'Approved':
        return 'bg-cyan-50 text-cyan-800 border border-cyan-200';
      case 'Reviewed':
        return 'bg-blue-50 text-blue-800 border border-blue-200';
      case 'Submitted':
        return 'bg-amber-50 text-amber-800 border border-amber-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-800 border border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  // Transport Mode Icons & Styling
  const getModeSpec = (mode: TransportMode) => {
    switch (mode) {
      case 'Udara':
        return { icon: Plane, bg: 'bg-indigo-50 text-indigo-700 border-indigo-100', text: 'Udara (Cargo Air)' };
      case 'Laut':
        return { icon: Ship, bg: 'bg-sky-50 text-sky-700 border-sky-100', text: 'Laut (Maritime)' };
      default:
        return { icon: Truck, bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', text: 'Darat (Trucking)' };
    }
  };

  // Category Badge
  const getCategoryBadge = (category: RouteCategory) => {
    switch (category) {
      case 'Primer':
        return 'bg-purple-100 text-purple-800 border border-purple-200 font-bold';
      case 'Sekunder':
        return 'bg-teal-100 text-teal-800 border border-teal-200 font-medium';
      case 'Tertier':
        return 'bg-pink-100 text-pink-800 border border-pink-200';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  // Filter and Sort Processing
  const filteredAndSortedRoutes = useMemo(() => {
    let result = [...routes];

    // 1. Search Query filter (matches code or name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.route_code.toLowerCase().includes(query) ||
          r.route_name.toLowerCase().includes(query) ||
          r.origin_node.toLowerCase().includes(query) ||
          r.destination_node.toLowerCase().includes(query)
      );
    }

    // 2. Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((r) => r.route_category === selectedCategory);
    }

    // 3. Mode filter
    if (selectedMode !== 'all') {
      result = result.filter((r) => r.transport_mode === selectedMode);
    }

    // 4. Status filter
    if (selectedStatus !== 'all') {
      result = result.filter((r) => r.status === selectedStatus);
    }

    // 5. Sorting
    result.sort((a, b) => {
      let fieldA: any = '';
      let fieldB: any = '';

      if (sortBy === 'code') {
        fieldA = a.route_code;
        fieldB = b.route_code;
      } else if (sortBy === 'name') {
        fieldA = a.route_name;
        fieldB = b.route_name;
      } else if (sortBy === 'capacity') {
        fieldA = a.capacity_kg || 0;
        fieldB = b.capacity_kg || 0;
      } else if (sortBy === 'status') {
        fieldA = a.status;
        fieldB = b.status;
      } else if (sortBy === 'mode') {
        fieldA = a.transport_mode;
        fieldB = b.transport_mode;
      }

      if (typeof fieldA === 'string') {
        return sortOrder === 'asc'
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      } else {
        return sortOrder === 'asc' ? fieldA - fieldB : fieldB - fieldA;
      }
    });

    return result;
  }, [routes, searchQuery, selectedCategory, selectedMode, selectedStatus, sortBy, sortOrder]);

  // SLA/Stats breakdown
  const statsSummary = useMemo(() => {
    const total = routes.length;
    const published = routes.filter((r) => r.status === 'Published').length;
    const draft = routes.filter((r) => r.status === 'Draft').length;
    const activeModes = {
      Darat: routes.filter((r) => r.transport_mode === 'Darat').length,
      Udara: routes.filter((r) => r.transport_mode === 'Udara').length,
      Laut: routes.filter((r) => r.transport_mode === 'Laut').length
    };
    return { total, published, draft, activeModes };
  }, [routes]);

  // Top 25 Sliced
  const top100Routes = useMemo(() => {
    return filteredAndSortedRoutes.slice(0, 25);
  }, [filteredAndSortedRoutes]);

  const handleSortClick = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* 1. TOP OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block font-mono">
              Total Rute Terdaftar
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {statsSummary.total} <span className="text-xs font-normal text-slate-500">Rute</span>
            </span>
          </div>
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block font-mono">
              Rute Aktif (Published)
            </span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">
              {statsSummary.published} <span className="text-xs font-normal text-slate-500">Rute</span>
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block font-mono">
              Moda Darat &amp; Kereta
            </span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              {statsSummary.activeModes.Darat} <span className="text-xs font-normal text-slate-500">Koridor</span>
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block font-mono">
              Aviasi (Udara) &amp; Laut
            </span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              {statsSummary.activeModes.Udara + statsSummary.activeModes.Laut} <span className="text-xs font-normal text-slate-500">Jalur</span>
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            <Plane className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. FILTER & UTILITIES CONTROLS PANEL */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-600 animate-pulse" /> 
              Daftar Rute Logistik Nasional 
              <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 font-mono text-[10px] rounded-full font-black ml-1 shadow-inner">
                SUPABASE LIVE
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              Menampilkan rute logistik Pos Indonesia yang tersinkronasi langsung dengan Database PostgreSQL. 
              Dibatasi hanya <strong className="text-indigo-600">Top 25 Rute teratas</strong> untuk perlindungan bandwidth &amp; performa visual.
            </p>
          </div>

          {/* Active Counters matching */}
          <div className="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-200 flex items-center gap-2 select-none self-start md:self-auto">
            <span>Ditemukan: <span className="text-indigo-600 font-black">{filteredAndSortedRoutes.length}</span></span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">Tampil: <span className="text-emerald-600 font-black">{top100Routes.length} (Max 25)</span></span>
          </div>
        </div>

        {/* INPUTS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Cari Kode atau Nama Rute..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:bg-white placeholder-slate-400 transition"
            />
          </div>

          {/* Filter Category */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 font-mono uppercase whitespace-nowrap">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2 text-xs text-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">Semua Kategori</option>
              <option value="Primer">Primer</option>
              <option value="Sekunder">Sekunder</option>
              <option value="Tertier">Tertier</option>
            </select>
          </div>

          {/* Filter Mode */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 font-mono uppercase whitespace-nowrap">Moda:</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2 text-xs text-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">Semua Moda</option>
              <option value="Darat">Darat (Trucking)</option>
              <option value="Udara">Udara (Aviasi)</option>
              <option value="Laut">Laut (Maritime)</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 font-mono uppercase whitespace-nowrap">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2 text-xs text-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="all">Semua Status</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Approved">Approved</option>
              <option value="Published">Published</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. CORE TABLE VIEW */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {top100Routes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-500 border border-amber-200 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Rute Tidak Ditemukan</h4>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Tidak ada rute yang cocok dengan filter pencarian "{searchQuery}" atau kombinasi filter Anda saat ini.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedMode('all');
                setSelectedStatus('all');
              }}
              className="mt-2 text-[10px] font-bold text-cyan-600 hover:underline hover:text-cyan-700 font-mono tracking-wider uppercase bg-slate-50 border border-slate-200 py-1 px-3 rounded-lg"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#1C2D5A]/5 border-b border-slate-200 text-slate-700 select-none">
                <tr>
                  <th className="py-3 px-4 font-mono text-[10px] uppercase font-bold tracking-wider"></th>
                  <th 
                    onClick={() => handleSortClick('code')}
                    className="py-3 px-4 font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-1">
                      Kode Rute {sortBy === 'code' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSortClick('name')}
                    className="py-3 px-4 font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-1">
                      Nama Rute {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                  <th className="py-3 px-4 font-mono text-[10px] uppercase font-bold tracking-wider">Simpul Asal &amp; Tujuan</th>
                  <th 
                    onClick={() => handleSortClick('mode')}
                    className="py-3 px-4 font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-1">
                      Kategori &amp; Moda {sortBy === 'mode' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                  <th className="py-3 px-4 font-mono text-[10px] uppercase font-bold tracking-wider text-right">Kapasitas (KG)</th>
                  <th className="py-3 px-4 font-mono text-[10px] uppercase font-bold tracking-wider text-right">Tarif / KG</th>
                  <th 
                    onClick={() => handleSortClick('status')}
                    className="py-3 px-4 font-mono text-[10px] uppercase font-bold tracking-wider cursor-pointer hover:bg-slate-100"
                  >
                    <div className="flex items-center gap-1 justify-center">
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </div>
                  </th>
                  <th className="py-3 px-4 font-mono text-[10px] uppercase font-bold tracking-wider text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {top100Routes.map((route, index) => {
                  const isExpanded = expandedRouteId === route.id;
                  const modeSpec = getModeSpec(route.transport_mode);
                  const ModeIcon = modeSpec.icon;

                  // Find connected etapes
                  const routeEtapes = etapes
                    .filter((e) => e.route_id === route.id)
                    .sort((a, b) => a.sequence_no - b.sequence_no);

                  // Find schedule
                  const routeSchedule = schedules.find((s) => s.route_id === route.id);

                  // Find capacity assignment
                  const routeCap = capacities.find((c) => c.route_id === route.id);

                  return (
                    <React.Fragment key={route.id}>
                      {/* MAIN ROW CONTAINER */}
                      <tr 
                        className={`hover:bg-cyan-50/40 transition cursor-pointer select-none ${
                          isExpanded ? 'bg-cyan-50/20' : ''
                        }`}
                        onClick={() => handleToggleRoute(route.id)}
                      >
                        {/* Index Indicator */}
                        <td className="py-3.5 px-4 font-mono text-[10px] font-extrabold text-slate-400 text-center">
                          {index + 1}
                        </td>

                        {/* Route Code */}
                        <td className="py-3.5 px-4 font-mono font-black text-slate-900 tracking-tight">
                          <span className="p-1 px-1.5 bg-slate-100 rounded border border-slate-200">
                            {route.route_code}
                          </span>
                        </td>

                        {/* Route Name */}
                        <td className="py-3.5 px-4 font-bold text-slate-800 max-w-xs truncate">
                          {route.route_name}
                        </td>

                        {/* Origin -> Destination Nodes */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900">
                              {route.origin_node}
                            </span>
                            <span className="text-slate-400">➔</span>
                            <span className="font-semibold text-slate-900">
                              {route.destination_node}
                            </span>
                            <div className="text-[10px] text-slate-500 w-full truncate block mt-0.5 font-sans">
                              {getOfficeName(route.origin_node)} ke {getOfficeName(route.destination_node)}
                            </div>
                          </div>
                        </td>

                        {/* Category & Transport Mode */}
                        <td className="py-3.5 px-4 space-y-1">
                          <span className={`inline-block py-0.5 px-2 rounded-full text-[9px] font-mono leading-none ${getCategoryBadge(route.route_category)}`}>
                            {route.route_category}
                          </span>
                          <div className={`flex items-center gap-1 text-[9px] font-semibold py-0.5 px-1.5 rounded border ${modeSpec.bg} w-max`}>
                            <ModeIcon className="w-3 h-3" />
                            {modeSpec.text}
                          </div>
                        </td>

                        {/* Capacity weight formatted */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                          {route.capacity_kg ? route.capacity_kg.toLocaleString('id') : '0'} kg
                        </td>

                        {/* Price per KG formatted */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-850 text-indigo-700">
                          Rp {route.price_per_kg ? route.price_per_kg.toLocaleString('id') : '0'}
                        </td>

                        {/* Workflow Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 text-[10px] font-black tracking-wide uppercase rounded-lg ${getStatusBadge(route.status)}`}>
                            {route.status}
                          </span>
                        </td>

                        {/* Accordion Toggle Indicator Button */}
                        <td className="py-3.5 px-4 text-center">
                          <button 
                            className="p-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                            aria-label="Toggle details"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {/* COLLAPSIBLE ACCORDION EXPANDABLE DETAIL CONTAINER */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60 transition-all border-b border-cyan-100">
                          <td colSpan={9} className="p-5 font-sans whitespace-normal">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in text-slate-700">
                              
                              {/* Left box: Transit Etape Schedule Stops */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-inner space-y-3">
                                <h4 className="text-[11px] font-bold text-slate-950 uppercase tracking-wider font-mono border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-orange-500" />
                                  Konektivitas &amp; Etape Transit ({routeEtapes.length})
                                </h4>

                                {routeEtapes.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic py-4 text-center">
                                    Tidak ada etape transit yang terdefinisi untuk rute ini.
                                  </p>
                                ) : (
                                  <div className="relative pl-4 space-y-3.5 border-l border-slate-200 ml-2 py-1">
                                    {routeEtapes.map((etape, etIdx) => {
                                      const isFirst = etIdx === 0;
                                      const isLast = etIdx === routeEtapes.length - 1;
                                      return (
                                        <div key={etape.id} className="relative">
                                          {/* Node Spot Indicator */}
                                          <span className={`absolute -left-[20.5px] top-1 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center text-[8px] font-black ${
                                            isFirst 
                                              ? 'bg-emerald-500 border-white text-white' 
                                              : isLast 
                                                ? 'bg-indigo-500 border-white text-white' 
                                                : 'bg-white border-slate-300'
                                          }`}>
                                          </span>
                                          
                                          <div className="text-[11px] font-bold text-slate-800">
                                            {etape.sequence_no}. {etape.transport_node_code} - {getOfficeName(etape.transport_node_code)}
                                          </div>
                                          
                                          <div className="font-mono text-[10px] text-slate-500 flex items-center gap-3 mt-0.5">
                                            <span>ETA: <strong className="text-slate-800">{etape.estimated_arrival}</strong></span>
                                            <span className="text-slate-350">•</span>
                                            <span>ETD: <strong className="text-slate-800">{etape.estimated_departure}</strong></span>
                                            {getOfficeDetails(etape.transport_node_code) && (
                                              <>
                                                <span className="text-slate-350">•</span>
                                                <span className="text-[9px] uppercase font-semibold text-cyan-700">
                                                  {getOfficeDetails(etape.transport_node_code)}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Middle box: Schedule & Calendar properties */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-inner space-y-3">
                                <h4 className="text-[11px] font-bold text-slate-950 uppercase tracking-wider font-mono border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4 text-cyan-600" />
                                  Jadwal Operasional Tambahan
                                </h4>

                                {routeSchedule ? (
                                  <div className="space-y-2 text-[11px]">
                                    <div className="grid grid-cols-2 gap-2 border-b border-slate-50 pb-2">
                                      <span className="text-slate-450 hover:text-slate-800">Jam Keberangkatan:</span>
                                      <span className="font-mono font-bold text-slate-900">{routeSchedule.departure_time} WIB</span>
                                      <span className="text-slate-450 hover:text-slate-800">Taksiran Tiba (ETA):</span>
                                      <span className="font-mono font-bold text-slate-900">{routeSchedule.arrival_time} WIB</span>
                                    </div>
                                    
                                    <div className="pt-1">
                                      <span className="text-slate-450 block mb-1">Hari Keberangkatan:</span>
                                      <div className="flex flex-wrap gap-1">
                                        {Array.isArray(routeSchedule.operating_days) ? (
                                          routeSchedule.operating_days.map((day: string) => (
                                            <span key={day} className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold border border-slate-200 rounded font-mono text-[9px]">
                                              {day}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-[9px] text-slate-500 italic">Jadwal Harian Otomatis</span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-50 grid grid-cols-2 gap-y-1.5 text-[10px] text-slate-500">
                                      <span>Tanggal Efektif:</span>
                                      <span className="font-mono text-slate-800 font-bold">{routeSchedule.effective_date || route.effective_date}</span>
                                      <span>Tanggal Kedaluwarsa:</span>
                                      <span className="font-mono text-slate-800 font-bold">{routeSchedule.expired_date || route.expired_date}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-slate-50 border border-slate-150 rounded-lg p-3.5 text-center text-[10px] text-slate-500 leading-relaxed font-sans mt-2 space-y-1">
                                    <Clock className="w-4 h-4 text-slate-400 mx-auto" />
                                    <p>Tidak ada konfigurasi jadwal operasional khusus.</p>
                                    <p className="text-[9px] text-slate-400">Rute secara bawaan diasumsikan berangkat setiap hari kerja pukul 08:00 WIB.</p>
                                  </div>
                                )}
                              </div>

                              {/* Right box: Capacity scheduling limits */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-inner space-y-3">
                                <h4 className="text-[11px] font-bold text-slate-950 uppercase tracking-wider font-mono border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                                  Kapasitas &amp; Penggunaan Armada
                                </h4>

                                {routeCap ? (
                                  <div className="space-y-3.5 text-[11px]">
                                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-150">
                                      <span className="font-bold text-slate-800">Moda Kendaraan:</span>
                                      <span className="px-2 py-0.5 bg-cyan-600 text-white font-mono font-extrabold text-[9px] rounded uppercase select-none">
                                        {routeCap.vehicle_code}
                                      </span>
                                    </div>

                                    <div className="space-y-2">
                                      <div>
                                        <div className="flex justify-between text-[11px] mb-1 font-mono">
                                          <span className="text-slate-500">Kapasitas Maks Bobot:</span>
                                          <span className="font-bold text-slate-900">{routeCap.max_weight.toLocaleString('id')} kg</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                                        </div>
                                      </div>

                                      <div>
                                        <div className="flex justify-between text-[11px] mb-1 font-mono">
                                          <span className="text-slate-500">Kapasitas Maks Volume:</span>
                                          <span className="font-bold text-slate-900">{routeCap.max_volume} m³</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                          <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-50">
                                      <div className="bg-indigo-50/50 p-1.5 rounded border border-indigo-100">
                                        <span className="block text-slate-450 uppercase text-[8px] font-bold">Terreservasi</span>
                                        <strong className="text-indigo-700 text-[11px] font-mono">{routeCap.reserved_capacity}%</strong>
                                      </div>
                                      <div className="bg-emerald-50/50 p-1.5 rounded border border-emerald-100">
                                        <span className="block text-slate-450 uppercase text-[8px] font-bold">Tersedia Bebas</span>
                                        <strong className="text-emerald-700 text-[11px] font-mono">{routeCap.available_capacity}%</strong>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2.5 text-[11px]">
                                    <div className="relative p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-indigo-900 flex gap-2.5 items-start">
                                      <Info className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                      <div className="space-y-0.5">
                                        <p className="font-bold text-[10px]">Alokasi Kendaraan Mandiri</p>
                                        <p className="text-[9px] text-slate-600 leading-normal">
                                          Gunakan menu <strong className="text-indigo-800">Alokasi &amp; Kapasitas</strong> untuk menautkan jenis truk &amp; menghitung kuota kubikasi/tonase rute ini.
                                        </p>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                      <div className="bg-slate-50 p-2 rounded text-center">
                                        <span className="block text-slate-450 text-[8px] uppercase">Batas Estimasi</span>
                                        <strong className="text-slate-800">{route.capacity_kg ? route.capacity_kg.toLocaleString('id') : '25.000'} KG</strong>
                                      </div>
                                      <div className="bg-slate-50 p-2 rounded text-center">
                                        <span className="block text-slate-450 text-[8px] uppercase">Tarif Estimasi</span>
                                        <strong className="text-slate-800">Rp {route.price_per_kg ? route.price_per_kg.toLocaleString('id') : '3.500'} / KG</strong>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
