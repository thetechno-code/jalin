import React, { useState } from 'react';
import { BookOpen, Database, Code, Map, ShieldAlert, Award, ArrowUpRight, Copy, Check, Terminal, Play } from 'lucide-react';

interface DocSection {
  id: string;
  title: string;
  category: 'Business' | 'Database' | 'API' | 'Frontend' | 'Deployment';
  icon: React.ReactNode;
  summary: string;
}

export default function EnterpriseArchitectureDocs() {
  const [activeTab, setActiveTab] = useState<string>('business-arch');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [sandboxResult, setSandboxResult] = useState<string>('Click "Execute Test Call" to send a mocked API request.');
  const [loadingSandbox, setLoadingSandbox] = useState<boolean>(false);

  const sections: DocSection[] = [
    { id: 'business-arch', title: '1-3. Business, Functional & NFR', category: 'Business', icon: <BookOpen className="w-4 h-4" />, summary: 'Transformasi N22 Angkutan, Kategori Node, Matrix SLA, dan Kriteria Non-Fungsional.' },
    { id: 'database-erd', title: '4. ERD & Schema Visualizer', category: 'Database', icon: <Database className="w-4 h-4" />, summary: 'Hubungan Relasional, Primary & Foreign Keys, dan Model Entitas Berbasis Transportasi.' },
    { id: 'ddl-schema', title: '5. PostgreSQL DDL Spec (Production)', category: 'Database', icon: <Code className="w-4 h-4" />, summary: 'Skema SQL, Indexing Strategy, Partitioning Data Audit, dan Table History.' },
    { id: 'api-spec', title: '6. REST API Sandbox', category: 'API', icon: <Terminal className="w-4 h-4" />, summary: 'Spesifikasi endpoint CRUD dan workflow persetujuan (simulasikan request).' },
    { id: 'frontend-arch', title: '7-9. React Sitemap & Screens', category: 'Frontend', icon: <Map className="w-4 h-4" />, summary: 'Sitemap aplikasi, deskripsi wireframe screen, dan User Flow perjalanan data.' },
    { id: 'roadmap-mitigation', title: '10-12. Roadmap, Risk & Practices', category: 'Deployment', icon: <ShieldAlert className="w-4 h-4" />, summary: 'Fase implementasi (Phase 2-7), mitigasi risiko teknis, dan Best Practices logistik nasional.' },
  ];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const runSandbox = (method: string, endpoint: string, payload?: any) => {
    setLoadingSandbox(true);
    setSandboxResult('Initiating micro-service connection...\nResolving state validation triggers...');
    setTimeout(() => {
      setLoadingSandbox(false);
      setSandboxResult(JSON.stringify({
        status: 200,
        statusText: 'OK',
        timestamp: new Date().toISOString(),
        request: {
          method,
          endpoint,
          payload: payload || null
        },
        response: {
          success: true,
          message: `Mock response parsed successfully for N22POS endpoint. Real Supabase integration will bind natively.`,
          data: payload ? { ...payload, id: `pkg_${Math.floor(Math.random() * 90000 + 10000)}`, created_at: new Date() } : [
            { office_code: '10000', node_category: 'National Hub', is_transport_node: true },
            { office_code: '40000', node_category: 'Regional Hub', is_transport_node: true }
          ]
        }
      }, null, 2));
    }, 800);
  };

  const postgresDDL = `-- N22POS - ENTERPRISE DATA SCHEMA
-- Database Platform: PostgreSQL (Compatible with Supabase)

-- 1. Create enum types for state integrity
CREATE TYPE office_type_enum AS ENUM ('KCU', 'KC', 'HUB', 'SPP', 'DC');
CREATE TYPE node_category_enum AS ENUM ('National Hub', 'Regional Hub', 'Local Hub', 'Gateway', 'Processing Center', 'Distribution Center');
CREATE TYPE route_category_enum AS ENUM ('Primer', 'Sekunder', 'Tertier');
CREATE TYPE transport_mode_enum AS ENUM ('Darat', 'Udara', 'Laut');
CREATE TYPE approval_status_enum AS ENUM ('Draft', 'Submitted', 'Reviewed', 'Approved', 'Rejected', 'Published');

-- 2. Master Kantor Table (Valid Source - Prepopulated)
CREATE TABLE master_kantor (
    office_code VARCHAR(10) PRIMARY KEY,
    office_name VARCHAR(150) NOT NULL,
    office_type office_type_enum NOT NULL,
    region_code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Transport Node Table (Subset of Master Kantor)
CREATE TABLE transport_nodes (
    office_code VARCHAR(10) PRIMARY KEY REFERENCES master_kantor(office_code) ON DELETE CASCADE,
    is_transport_node BOOLEAN DEFAULT TRUE,
    node_category node_category_enum NOT NULL,
    parent_node_code VARCHAR(10) REFERENCES transport_nodes(office_code),
    service_area TEXT NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Route Table
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_code VARCHAR(20) UNIQUE NOT NULL,
    route_name VARCHAR(150) NOT NULL,
    route_category route_category_enum NOT NULL,
    transport_mode transport_mode_enum NOT NULL,
    origin_node_code VARCHAR(10) NOT NULL REFERENCES transport_nodes(office_code),
    destination_node_code VARCHAR(10) NOT NULL REFERENCES transport_nodes(office_code),
    effective_date DATE NOT NULL,
    expired_date DATE NOT NULL,
    status approval_status_enum DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(100),
    CONSTRAINT chk_unique_endpoints CHECK (origin_node_code <> destination_node_code),
    CONSTRAINT chk_date_validity CHECK (effective_date <= expired_date)
);

-- 5. Etape Location Table (Sequential distribution stops)
CREATE TABLE etapes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    sequence_no INT NOT NULL,
    transport_node_code VARCHAR(10) NOT NULL REFERENCES transport_nodes(office_code),
    estimated_arrival VARCHAR(30) NOT NULL, -- e.g. "08:00" or "+1d 04:00"
    estimated_departure VARCHAR(30) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_route_sequence UNIQUE (route_id, sequence_no)
);

-- 6. Schedule Table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    frequency VARCHAR(30) NOT NULL,
    operating_days TEXT[] NOT NULL, -- e.g., ARRAY['Senin', 'Rabu']
    effective_date DATE NOT NULL,
    expired_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Vehicle Type Master
CREATE TABLE vehicle_types (
    vehicle_code VARCHAR(15) PRIMARY KEY,
    vehicle_name VARCHAR(100) NOT NULL,
    vehicle_mode transport_mode_enum NOT NULL,
    max_weight_kg DECIMAL(12,2) NOT NULL,
    max_volume_m3 DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Route Capacity Matrix
CREATE TABLE route_capacities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    vehicle_code VARCHAR(15) NOT NULL REFERENCES vehicle_types(vehicle_code),
    max_weight_allocated DECIMAL(12,2) NOT NULL,
    max_volume_allocated DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_route_vehicle UNIQUE (route_id, vehicle_code)
);

-- 9. Enterprise Auditing System (Partitioned Log Table)
CREATE TABLE audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100) NOT NULL,
    action_type VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE, STATE_TRANSITION
    performed_by VARCHAR(100) NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    previous_state JSONB,
    new_state JSONB,
    PRIMARY KEY (id, performed_at)
) PARTITION BY RANGE (performed_at);

-- Example partition tables for year 2026/2027
CREATE TABLE audit_logs_y2026m06 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');

-- 10. Performance Indexes for TMS Routing Engines
CREATE INDEX idx_master_kantor_type ON master_kantor(office_type);
CREATE INDEX idx_transport_nodes_category ON transport_nodes(node_category);
CREATE INDEX idx_routes_status_code ON routes(status, route_code);
CREATE INDEX idx_etapes_composite ON etapes(route_id, sequence_no);
CREATE INDEX idx_schedules_route_time ON schedules(route_id, departure_time);
`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-xs text-slate-700">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-mono text-cyan-800 font-bold uppercase tracking-widest mb-3">Arsitektur N22POS</p>
          <div className="space-y-1.5">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={`w-full text-left p-3 rounded-lg text-xs transition-all flex items-start gap-4 ${
                  activeTab === section.id
                    ? 'bg-cyan-50 border-l-4 border-cyan-600 text-cyan-950 font-bold shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className={`p-1.5 rounded-md ${activeTab === section.id ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-200 text-slate-500'}`}>
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-semibold text-xs">{section.title}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{section.summary}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-55 from-cyan-50 to-slate-50 border border-cyan-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-cyan-800 text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Award className="w-4 h-4 text-cyan-700" />
            <span>Enterprise Certified</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Arsitektur ini dirancang untuk diintegrasikan secara langsung dengan Supabase PostgreSQL, mendukung pemisahan hak akses per wilayah (Regional Partitioning) dan Routing Engine adaptif.
          </p>
        </div>
      </div>

      {/* Design and Architecture Content Panel */}
      <div className="lg:col-span-3 space-y-6">
        {activeTab === 'business-arch' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-8 shadow-sm">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-cyan-600">01.</span> Arsitektur Bisnis &amp; Pos Indonesia Context
                </h3>
                <span className="px-3 py-1 bg-cyan-100 border border-cyan-200 text-cyan-800 rounded-full text-[10px] font-bold font-mono">
                  N22 Angkutan Upgrade
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Sistem **N22POS** menggantikan format statis "Format N22 Angkutan" tradisional Pos Indonesia menjadi kerangka **Transport Graph Network** yang dinamis dan modular. Referensi kantor menggunakan Data Master Kantor Pos Nasional induk sebagai *Source-of-Truth*, dan mendefinisikan lapisan fungsional baru bernama **Transport Node**.
              </p>

              {/* Business Concepts Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg shadow-inner">
                  <h4 className="text-xs font-bold text-slate-850 text-slate-800 mb-2">Master Kantor Eksisting</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2 font-normal">
                    Referensi valid nasional berupa data kantor permanen. Kantor memiliki tingkatan fungsional:
                  </p>
                  <div className="flex flex-wrap gap-1.5 font-normal">
                    {['KCU (Kantor Cabat Utama)', 'KC (Kantor Cabang)', 'HUB (Hub Logistik)', 'SPP (Sentral Pengolahan Pos)', 'DC (Distribution Center)'].map((t) => (
                      <span key={t} className="text-[9px] px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-bold shadow-sm">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg shadow-inner">
                  <h4 className="text-xs font-bold text-slate-850 text-slate-800 mb-2">Transport Node (Subset Baru)</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-2 font-normal">
                    Kantor terpilih yang berfungsi sebagai titik transit dan distribusi dalam graph logistik nasional. Dilengkapi dengan:
                  </p>
                  <ul className="text-[11px] text-slate-600 space-y-1 list-disc pl-4 font-normal">
                    <li>Kategori Hub spesifik (National / Regional / Gateway)</li>
                    <li>Suhu &amp; Kapasitas Penanganan Cargo</li>
                    <li>Asosiasi Parent Node untuk rute fallback</li>
                  </ul>
                </div>
              </div>
            </div>

            <hr className="border-slate-200" />

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-cyan-600">02.</span> Persyaratan Fungsional (Functional Requirements)
              </h3>
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-slate-100 px-4 py-2 text-xs font-mono text-slate-700 border-b border-slate-200 font-bold">
                    Matrix Fungsional Inti
                  </div>
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                        <th className="p-3">ID Modul</th>
                        <th className="p-3">Nama Fitur</th>
                        <th className="p-3">Spesifikasi Alur Pengoperasian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-650">
                      <tr>
                        <td className="p-3 font-mono text-cyan-800 font-bold">F-01-NODE</td>
                        <td className="p-3 font-semibold text-slate-900">Node Activator</td>
                        <td className="p-3 text-slate-600">Mengambil data dari Master Kantor, mengaktifkannya sebagai Transport Node, menetapkan node parent, dan cakupan wilayah koordinasi.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-cyan-800 font-bold">F-02-WIZD</td>
                        <td className="p-3 font-semibold text-slate-900">Route Creator Wizard</td>
                        <td className="p-3 text-slate-600">6-Step form wizard untuk operator: Informasi Rute, Titik Asal-Tujuan, Penyusunan Etape Transit (Drag-Reorder), Jadwal Keberangkatan, Kapasitas Armada, dan Review Approval.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-cyan-800 font-bold">F-03-XLS</td>
                        <td className="p-3 font-semibold text-slate-900">Excel Validator Line-by-Line</td>
                        <td className="p-3 text-slate-600">Engine import file Excel, memverifikasi dependensi kode kantor secara real-time. Jika salah satu baris gagal, sistem memberikan detail error per baris dan membolehkan Rollback penuh.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-mono text-cyan-800 font-bold">F-04-WF</td>
                        <td className="p-3 font-semibold text-slate-900">Multi-Role Approval Gate</td>
                        <td className="p-3 text-slate-600">Alur penandatanganan struktur jaringan rute nasional mulai dari Draft → Submitted (Operator) → Reviewed (Regional) → Approved &amp; Published (National Admin).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <hr className="border-slate-800" />

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-cyan-600">03.</span> Kriteria Non-Fungsional (NFR)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-normal">
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg shadow-sm">
                  <div className="text-cyan-800 font-mono text-[10px] mb-1.5 font-bold">SLA-01: KECEPATAN ROUTING</div>
                  <h4 className="text-xs font-bold text-slate-850 text-slate-800 mb-1">Response Time &lt; 150ms</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                    Setiap perhitungan rute transit multi-node (etape) wajib diselesaikan di bawah 150 milidetik menggunakan PostGIS Core indeks spasial.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg shadow-sm">
                  <div className="text-cyan-800 font-mono text-[10px] mb-1.5 font-bold">SEC-02: DATA SECURITY &amp; AUDIT</div>
                  <h4 className="text-xs font-bold text-slate-850 text-slate-800 mb-1">Zero-Exception Audit Log</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                    Setiap manipulasi relasi transportasi (penambahan node atau etape) akan direkam menggunakan skema audit terpartisi dengan triggers PostgreSQL.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg shadow-sm">
                  <div className="text-cyan-800 font-mono text-[10px] mb-1.5 font-bold">RES-03: SISTEM RESILIENCE</div>
                  <h4 className="text-xs font-bold text-slate-850 text-slate-800 mb-1">State Rollback Mechanism</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                    Kegagalan import data excel wajib didukung proteksi transaksi database atomic (all or nothing) dengan fitur rollback logistik nasional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database-erd' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="text-cyan-600">04.</span> Interactive ERD &amp; Database Entities
              </h3>
              <span className="text-[11px] text-slate-700 font-mono bg-slate-100 px-2.5 py-1 rounded-full font-bold">PostgreSQL Relational Design</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6 font-normal">
              Berikut adalah peta relasi entitas dalam **N22POS Engine**, dirancang khusus untuk mendukung konsistensi transaksi data multi-etape.
            </p>

            {/* Visual Interactive ERD Schema block */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 overflow-x-auto">
              <div className="min-w-[700px] py-4 grid grid-cols-3 gap-6 relative">
                
                {/* Column 1: MASTER & NODES */}
                <div className="space-y-6">
                  {/* Entity 1: Master Kantor */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 border-b border-slate-200 flex justify-between">
                      <span>master_kantor</span>
                      <span className="text-[10px] text-cyan-600 font-bold">Master Source</span>
                    </div>
                    <div className="p-3 text-[11px] space-y-1 font-mono text-slate-600">
                      <div>🔑 <strong className="text-slate-900">office_code</strong>: VARCHAR(10)</div>
                      <div>🔹 office_name: VARCHAR(150)</div>
                      <div>🔹 office_type: enum_type</div>
                      <div>🔹 region_code: VARCHAR(10)</div>
                    </div>
                  </div>

                  {/* Entity 2: Transport Node */}
                  <div className="border border-cyan-300 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-900 border-b border-cyan-100 flex justify-between">
                      <span>transport_nodes</span>
                      <span className="text-[10px] text-cyan-700 font-bold">Subset Node</span>
                    </div>
                    <div className="p-3 text-[11px] space-y-1 font-mono text-slate-600">
                      <div>🔑 FK <strong className="text-slate-900 font-bold">office_code</strong> (PK)</div>
                      <div>🔹 node_category: val_category</div>
                      <div>🔹 parent_node_code: FK (Self)</div>
                      <div>🔹 service_area: TEXT</div>
                      <div>🔹 geographic_coords: (lat, lng)</div>
                    </div>
                  </div>
                </div>

                {/* Column 2: ROUTES & TRANSITS */}
                <div className="space-y-6">
                  {/* Entity 3: Routes */}
                  <div className="border border-emerald-300 rounded-lg overflow-hidden bg-white shadow-sm relative">
                    <div className="bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-900 border-b border-emerald-100 flex justify-between">
                      <span>routes</span>
                      <span className="text-[10px] text-emerald-700 font-bold">Main Graph</span>
                    </div>
                    <div className="p-3 text-[11px] space-y-1 font-mono text-slate-600">
                      <div>🔑 <strong className="text-slate-900 font-bold">id</strong>: UUID (PK)</div>
                      <div>🔹 route_code: VARCHAR(20) [UQ]</div>
                      <div>🔹 route_name: VARCHAR(150)</div>
                      <div>🔹 origin_node_code: FK (nodes)</div>
                      <div>🔹 destination_node_code: FK (nodes)</div>
                      <div>🔹 status: workflow_enum</div>
                      <div>🔹 effective_dates: DATE</div>
                    </div>
                  </div>

                  {/* Entity 4: Etape Stop */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 border-b border-slate-200 flex justify-between">
                      <span>etapes</span>
                      <span className="text-[10px] text-slate-500 font-bold">Sequence Stops</span>
                    </div>
                    <div className="p-3 text-[11px] space-y-1 font-mono text-slate-600">
                      <div>🔑 <strong className="text-slate-900 font-bold">id</strong>: UUID (PK)</div>
                      <div>🔹 route_id: UUID (FK routes)</div>
                      <div>🔹 sequence_no: INT</div>
                      <div>🔹 transport_node_code: FK (nodes)</div>
                      <div>🔹 estimated_arrival: VARCHAR</div>
                      <div>🔹 estimated_departure: VARCHAR</div>
                    </div>
                  </div>
                </div>

                {/* Column 3: SCHEDULE & CAPACITY */}
                <div className="space-y-6">
                  {/* Entity 5: Schedules */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 border-b border-slate-200 flex justify-between">
                      <span>schedules</span>
                      <span className="text-[10px] text-slate-500 font-bold">Timetable</span>
                    </div>
                    <div className="p-3 text-[11px] space-y-1 font-mono text-slate-600">
                      <div>🔑 <strong className="text-slate-900 font-bold">id</strong>: UUID (PK)</div>
                      <div>🔹 route_id: UUID (FK routes)</div>
                      <div>🔹 departure_time: TIME</div>
                      <div>🔹 arrival_time: TIME</div>
                      <div>🔹 frequency: enum_freq</div>
                      <div>🔹 operating_days: TEXT[]</div>
                    </div>
                  </div>

                  {/* Entity 6: Route Capacity */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 border-b border-slate-200 flex justify-between">
                      <span>route_capacities</span>
                      <span className="text-[10px] text-slate-500 font-bold">Vehicle Matrix</span>
                    </div>
                    <div className="p-3 text-[11px] space-y-1 font-mono text-slate-600">
                      <div>🔑 <strong className="text-slate-900 font-bold">id</strong>: UUID (PK)</div>
                      <div>🔹 route_id: UUID (FK routes)</div>
                      <div>🔹 vehicle_code: FK (vehicles)</div>
                      <div>🔹 weight_capacity_kg: DECIMAL</div>
                      <div>🔹 volume_capacity_m3: DECIMAL</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="mt-4 bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs leading-relaxed text-slate-700 shadow-sm">
              <strong className="text-slate-900 font-bold">Relational Integrity Rule:</strong>
              <ul className="list-disc pl-4 mt-2 space-y-1 font-normal">
                <li><span className="text-cyan-800 font-bold">1-to-Many Routes &amp; Etapes:</span> Urutan sequence etape diproteksi oleh constraint unik <code className="bg-slate-100 border border-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono font-bold">uq_route_sequence (route_id, sequence_no)</code> demi integritas urutan pengiriman.</li>
                <li><span className="text-cyan-800 font-bold">Cascaded Node Dependencies:</span> Transport nodes tidak diizinkan dihapus apabila memiliki referensi aktif di etape maupun rute.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'ddl-schema' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">05. PostgreSQL DDL Specification</h3>
                <p className="text-xs text-slate-500 font-normal">Production ready schemas with indexing, audit triggers, and log partitioning.</p>
              </div>
              <button
                onClick={() => handleCopy(postgresDDL, 'ddl')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs rounded text-slate-800 flex items-center gap-1 transition font-bold"
              >
                {copiedText === 'ddl' ? <span className="text-emerald-700 font-bold">Copied!</span> : <span>Copy Schema</span>}
                <Copy className="w-3.5 h-3.5 ml-1 text-slate-500" />
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-[11px] font-mono text-cyan-900 overflow-x-auto max-h-[450px]">
                {postgresDDL}
              </pre>
              <div className="absolute top-2 right-2 bg-slate-200/80 px-2 py-0.5 text-[10px] text-slate-705 rounded border border-slate-300 font-bold">
                PostgreSQL SQL
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 shadow-inner">
              <h4 className="text-xs font-bold text-slate-800">Strategi Optimasi untuk Masa Depan (Phase 2-7 ready):</h4>
              <ul className="text-xs text-slate-600 pl-4 list-disc space-y-1 font-normal">
                <li><strong className="text-slate-800">Phase 2 (Routing Engine):</strong> Ditunjang oleh komposit indeks <code className="bg-slate-100 border border-slate-200 px-1 text-cyan-800 rounded font-mono font-bold">idx_etapes_composite</code> untuk mempercepat pencarian jalur transportasi multi-titik.</li>
                <li><strong className="text-slate-800">Phase 5 (GPS Tracking):</strong> Tabel koordinat geografis <code className="bg-slate-100 border border-slate-200 px-1 text-cyan-800 rounded font-mono font-bold">(latitude, longitude)</code> menggunakan standar floating numerik, siap di-upgrade ke tipe spasial <code className="bg-slate-100 border border-slate-200 px-1 text-cyan-800 rounded font-mono font-bold">GEOGRAPHY(Point)</code> dari PostGIS.</li>
                <li><strong className="text-slate-800">Phase 6 (Capacity Optimization):</strong> Kolom reserved_capacity mengunci rasio real-time antara kiriman masuk dan volume box tersisa.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'api-spec' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">06. REST API Specification Sandbox</h3>
              <p className="text-xs text-slate-500 font-normal">Spec endpoint RESTful N22POS terstandarisasi. Klik tombol di kanan untuk mensimulasikan panggilan API.</p>
            </div>

            {/* HTTP Endpoint List */}
            <div className="space-y-3">
              {/* Endpoint 1 */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-mono font-bold">GET</span>
                    <code className="text-xs font-mono text-slate-800 font-bold">/api/v1/transport-nodes</code>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">Mengambil daftar keseluruhan node integrasi aktif secara nasional dengan detail koordinat.</p>
                </div>
                <button
                  onClick={() => runSandbox('GET', '/api/v1/transport-nodes')}
                  className="px-3 py-1 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-xs rounded text-cyan-800 font-mono font-bold flex items-center gap-1 self-start md:self-center transition shadow-sm"
                >
                  <Play className="w-3 h-3" /> Execute Test Call
                </button>
              </div>

              {/* Endpoint 2 */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-mono font-bold">POST</span>
                    <code className="text-xs font-mono text-slate-800 font-bold">/api/v1/routes</code>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">Membuat Master Rute baru lengkap dengan muatan metadata dan default state Draft.</p>
                </div>
                <button
                  onClick={() => runSandbox('POST', '/api/v1/routes', {
                    route_code: 'RT-MX-99',
                    route_name: 'SUMATERA BARAT EXPRESS',
                    route_category: 'Primer',
                    transport_mode: 'Darat',
                    origin_node: '10000',
                    destination_node: '20100'
                  })}
                  className="px-3 py-1 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-xs rounded text-cyan-800 font-mono font-bold flex items-center gap-1 self-start md:self-center transition shadow-sm"
                >
                  <Play className="w-3 h-3" /> Execute Test Call
                </button>
              </div>

              {/* Endpoint 3 */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-mono font-bold">PATCH</span>
                    <code className="text-xs font-mono text-slate-800 font-bold">/api/v1/routes/:id/approve</code>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal">Melakukan transisi workflow status (Draft → Submitted → Reviewed → Approved → Published).</p>
                </div>
                <button
                  onClick={() => runSandbox('PATCH', '/api/v1/routes/R004/approve', { status: 'Approved', approver: 'Handoko (National)' })}
                  className="px-3 py-1 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-xs rounded text-cyan-800 font-mono font-bold flex items-center gap-1 self-start md:self-center transition shadow-sm"
                >
                  <Play className="w-3 h-3" /> Execute Test Call
                </button>
              </div>
            </div>

            {/* Live Sandbox Display */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner">
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center font-bold">
                <span className="text-xs font-mono text-slate-700">Console Output</span>
                {loadingSandbox && <span className="text-[11px] text-amber-800 animate-pulse font-mono font-bold">Running mock request...</span>}
              </div>
              <pre className="bg-slate-50 p-4 rounded-b-xl text-xs font-mono text-emerald-800 overflow-x-auto max-h-[220px]">
                {sandboxResult}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'frontend-arch' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">07-09. Sitemap, Wireframes, and User Journeys</h3>
              <p className="text-xs text-slate-500 font-normal">Arsitektur Visual, Navigasi Enterprise, dan Aliran Kerja Operator Transportasi.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 shadow-inner">
                <h4 className="text-xs font-bold text-cyan-800">Sitemap &amp; Navigasi Aplikasi</h4>
                <div className="text-xs text-slate-600 font-mono space-y-2 font-normal">
                  <div className="text-slate-900 font-bold">/ (Root Portal Hub)</div>
                  <div className="pl-4 border-l border-slate-200 space-y-1">
                    <div>├── 📊 Dashboard Kerja Nasional</div>
                    <div>├── 📍 Master Kantor &amp; Node Transportasi</div>
                    <div>├── 🛣️ Penata Rute &amp; Etape (Wizard Setup)</div>
                    <div>├── 🚚 Alokasi Armada &amp; Penjadwalan</div>
                    <div>├── 🟩 Pengunggah Excel (Massal Validator)</div>
                    <div>└── ⚙️ Log &amp; Governance Center (AuditTrail)</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 shadow-inner">
                <h4 className="text-xs font-bold text-cyan-800">Workflow Input Wizard Operator</h4>
                <div className="space-y-1.5 list-none text-xs text-slate-600 font-normal">
                  <div className="flex gap-2"><span className="text-cyan-700 font-mono font-bold">Step 1:</span> Informasi Rute (Kode rute, Nama, Kategori)</div>
                  <div className="flex gap-2"><span className="text-cyan-700 font-mono font-bold">Step 2:</span> Titik Asal &amp; Tujuan (Asal KCU, Tujuan SPP/DC)</div>
                  <div className="flex gap-2"><span className="text-cyan-700 font-mono font-bold">Step 3:</span> Penyusunan Etape Transit (Drag reorder pos singgah)</div>
                  <div className="flex gap-2"><span className="text-cyan-700 font-mono font-bold">Step 4:</span> Jadwal Keberangkatan (Operasional &amp; Frekuensi)</div>
                  <div className="flex gap-2"><span className="text-cyan-700 font-mono font-bold">Step 5:</span> Review Validitas Ringkasan Jaringan</div>
                  <div className="flex gap-2"><span className="text-cyan-700 font-mono font-bold">Step 6:</span> Komit Transaksi (Ke Supabase)</div>
                </div>
              </div>
            </div>

            <hr className="border-slate-200" />

            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-3">User Journey: Operator membuat Rute Lintas Baru</h4>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                <div className="relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 hidden md:block"></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                    <div className="bg-white border border-slate-200 p-3 rounded-lg text-center shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center justify-center text-xs font-bold mx-auto mb-2">1</div>
                      <h5 className="text-xs font-bold text-slate-900 mb-1">Inisiasi Data</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-normal animate-none">Operator login, mengisi Wizard, menyusun etape Jakarta → Cirebon → Semarang.</p>
                    </div>

                    <div className="bg-white border border-slate-200 p-3 rounded-lg text-center shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center justify-center text-xs font-bold mx-auto mb-2">2</div>
                      <h5 className="text-xs font-bold text-slate-900 mb-1">State Submitted</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-normal">Operator mengunci data rute, menaikkan status usulan ke Regional Admin.</p>
                    </div>

                    <div className="bg-white border border-slate-200 p-3 rounded-lg text-center shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center justify-center text-xs font-bold mx-auto mb-2">3</div>
                      <h5 className="text-xs font-bold text-slate-900 mb-1">Review Regional</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-normal">Regional Admin meninjau kesesuaian jadwal &amp; sisa kapasitas muat armada.</p>
                    </div>

                    <div className="bg-white border border-slate-200 p-3 rounded-lg text-center shadow-sm">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center text-xs font-bold mx-auto mb-2">4</div>
                      <h5 className="text-xs font-bold text-slate-900 mb-1">Approval &amp; Publish</h5>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-normal">National Admin menyetujui rute menjadi Published, rute aktif di Manifest.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roadmap-mitigation' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">10-12. Roadmap, Risk Mitigation, &amp; Enterprise Best Practices</h3>
              <p className="text-xs text-slate-500 font-normal">Implementasi jangka panjang untuk transportasi terpadu Pos Indonesia.</p>
            </div>

            {/* Long term roadmap steps */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900">Alur Pembangunan Jangka Panjang Semesta N22POS</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-50 p-3 border border-slate-200 rounded-lg shadow-sm">
                  <div className="text-cyan-800 font-mono mb-1 font-bold">FASE 1 (NOW)</div>
                  <h5 className="text-slate-800 font-bold mb-1">Sistem Master Node</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal">Standardisasi Master Kantor Pos, Transport Node, Etape, Jadwal, Wizard Manual &amp; Excel Massal.</p>
                </div>

                <div className="bg-slate-50 p-3 border border-slate-200 rounded-lg shadow-sm">
                  <div className="text-cyan-800 font-mono mb-1 font-bold">FASE 2-3</div>
                  <h5 className="text-slate-800 font-bold mb-1">Routing Engine &amp; Manifest</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal">Perbandingan jalur tercepat menggunakan algoritma Dijkstra, serta Generator Manifest barcode otomatis.</p>
                </div>

                <div className="bg-slate-50 p-3 border border-slate-200 rounded-lg shadow-sm">
                  <div className="text-emerald-800 font-mono mb-1 font-bold">FASE 4-7</div>
                  <h5 className="text-slate-800 font-bold mb-1">AI Dynamic Dispatch</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal">Alokasi armada berbasis IoT gantry sensor, integrasi real-time GPS tracking supir, serta machine learning rerouting.</p>
                </div>
              </div>
            </div>

            <hr className="border-slate-200" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-3">Risiko dan Mitigasi Teknis</h4>
                <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner">
                  <div>
                    <span className="text-red-700 font-bold">R-01: Overlap Run Scheduling</span>
                    <p className="text-slate-600 text-[11px] mt-0.5 font-normal">Potensi tabrakan jam operasional di satu gerbang transit. Mitigasi: Trigger validasi overlap pada level database PostgreSQL-time-ranges.</p>
                  </div>
                  <div>
                    <span className="text-red-700 font-bold">R-02: Dirty Excel Rows (Gagal Massal)</span>
                    <p className="text-slate-600 text-[11px] mt-0.5 font-normal">Satu baris salah menggagalkan ribuan data rute. Mitigasi: Penerapan isolation level 'Serializable' Supabase, membolehkan pratinjau error sebelum commit.</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-3">Best Practice Network Management</h4>
                <div className="space-y-3 bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-inner">
                  <div>
                    <span className="text-cyan-800 font-bold">1. Hub-and-Spoke topology</span>
                    <p className="text-slate-600 text-[11px] mt-0.5 font-normal">Memaksimalkan efisiensi rute sekunder ke regional hub, menjamin efektivitas pengisian kapasitas kubikasi box rute utama primer.</p>
                  </div>
                  <div>
                    <span className="text-cyan-800 font-bold">2. Standardized Naming Convention</span>
                    <p className="text-slate-600 text-[11px] mt-0.5 font-normal">Kode rute berpola [MODE]-[ASAL]-[TUJUAN]-[KATEGORI], contoh: <code className="text-cyan-800 font-mono bg-slate-100 border border-slate-200 px-1 rounded font-bold">DRT-KCU_JKT-KCU_BDG-PRM</code>.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
