import { sql } from 'drizzle-orm';
import { db } from './index.ts';

export async function ensureTablesExist() {
  const ddl = `
-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  office_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aktif',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Offices Table
CREATE TABLE IF NOT EXISTS offices (
  office_code TEXT PRIMARY KEY,
  office_name TEXT NOT NULL,
  office_type TEXT NOT NULL,
  region_code TEXT NOT NULL
);

-- 3. Transport Nodes Table
CREATE TABLE IF NOT EXISTS transport_nodes (
  office_code TEXT PRIMARY KEY REFERENCES offices(office_code),
  is_transport_node BOOLEAN NOT NULL DEFAULT false,
  node_category TEXT NOT NULL,
  parent_node_code TEXT,
  service_area TEXT NOT NULL,
  geographic_center JSONB NOT NULL
);

-- 4. Routes Table
CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  route_code TEXT NOT NULL UNIQUE,
  route_name TEXT NOT NULL,
  route_category TEXT NOT NULL,
  transport_mode TEXT NOT NULL,
  origin_node TEXT NOT NULL REFERENCES offices(office_code),
  destination_node TEXT NOT NULL REFERENCES offices(office_code),
  effective_date TEXT NOT NULL,
  expired_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  capacity_kg INTEGER DEFAULT 0,
  price_per_kg INTEGER DEFAULT 0
);

-- 5. Etapes Table
CREATE TABLE IF NOT EXISTS etapes (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  transport_node_code TEXT NOT NULL REFERENCES offices(office_code),
  estimated_arrival TEXT NOT NULL,
  estimated_departure TEXT NOT NULL
);

-- 6. Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  frequency TEXT NOT NULL,
  operating_days JSONB NOT NULL,
  effective_date TEXT NOT NULL,
  expired_date TEXT NOT NULL
);

-- 7. Route Capacities Table
CREATE TABLE IF NOT EXISTS capacities (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  vehicle_code TEXT NOT NULL,
  max_weight INTEGER NOT NULL,
  max_volume INTEGER NOT NULL,
  reserved_capacity INTEGER NOT NULL,
  available_capacity INTEGER NOT NULL
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_records (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT,
  updated_by TEXT,
  approved_at TEXT,
  approved_by TEXT,
  published_at TEXT,
  published_by TEXT,
  action_description TEXT NOT NULL
);

-- 9. Vendors Table
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  vendor_code TEXT NOT NULL UNIQUE,
  vendor_name TEXT NOT NULL,
  vendor_type TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Aktif',
  rating INTEGER NOT NULL DEFAULT 5
);

-- 10. Fleets Table
CREATE TABLE IF NOT EXISTS fleets (
  id TEXT PRIMARY KEY,
  license_plate TEXT NOT NULL UNIQUE,
  vehicle_name TEXT NOT NULL,
  vehicle_mode TEXT NOT NULL,
  max_weight INTEGER NOT NULL,
  max_volume INTEGER NOT NULL,
  vendor_id TEXT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Tersedia'
);

-- 11. Capacity Reservations Table
CREATE TABLE IF NOT EXISTS capacity_reservation (
  id SERIAL PRIMARY KEY,
  reservation_code TEXT NOT NULL,
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  reserved_weight INTEGER NOT NULL,
  reserved_volume INTEGER NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  allocation_strategy TEXT NOT NULL DEFAULT 'Priority Based',
  created_by TEXT NOT NULL DEFAULT 'Planner',
  created_at TIMESTAMP DEFAULT NOW(),
  notes TEXT
);

-- 12. Capacity Bookings Table
CREATE TABLE IF NOT EXISTS capacity_booking (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER REFERENCES capacity_reservation(id) ON DELETE CASCADE,
  slot_code TEXT NOT NULL,
  booking_timestamp TIMESTAMP DEFAULT NOW(),
  occupancy_percentage INTEGER NOT NULL
);

-- 13. Capacity Releases Table
CREATE TABLE IF NOT EXISTS capacity_release (
  id SERIAL PRIMARY KEY,
  reservation_id INTEGER REFERENCES capacity_reservation(id) ON DELETE CASCADE,
  released_weight INTEGER NOT NULL,
  released_volume INTEGER NOT NULL,
  released_at TIMESTAMP DEFAULT NOW(),
  released_by TEXT NOT NULL
);

-- 14. Capacity Forecasts Table
CREATE TABLE IF NOT EXISTS capacity_forecast (
  id SERIAL PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  forecast_period TEXT NOT NULL,
  predicted_volume_kg INTEGER NOT NULL,
  current_capacity_kg INTEGER NOT NULL,
  capacity_gap_kg INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 15. Vehicle Plannings Table
CREATE TABLE IF NOT EXISTS vehicle_planning (
  id SERIAL PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  forecast_volume_kg INTEGER NOT NULL,
  vehicle_capacity_kg INTEGER NOT NULL,
  required_vehicle_count INTEGER NOT NULL,
  vehicle_type_recommended TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 16. Reservation Priorities Table
CREATE TABLE IF NOT EXISTS reservation_priority (
  id SERIAL PRIMARY KEY,
  priority_name TEXT NOT NULL UNIQUE,
  weight_value INTEGER NOT NULL,
  allocation_quota_pct INTEGER NOT NULL,
  description TEXT
);

-- 17. Load Plannings Table
CREATE TABLE IF NOT EXISTS load_planning (
  id SERIAL PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  total_shipment_weight_kg INTEGER NOT NULL,
  recommended_vehicle_layout TEXT NOT NULL,
  overall_utilization_pct INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 18. Consolidation Recommendations Table
CREATE TABLE IF NOT EXISTS consolidation_recommendation (
  id SERIAL PRIMARY KEY,
  route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  manifests_grouped JSONB NOT NULL,
  destination_node_code TEXT NOT NULL,
  schedule_time TEXT NOT NULL,
  total_weight_kg INTEGER NOT NULL,
  action_recommended TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 19. Routing Requests Table
CREATE TABLE IF NOT EXISTS routing_request (
  id SERIAL PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  weight INTEGER NOT NULL,
  volume INTEGER NOT NULL,
  product_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 20. Routing Results Table
CREATE TABLE IF NOT EXISTS routing_result (
  id SERIAL PRIMARY KEY,
  request_id INTEGER,
  recommended_route_code TEXT NOT NULL,
  total_transit INTEGER NOT NULL,
  estimated_sla_hours INTEGER NOT NULL,
  available_capacity_kg INTEGER NOT NULL,
  route_score INTEGER NOT NULL,
  routing_status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 21. Routing Rules Table
CREATE TABLE IF NOT EXISTS routing_rule (
  id SERIAL PRIMARY KEY,
  rule_name TEXT NOT NULL,
  parameter_target TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT
);

-- 22. Routing Strategies Table
CREATE TABLE IF NOT EXISTS routing_strategy (
  id SERIAL PRIMARY KEY,
  strategy_name TEXT NOT NULL,
  sla_weight INTEGER NOT NULL,
  capacity_weight INTEGER NOT NULL,
  transit_weight INTEGER NOT NULL,
  performance_weight INTEGER NOT NULL,
  cost_weight INTEGER NOT NULL
);

-- 23. Routing Scores Table
CREATE TABLE IF NOT EXISTS routing_score (
  id SERIAL PRIMARY KEY,
  result_id INTEGER,
  sla_points INTEGER NOT NULL,
  capacity_points INTEGER NOT NULL,
  transit_points INTEGER NOT NULL,
  performance_points INTEGER NOT NULL,
  cost_points INTEGER NOT NULL,
  final_aggregate_score INTEGER NOT NULL
);

-- 24. Route Performance Histories Table
CREATE TABLE IF NOT EXISTS route_performance_history (
  id SERIAL PRIMARY KEY,
  route_code TEXT NOT NULL,
  total_runs INTEGER NOT NULL,
  on_time_runs INTEGER NOT NULL,
  delayed_runs INTEGER NOT NULL,
  avg_delay_minutes INTEGER NOT NULL,
  sla_achievement_pct INTEGER NOT NULL
);

-- 25. Route Recommendation Logs Table
CREATE TABLE IF NOT EXISTS route_recommendation_log (
  id SERIAL PRIMARY KEY,
  origin_node_code TEXT NOT NULL,
  destination_node_code TEXT NOT NULL,
  selected_route_code TEXT NOT NULL,
  alternative_applied TEXT NOT NULL,
  score_applied INTEGER NOT NULL,
  trigger_timestamp TIMESTAMP DEFAULT NOW()
);
  `;
  
  await db.execute(sql.raw(ddl));
}
