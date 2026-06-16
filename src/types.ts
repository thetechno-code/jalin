export type OfficeType = 'KCU' | 'KC' | 'HUB' | 'SPP' | 'DC';

export type NodeCategory =
  | 'National Hub'
  | 'Regional Hub'
  | 'Local Hub'
  | 'Gateway'
  | 'Processing Center'
  | 'Distribution Center';

export type RouteCategory = 'Primer' | 'Sekunder' | 'Tertier';

export type TransportMode = 'Darat' | 'Udara' | 'Laut';

export type FrequencyType = 'Daily' | 'Weekly' | 'Custom';

export type WorkflowStatus =
  | 'Draft'
  | 'Submitted'
  | 'Reviewed'
  | 'Approved'
  | 'Rejected'
  | 'Published';

export type UserRole =
  | 'Super Admin Nasional'
  | 'Regional Admin'
  | 'Operator Hub'
  | 'Viewer'
  | 'Auditor';

export interface Office {
  office_code: string;
  office_name: string;
  office_type: OfficeType;
  region_code: string;
}

export interface TransportNode {
  office_code: string;
  is_transport_node: boolean;
  node_category: NodeCategory;
  parent_node_code?: string;
  service_area: string;
  geographic_center: { lat: number; lng: number };
}

export interface Route {
  id: string;
  route_code: string;
  route_name: string;
  route_category: RouteCategory;
  transport_mode: TransportMode;
  origin_node: string; // office_code
  destination_node: string; // office_code
  effective_date: string;
  expired_date: string;
  status: WorkflowStatus;
  capacity_kg?: number;
  price_per_kg?: number;
}

export interface Etape {
  id: string;
  route_id: string;
  sequence_no: number;
  transport_node_code: string; // office_code
  estimated_arrival: string; // e.g. "14:00" or "+1d 02:00"
  estimated_departure: string;
}

export interface Schedule {
  id: string;
  route_id: string;
  departure_time: string;
  arrival_time: string;
  frequency: FrequencyType;
  operating_days: string[]; // e.g. ['Senin', 'Selasa']
  effective_date: string;
  expired_date: string;
}

export interface VehicleType {
  vehicle_code: string;
  vehicle_name: string;
  vehicle_mode: TransportMode;
  max_weight: number; // in kg
  max_volume: number; // in m³
}

export interface RouteCapacity {
  id: string;
  route_id: string;
  vehicle_code: string;
  max_weight: number;
  max_volume: number;
  reserved_capacity: number; // percentage
  available_capacity: number; // percentage
}

export interface AuditRecord {
  id: string;
  created_at: string;
  created_by: string;
  updated_at?: string;
  updated_by?: string;
  approved_at?: string;
  approved_by?: string;
  published_at?: string;
  published_by?: string;
  action_description: string;
}

export interface ExcelRow {
  row_no: number;
  route_code: string;
  route_name: string;
  route_category: string;
  transport_mode: string;
  origin_node: string;
  destination_node: string;
  etape_sequence: string; // e.g. "JAKARTA,CIREBON,SEMARANG,SURABAYA"
  vehicle_code: string;
  status?: 'Valid' | 'Error';
  validation_errors: string[];
}

export interface Vendor {
  id: string;
  vendor_code: string;
  vendor_name: string;
  vendor_type: 'BUMN' | 'Swasta' | 'Internasional' | 'Koperasi';
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  status: 'Aktif' | 'Suspended';
  rating: number; // 1-5 stars
}

export interface Fleet {
  id: string;
  license_plate: string; // e.g., B-9012-POS or PK-GIA (aircraft plate)
  vehicle_name: string; // e.g., Wingbox Hino, Grand Max Blindvan, Boeing 737 Cargo
  vehicle_mode: TransportMode;
  max_weight: number; // in kg
  max_volume: number; // in m3
  vendor_id: string; // foreign key to Vendor
  status: 'Tersedia' | 'Beroperasi' | 'Perbaikan';
}

export interface LogisticsUser {
  id?: number;
  username: string;
  password?: string;
  full_name: string;
  role: UserRole;
  office_code: string;
  status: 'Aktif' | 'Nonaktif';
  created_at?: string;
}

export const getRegionLabel = (code: string): string => {
  const regions: Record<string, string> = {
    'REG-01': 'Regional 1 Medan',
    'REG-02': 'Regional 2 Jakarta',
    'REG-03': 'Regional 3 Bandung',
    'REG-04': 'Regional 4 Semarang',
    'REG-05': 'Regional 5 Surabaya',
    'REG-06': 'Regional 6 Makassar'
  };
  return regions[code] || code;
};

// Phase 2 Type Definitions

export interface VehicleAssignment {
  assignment_id: string;
  route_id: string;
  vehicle_type: string; // e.g. 'CDD', 'FUSO', 'WBOX'
  vehicle_no: string; // Nopol, e.g. 'D123XZ'
  schedule_id: string;
  planned_weight: number; // in KG
  planned_volume: number; // in M3
  assigned_date: string; // e.g. '2026-06-13'
  status: 'Draft' | 'Assigned' | 'Enroute' | 'Completed';
}

export interface ManifestRealization {
  manifest_no: string;
  route_id: string;
  vehicle_no: string;
  actual_weight: number; // in KG
  actual_volume: number; // in M3
  manifest_date: string;
  source_system: string; // e.g. 'iPOS5'
  created_at: string;
}

export interface CapacitySnapshot {
  snapshot_id: string;
  route_id: string;
  assigned_date: string;
  max_weight: number;
  max_volume: number;
  used_weight: number;
  used_volume: number;
  remaining_weight: number;
  remaining_volume: number;
  utilization_percentage: number;
  status: 'Green' | 'Yellow' | 'Orange' | 'Red';
  updated_at: string;
}

export interface RoutePerformance {
  performance_id: string;
  route_id: string;
  manifest_no: string;
  planned_arrival: string; // ISO datetime
  actual_arrival: string; // ISO datetime
  delay_minutes: number;
  delay_hours: number;
  delay_percentage: number;
  sla_status: 'On-Time' | 'Delayed' | 'Breach';
}

export interface CapacityAlert {
  alert_id: string;
  alert_type: 'Capacity_90' | 'Capacity_100' | 'Vehicle_Not_Assigned' | 'Route_Without_Manifest' | 'Manifest_Without_Route' | 'SLA_Breach';
  route_id?: string;
  route_code?: string;
  message: string;
  created_at: string;
  resolved: boolean;
}


