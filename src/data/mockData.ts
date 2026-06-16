import { Office, TransportNode, Route, Etape, Schedule, VehicleType, RouteCapacity, AuditRecord } from '../types';

export const INITIAL_OFFICES: Office[] = [
  { office_code: '10000', office_name: 'KCU Jakarta Pusat', office_type: 'KCU', region_code: 'REG-02' },
  { office_code: '40000', office_name: 'KCU Bandung', office_type: 'KCU', region_code: 'REG-03' },
  { office_code: '50000', office_name: 'KCU Semarang', office_type: 'KCU', region_code: 'REG-04' },
  { office_code: '60000', office_name: 'KCU Surabaya', office_type: 'KCU', region_code: 'REG-05' },
  { office_code: '20100', office_name: 'KCU Medan', office_type: 'KCU', region_code: 'REG-01' },
  { office_code: '30000', office_name: 'KCU Palembang', office_type: 'KCU', region_code: 'REG-06' },
  { office_code: '70000', office_name: 'KCU Balikpapan', office_type: 'KCU', region_code: 'REG-06' },
  { office_code: '90000', office_name: 'KCU Makassar', office_type: 'KCU', region_code: 'REG-06' },
  { office_code: '99000', office_name: 'KCU Jayapura', office_type: 'KCU', region_code: 'REG-06' },
  
  { office_code: '45100', office_name: 'KC Cirebon', office_type: 'KC', region_code: 'REG-03' },
  { office_code: '46100', office_name: 'KC Tasikmalaya', office_type: 'KC', region_code: 'REG-03' },
  { office_code: '53100', office_name: 'KC Purwokerto', office_type: 'KC', region_code: 'REG-04' },
  { office_code: '64100', office_name: 'KC Madiun', office_type: 'KC', region_code: 'REG-05' },
  { office_code: '80000', office_name: 'KCU Denpasar', office_type: 'KCU', region_code: 'REG-05' },
  
  { office_code: '19000', office_name: 'SPP Jakarta Soekarno-Hatta', office_type: 'SPP', region_code: 'REG-02' },
  { office_code: '40199', office_name: 'SPP Bandung Gedebage', office_type: 'SPP', region_code: 'REG-03' },
  { office_code: '60199', office_name: 'SPP Surabaya Juanda', office_type: 'SPP', region_code: 'REG-05' },
  
  { office_code: '30199', office_name: 'HUB Palembang Cargo', office_type: 'HUB', region_code: 'REG-06' },
  { office_code: '70199', office_name: 'HUB Sepinggan Cargo', office_type: 'HUB', region_code: 'REG-06' },
  
  { office_code: '10100', office_name: 'DC Jakarta Timur', office_type: 'DC', region_code: 'REG-02' },
  { office_code: '40100', office_name: 'DC Bandung Kulon', office_type: 'DC', region_code: 'REG-03' }
];

export const INITIAL_TRANSPORT_NODES: TransportNode[] = [
  {
    office_code: '10000',
    is_transport_node: true,
    node_category: 'National Hub',
    service_area: 'DKI Jakarta dan sekitarnya',
    geographic_center: { lat: -6.2088, lng: 106.8456 }
  },
  {
    office_code: '40000',
    is_transport_node: true,
    node_category: 'Regional Hub',
    parent_node_code: '10000',
    service_area: 'Jawa Barat bagian barat (Priangan)',
    geographic_center: { lat: -6.9175, lng: 107.6191 }
  },
  {
    office_code: '50000',
    is_transport_node: true,
    node_category: 'Regional Hub',
    parent_node_code: '10000',
    service_area: 'Jawa Tengah bagian Utara dan Selatan',
    geographic_center: { lat: -6.9667, lng: 110.4167 }
  },
  {
    office_code: '60000',
    is_transport_node: true,
    node_category: 'Regional Hub',
    parent_node_code: '10000',
    service_area: 'Jawa Timur dan Indonesia Timur',
    geographic_center: { lat: -7.2575, lng: 112.7521 }
  },
  {
    office_code: '20100',
    is_transport_node: true,
    node_category: 'Gateway',
    service_area: 'Sumatera Bagian Utara',
    geographic_center: { lat: 3.5952, lng: 98.6722 }
  },
  {
    office_code: '30000',
    is_transport_node: true,
    node_category: 'Regional Hub',
    parent_node_code: '10000',
    service_area: 'Sumatera Selatan dan Lampung',
    geographic_center: { lat: -2.9761, lng: 104.7754 }
  },
  {
    office_code: '70000',
    is_transport_node: true,
    node_category: 'Regional Hub',
    parent_node_code: '10000',
    service_area: 'Kalimantan Timur dan Utara',
    geographic_center: { lat: -1.2654, lng: 116.8903 }
  },
  {
    office_code: '90000',
    is_transport_node: true,
    node_category: 'Gateway',
    service_area: 'Sulawesi Selatan, Barat dan Tengah',
    geographic_center: { lat: -5.1477, lng: 119.4327 }
  },
  {
    office_code: '99000',
    is_transport_node: true,
    node_category: 'Processing Center',
    service_area: 'Provinsi Papua dan Papua Barat',
    geographic_center: { lat: -2.5488, lng: 140.7178 }
  },
  {
    office_code: '45100',
    is_transport_node: true,
    node_category: 'Local Hub',
    parent_node_code: '40000',
    service_area: 'Cirebon, Kuningan, Majalengka, Indramayu',
    geographic_center: { lat: -6.7216, lng: 108.5539 }
  },
  {
    office_code: '19000',
    is_transport_node: true,
    node_category: 'Gateway',
    parent_node_code: '10000',
    service_area: 'Cargo Internasional Bandara Soekarno-Hatta',
    geographic_center: { lat: -6.1256, lng: 106.6558 }
  }
];

