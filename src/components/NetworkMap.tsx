import React, { useEffect, useRef, useState } from 'react';
import { TransportNode, Route, Etape, Office } from '../types';
import { INITIAL_OFFICES } from '../data/mockData';
import { Eye, Filter, MapPin, Navigation, Info, RefreshCw } from 'lucide-react';
import L from 'leaflet';

interface NetworkMapProps {
  nodes: TransportNode[];
  routes: Route[];
  etapes: Etape[];
  offices?: Office[];
}

export default function NetworkMap({ nodes, routes, etapes, offices }: NetworkMapProps) {
  const [selectedNode, setSelectedNode] = useState<TransportNode | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  
  // Filters state
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const linesLayerRef = useRef<L.FeatureGroup | null>(null);

  const getNodeByKey = (code: string) => {
    return nodes.find(n => n.office_code === code);
  };

  const getOfficeName = (code: string) => {
    return (offices || INITIAL_OFFICES).find(o => o.office_code === code)?.office_name || `Kantor ${code}`;
  };

  // Filtered lists
  const filteredRoutes = routes.filter(route => {
    if (modeFilter !== 'ALL' && route.transport_mode !== modeFilter) return false;
    
    // Support either Tersier or Tertier safely
    const formattedCat = (route.route_category as string) === 'Tersier' ? 'Tertier' : route.route_category;
    if (categoryFilter !== 'ALL' && formattedCat !== categoryFilter) return false;
    
    if (statusFilter !== 'ALL' && route.status !== statusFilter) return false;
    return true;
  });

  const activeNodes = nodes.filter(node => {
    // Show node if it is the origin, destination, or etape of any filtered route, or if no route filter is active
    if (modeFilter === 'ALL' && categoryFilter === 'ALL' && statusFilter === 'ALL') return true;
    return filteredRoutes.some(r => 
      r.origin_node === node.office_code || 
      r.destination_node === node.office_code || 
      etapes.some(e => e.route_id === r.id && e.transport_node_code === node.office_code)
    );
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [-2.5, 118.0], // Center of Indonesia
        zoom: 5,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        minZoom: 4,
        maxZoom: 13
      });

      // CartoDB Voyager Tile Layer - Clean, modern, eye-safe styling
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      linesLayerRef.current = L.featureGroup().addTo(map);

      // Invalidate sizes quickly to fix potential rendering layout bugs inside React tab layout
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        linesLayerRef.current = null;
      }
    };
  }, []);

  // Update Map Content Dynamically
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    const linesLayer = linesLayerRef.current;
    if (!map || !markersLayer || !linesLayer) return;

    markersLayer.clearLayers();
    linesLayer.clearLayers();

    // 1. Draw Connection Routes
    filteredRoutes.forEach((route) => {
      const origin = getNodeByKey(route.origin_node);
      const dest = getNodeByKey(route.destination_node);
      if (!origin || !dest) return;

      const latlngs: L.LatLngExpression[] = [
        [origin.geographic_center.lat, origin.geographic_center.lng],
        [dest.geographic_center.lat, dest.geographic_center.lng]
      ];

      const isSelected = selectedRoute?.id === route.id;
      
      // Theme colors matching original design system
      let modeColor = '#f59e0b'; // Amber - Darat
      if (route.transport_mode === 'Udara') modeColor = '#06b6d4'; // Cyan - Udara
      if (route.transport_mode === 'Laut') modeColor = '#0d9488'; // Teal - Laut

      // Draw blue highlight background polyline if selected
      if (isSelected) {
        L.polyline(latlngs, {
          color: '#06b6d4',
          weight: 7,
          opacity: 0.45
        }).addTo(linesLayer);
      }

      // Draw main routing path line
      const poly = L.polyline(latlngs, {
        color: modeColor,
        weight: isSelected ? 4.5 : 2.2,
        opacity: isSelected ? 1.0 : 0.65,
        dashArray: route.transport_mode === 'Udara' ? '6, 6' : route.transport_mode === 'Laut' ? '12, 6' : undefined
      });

      // Bind interactive tooltip
      poly.bindTooltip(`
        <div class="px-2.5 py-2 font-mono text-[11px] text-slate-800 space-y-1">
          <div class="font-bold border-b border-indigo-100 pb-1 text-xs text-indigo-900">${route.route_code}</div>
          <div class="font-semibold uppercase tracking-wide text-slate-700">${route.route_name}</div>
          <div class="flex gap-2 text-[9px] text-slate-500 font-bold">
            <span class="bg-indigo-50 border border-indigo-150 px-1 py-0.2 rounded">${route.transport_mode}</span>
            <span class="bg-amber-50 border border-amber-150 px-1 py-0.2 rounded">Kategori ${route.route_category}</span>
          </div>
        </div>
      `, { sticky: true });

      // Click handler
      poly.on('click', () => {
        setSelectedRoute(route);
        setSelectedNode(null);
      });

      poly.addTo(linesLayer);
    });

    // 2. Draw Nodes
    activeNodes.forEach((node) => {
      const isSelected = selectedNode?.office_code === node.office_code;
      
      // Categorical color map
      let color = '#06b6d4'; // Gateway / Processing Centers
      if (node.node_category === 'National Hub') color = '#ef4444'; // Red
      else if (node.node_category === 'Regional Hub') color = '#f59e0b'; // Amber
      else if (node.node_category === 'Gateway') color = '#2563eb'; // Deep Blue
      else if (node.node_category === 'Local Hub') color = '#10b981'; // Emerald

      // Dynamic glow ring around selected node
      if (isSelected) {
        L.circleMarker([node.geographic_center.lat, node.geographic_center.lng], {
          radius: 12,
          color: color,
          weight: 1,
          opacity: 0.5,
          fillColor: color,
          fillOpacity: 0.15
        }).addTo(markersLayer);
      }

      // Draw vector circlemarker - completely robust & high performance
      const marker = L.circleMarker([node.geographic_center.lat, node.geographic_center.lng], {
        radius: isSelected ? 8.5 : 5.8,
        fillColor: color,
        fillOpacity: 0.9,
        color: '#ffffff',
        weight: isSelected ? 2.2 : 1
      });

      // Bind interactive tooltip
      marker.bindTooltip(`
        <div class="px-2 py-1.5 font-mono text-xs text-slate-800">
          <div class="font-bold text-slate-900">${getOfficeName(node.office_code)}</div>
          <div class="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">${node.node_category} (${node.office_code})</div>
        </div>
      `, { direction: 'top', offset: [0, -6] });

      // Click handler
      marker.on('click', () => {
        setSelectedNode(node);
        setSelectedRoute(null);
      });

      marker.addTo(markersLayer);
    });

    // 3. Zoom-to-fit calculation
    if (linesLayer.getLayers().length > 0) {
      try {
        const bounds = linesLayer.getBounds();
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
      } catch (e) {
        // Fallback bounds
      }
    } else {
      map.setView([-2.5, 118.0], 5);
    }

  }, [activeNodes, filteredRoutes, selectedRoute, selectedNode]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow">
      {/* Map Control Bar */}
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-cyan-600 rotate-45" />
          <div>
            <h4 className="text-sm font-bold text-slate-900">Peta Jaringan Logistik Nasional N22POS</h4>
            <p className="text-[11px] text-slate-500 font-mono">Peta Spasial Indonesia Real-Time Terintegrasi OpenStreetMap</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Selector */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Moda:</span>
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-850 border-none focus:outline-none focus:ring-0 select-none py-0.5 focus:bg-white"
            >
              <option value="ALL">Semua Moda</option>
              <option value="Darat">🚚 Darat</option>
              <option value="Udara">✈️ Udara</option>
              <option value="Laut">🚢 Laut</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Kategori:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-850 border-none focus:outline-none focus:ring-0 py-0.5 focus:bg-white"
            >
              <option value="ALL">Semua Rute</option>
              <option value="Primer">Primer</option>
              <option value="Sekunder">Sekunder</option>
              <option value="Tertier">Tertier</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-850 border-none focus:outline-none focus:ring-0 py-0.5 text-ellipsis select-none focus:bg-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="Published">🟢 Published</option>
              <option value="Approved">🔵 Approved</option>
              <option value="Reviewed">🟡 Reviewed</option>
              <option value="Submitted">🟠 Submitted</option>
              <option value="Draft">⚪ Draft</option>
            </select>
          </div>

          {/* Reset Filters */}
          <button
            onClick={() => { setModeFilter('ALL'); setCategoryFilter('ALL'); setStatusFilter('ALL'); setSelectedNode(null); setSelectedRoute(null); }}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 rounded-lg transition cursor-pointer"
            title="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Map Box Layout */}
      <div className="relative grid grid-cols-1 lg:grid-cols-4 min-h-[460px]">
        {/* Real Dynamic Map Container */}
        <div className="lg:col-span-3 bg-slate-50 relative h-[450px] lg:h-auto border-r border-slate-100 min-h-[420px] select-none z-0">
          <div ref={mapRef} className="w-full h-full min-h-[450px] z-0" />

          {/* Float Legends */}
          <div className="absolute bottom-3 left-3 bg-white/95 border border-slate-200 p-2.5 rounded-lg text-[10px] text-slate-700 shadow-lg backdrop-blur-sm z-[1000]">
            <div className="font-semibold text-slate-800 uppercase tracking-wider font-mono mb-1.5 border-b border-slate-100 pb-0.5">Moda Koridor</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-[#f59e0b] inline-block"></span>
                <span className="font-semibold text-slate-600">🚚 Darat</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 border-b border-dashed border-[#06b6d4] inline-block"></span>
                <span className="font-semibold text-slate-600">✈️ Udara</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-[#0d9488] inline-block"></span>
                <span className="font-semibold text-slate-600">🚢 Laut</span>
              </div>
            </div>
            
            <div className="font-semibold text-slate-800 uppercase tracking-wider font-mono mt-2 mb-1 border-b border-slate-100 pb-0.5">Kategori Node</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block"></span>
                <span>Nasional Hub</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#f59e0b] inline-block"></span>
                <span>Regional Hub</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#2563eb] inline-block"></span>
                <span>Gateway</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block"></span>
                <span>Lokal Hub</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info/Status Detail */}
        <div className="lg:col-span-1 bg-white p-4 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-705 uppercase tracking-widest border-b border-slate-100 pb-2">
            <Eye className="w-4 h-4 text-cyan-600" />
            <span className="text-slate-800 font-bold">Inspector Spasial</span>
          </div>

          {!selectedNode && !selectedRoute ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-center text-slate-400 space-y-2">
              <MapPin className="w-8 h-8 opacity-40 text-slate-405 text-slate-400" />
              <p className="text-xs font-normal">Klik node lingkaran atau garis rute pada peta Indonesia asli untuk memeriksa detail data spasialnya secara rinci.</p>
            </div>
          ) : null}

          {/* If Node Selected */}
          {selectedNode && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[9px] font-mono uppercase bg-indigo-100 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-bold">
                  {selectedNode.node_category}
                </span>
                <h5 className="font-bold text-slate-800 text-sm mt-2">{getOfficeName(selectedNode.office_code)}</h5>
                <div className="text-xs text-slate-500 font-mono mt-1">Kode Pos: {selectedNode.office_code}</div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Cakupan Wilayah Layanan:</span>
                  <span className="text-slate-700 font-medium leading-relaxed">{selectedNode.service_area}</span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Hub Induk Koordinasi:</span>
                  <span className="text-slate-700">
                    {selectedNode.parent_node_code ? `${getOfficeName(selectedNode.parent_node_code)}` : 'Induk Mandiri'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Koordinat Spasial GPS asli:</span>
                  <span className="text-slate-600 font-mono text-[10.5px] font-bold bg-slate-50 border border-slate-150 p-1 px-1.5 rounded block">
                    {selectedNode.geographic_center.lat >= 0 
                      ? `${selectedNode.geographic_center.lat.toFixed(6)}° N` 
                      : `${Math.abs(selectedNode.geographic_center.lat).toFixed(6)}° S`
                    }, {selectedNode.geographic_center.lng >= 0 
                      ? `${selectedNode.geographic_center.lng.toFixed(6)}° E` 
                      : `${Math.abs(selectedNode.geographic_center.lng).toFixed(6)}° W`
                    }
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 rounded-lg text-center transition font-semibold cursor-pointer"
              >
                Tutup Detail Node
              </button>
            </div>
          )}

          {/* If Route Selected */}
          {selectedRoute && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded">
                    {selectedRoute.route_category}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    selectedRoute.status === 'Published' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {selectedRoute.status}
                  </span>
                </div>
                <h5 className="font-bold text-slate-800 text-sm">{selectedRoute.route_name}</h5>
                <div className="text-xs font-mono text-cyan-700 font-bold">{selectedRoute.route_code}</div>
              </div>

              <div className="space-y-3 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Moda Transport:</span>
                  <span className="text-slate-700 font-semibold">{selectedRoute.transport_mode === 'Darat' ? '🚚 Jalan Darat' : selectedRoute.transport_mode === 'Udara' ? '✈️ Angkutan Udara' : '🚢 Tol Laut'}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Kantor Asal:</span>
                  <span className="text-slate-700 font-medium">{getOfficeName(selectedRoute.origin_node)}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Kantor Tujuan:</span>
                  <span className="text-slate-700 font-medium">{getOfficeName(selectedRoute.destination_node)}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Kapasitas Maks:</span>
                  <span className="text-slate-700 font-semibold">{(selectedRoute.capacity_kg ?? 10000).toLocaleString('id-ID')} Kg</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-slate-500">Tarif Kontrak:</span>
                  <span className="text-orange-600 font-bold">Rp {(selectedRoute.price_per_kg ?? 950).toLocaleString('id-ID')} / Kg</span>
                </div>

                <div>
                  <span className="text-slate-505 block text-[10px] uppercase font-mono mb-1 font-semibold text-slate-500">Rantai Etape Transit:</span>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1.5 max-h-[140px] overflow-y-auto font-mono">
                    {etapes.filter(e => e.route_id === selectedRoute.id)
                      .sort((a,b)=> a.sequence_no - b.sequence_no)
                      .map((e, idx) => (
                        <div key={e.id} className="flex items-center gap-1.5 text-[10px] text-slate-700 border-b border-slate-100/50 pb-1 last:border-b-0 last:pb-0">
                          <span className="w-3.5 h-3.5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] text-indigo-700 font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="truncate flex-1 font-semibold text-[9.5px]">{getOfficeName(e.transport_node_code)}</span>
                          <span className="text-slate-400 text-[8.5px]">({e.estimated_arrival})</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedRoute(null)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 rounded-lg text-center transition font-semibold cursor-pointer"
              >
                Tutup Detail Rute
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