export const INITIAL_VEHICLE_TYPES: VehicleType[] = [
  { vehicle_code: 'CDD', vehicle_name: 'Colt Diesel Double (CDD Box)', vehicle_mode: 'Darat', max_weight: 4000, max_volume: 14 },
  { vehicle_code: 'FUSO', vehicle_name: 'MHD Fuso Tronton Box', vehicle_mode: 'Darat', max_weight: 15000, max_volume: 32 },
  { vehicle_code: 'WBOX', vehicle_name: 'Euro-5 Wingbox Heavy Carrier', vehicle_mode: 'Darat', max_weight: 25000, max_volume: 45 },
  { vehicle_code: 'PCARGO', vehicle_name: 'Boeing 737-800F Cargo Aircraft', vehicle_mode: 'Udara', max_weight: 21000, max_volume: 120 },
  { vehicle_code: 'KCARGO', vehicle_name: 'Pelni Roro Logistics Freighter', vehicle_mode: 'Laut', max_weight: 500000, max_volume: 4800 }
];

export const INITIAL_ROUTES: Route[] = [
  {
    id: 'R001',
    route_code: 'RT-001',
    route_name: 'LINTAS JAWA UTARA STANDARD',
    route_category: 'Primer',
    transport_mode: 'Darat',
    origin_node: '10000', // Jakarta
    destination_node: '60000', // Surabaya
    effective_date: '2026-01-01',
    expired_date: '2026-12-31',
    status: 'Published'
  },
  {
    id: 'R002',
    route_code: 'RT-002',
    route_name: 'PRIANGAN BARAT LOGISTICS',
    route_category: 'Sekunder',
    transport_mode: 'Darat',
    origin_node: '10000', // Jakarta
    destination_node: '40000', // Bandung
    effective_date: '2026-03-01',
    expired_date: '2027-03-01',
    status: 'Reviewed'
  },
  {
    id: 'R003',
    route_code: 'RT-003',
    route_name: 'INTER-GATEWAY CARGO CORRIDOR',
    route_category: 'Primer',
    transport_mode: 'Udara',
    origin_node: '19000', // SPP Cengkareng
    destination_node: '90000', // Makassar
    effective_date: '2026-01-15',
    expired_date: '2027-01-15',
    status: 'Published'
  },
  {
    id: 'R004',
    route_code: 'RT-004',
    route_name: 'SUMATERA TRANSIT BACKBONE',
    route_category: 'Primer',
    transport_mode: 'Darat',
    origin_node: '10000', // Jakarta
    destination_node: '20100', // Medan
    effective_date: '2026-02-01',
    expired_date: '2026-12-31',
    status: 'Submitted'
  },
  {
    id: 'R005',
    route_code: 'RT-005',
    route_name: 'PACIFIC SEABOARD MARITIME',
    route_category: 'Tertier',
    transport_mode: 'Laut',
    origin_node: '60000', // Surabaya
    destination_node: '99000', // Jayapura
    effective_date: '2026-05-01',
    expired_date: '2027-05-01',
    status: 'Draft'
  }
];

export const INITIAL_ETAPES: Etape[] = [
  // RT-001 (Jakarta -> Cirebon -> Semarang -> Surabaya)
  { id: 'E001', route_id: 'R001', sequence_no: 1, transport_node_code: '10000', estimated_arrival: 'Start', estimated_departure: '08:00' },
  { id: 'E002', route_id: 'R001', sequence_no: 2, transport_node_code: '45100', estimated_arrival: '12:00', estimated_departure: '13:00' },
  { id: 'E033', route_id: 'R001', sequence_no: 3, transport_node_code: '50000', estimated_arrival: '18:00', estimated_departure: '19:00' },
  { id: 'E004', route_id: 'R001', sequence_no: 4, transport_node_code: '60000', estimated_arrival: '23:30', estimated_departure: 'End' },

  // RT-002 (Jakarta -> Bandung)
  { id: 'E005', route_id: 'R002', sequence_no: 1, transport_node_code: '10000', estimated_arrival: 'Start', estimated_departure: '09:00' },
  { id: 'E006', route_id: 'R002', sequence_no: 2, transport_node_code: '40000', estimated_arrival: '12:30', estimated_departure: 'End' },

  // RT-003 (SPP Cengkareng -> Makassar)
  { id: 'E007', route_id: 'R003', sequence_no: 1, transport_node_code: '19000', estimated_arrival: 'Start', estimated_departure: '14:00' },
  { id: 'E008', route_id: 'R003', sequence_no: 2, transport_node_code: '90000', estimated_arrival: '17:30', estimated_departure: 'End' },

  // RT-004 (Jakarta -> Palembang -> Medan)
  { id: 'E009', route_id: 'R004', sequence_no: 1, transport_node_code: '10000', estimated_arrival: 'Start', estimated_departure: '06:00' },
  { id: 'E010', route_id: 'R004', sequence_no: 2, transport_node_code: '30000', estimated_arrival: '18:00', estimated_departure: '19:00' },
  { id: 'E011', route_id: 'R004', sequence_no: 3, transport_node_code: '20100', estimated_arrival: '+1d 15:00', estimated_departure: 'End' },

  // RT-005 (Surabaya -> Jayapura)
  { id: 'E012', route_id: 'R005', sequence_no: 1, transport_node_code: '60000', estimated_arrival: 'Start', estimated_departure: '12:00' },
  { id: 'E013', route_id: 'R005', sequence_no: 2, transport_node_code: '99000', estimated_arrival: '+4d 10:00', estimated_departure: 'End' }
];

export const INITIAL_SCHEDULES: Schedule[] = [
  {
    id: 'S001',
    route_id: 'R001',
    departure_time: '08:00',
    arrival_time: '23:30',
    frequency: 'Daily',
    operating_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
    effective_date: '2026-01-01',
    expired_date: '2026-12-31'
  },
  {
    id: 'S002',
    route_id: 'R002',
    departure_time: '09:00',
    arrival_time: '12:30',
    frequency: 'Weekly',
    operating_days: ['Senin', 'Rabu', 'Jumat'],
    effective_date: '2026-03-01',
    expired_date: '2027-03-01'
  },
  {
    id: 'S003',
    route_id: 'R003',
    departure_time: '14:00',
    arrival_time: '17:30',
    frequency: 'Daily',
    operating_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'],
    effective_date: '2026-01-15',
    expired_date: '2027-01-15'
  }
];

export const INITIAL_CAPACITIES: RouteCapacity[] = [
  { id: 'C001', route_id: 'R001', vehicle_code: 'WBOX', max_weight: 25000, max_volume: 45, reserved_capacity: 65, available_capacity: 35 },
  { id: 'C002', route_id: 'R002', vehicle_code: 'FUSO', max_weight: 15000, max_volume: 32, reserved_capacity: 20, available_capacity: 80 },
  { id: 'C003', route_id: 'R003', vehicle_code: 'PCARGO', max_weight: 21000, max_volume: 120, reserved_capacity: 45, available_capacity: 55 }
];

export const INITIAL_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'A001',
    created_at: '2026-06-10T10:00:00Z',
    created_by: 'Budi Santoso (Operator)',
    action_description: 'Membuat Rute Baru RT-005 LINTAS PACIFIC MARITIME'
  },
  {
    id: 'A002',
    created_at: '2026-06-11T09:12:00Z',
    created_by: 'Siti Rahma (Regional Admin)',
    updated_at: '2026-06-11T09:15:00Z',
    updated_by: 'Siti Rahma',
    action_description: 'Melakukan review rute RT-002 PRIANGAN BARAT LOGISTICS dan mengubah status menjadi REVIEWED'
  },
  {
    id: 'A003',
    created_at: '2026-06-12T07:00:00Z',
    created_by: 'Handoko (National Admin)',
    approved_at: '2026-06-12T07:15:00Z',
    approved_by: 'Handoko',
    published_at: '2026-06-12T07:20:00Z',
    published_by: 'Handoko',
    action_description: 'Menyetujui (APPROVED) dan mempublikasikan (PUBLISHED) rute RT-001 LINTAS JAWA UTARA'
  }
];
