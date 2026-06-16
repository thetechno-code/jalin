import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, json } from 'drizzle-orm/pg-core';

// 1. Users Table (for Local Multi-office User & Role Management)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  full_name: text('full_name').notNull(),
  role: text('role').notNull(), // 'Super Admin Nasional' | 'Regional Admin' | 'Operator Hub' | 'Viewer' | 'Auditor'
  office_code: text('office_code').notNull(),
  status: text('status').notNull().default('Aktif'),
  created_at: timestamp('created_at').defaultNow(),
});

// 2. Offices Table
export const offices = pgTable('offices', {
  office_code: text('office_code').primaryKey(),
  office_name: text('office_name').notNull(),
  office_type: text('office_type').notNull(), // 'KCU' | 'KC' | 'HUB' | 'SPP' | 'DC'
  region_code: text('region_code').notNull(),
});

// 3. Transport Nodes Table
export const transportNodes = pgTable('transport_nodes', {
  office_code: text('office_code')
    .primaryKey()
    .references(() => offices.office_code),
  is_transport_node: boolean('is_transport_node').notNull().default(false),
  node_category: text('node_category').notNull(), // 'National Hub', etc
  parent_node_code: text('parent_node_code'), // parent office_code
  service_area: text('service_area').notNull(),
  geographic_center: json('geographic_center').notNull(), // { lat: number, lng: number }
});

// 4. Routes Table
export const routes = pgTable('routes', {
  id: text('id').primaryKey(),
  route_code: text('route_code').notNull().unique(),
  route_name: text('route_name').notNull(),
  route_category: text('route_category').notNull(), // 'Primer' | 'Sekunder' | 'Tertier'
  transport_mode: text('transport_mode').notNull(), // 'Darat' | 'Udara' | 'Laut'
  origin_node: text('origin_node').notNull().references(() => offices.office_code),
  destination_node: text('destination_node').notNull().references(() => offices.office_code),
  effective_date: text('effective_date').notNull(),
  expired_date: text('expired_date').notNull(),
  status: text('status').notNull().default('Draft'), // 'Draft' | 'Submitted' | ...
  capacity_kg: integer('capacity_kg').default(0),
  price_per_kg: integer('price_per_kg').default(0),
});

// 5. Etapes Table (transit stops)
export const etapes = pgTable('etapes', {
  id: text('id').primaryKey(),
  route_id: text('route_id')
    .notNull()
    .references(() => routes.id, { onDelete: 'cascade' }),
  sequence_no: integer('sequence_no').notNull(),
  transport_node_code: text('transport_node_code').notNull().references(() => offices.office_code),
  estimated_arrival: text('estimated_arrival').notNull(),
  estimated_departure: text('estimated_departure').notNull(),
});

// 6. Schedules Table
export const schedules = pgTable('schedules', {
  id: text('id').primaryKey(),
  route_id: text('route_id')
    .notNull()
    .references(() => routes.id, { onDelete: 'cascade' }),
  departure_time: text('departure_time').notNull(),
  arrival_time: text('arrival_time').notNull(),
  frequency: text('frequency').notNull(), // 'Daily' | 'Weekly' | 'Custom'
  operating_days: json('operating_days').notNull(), // string[] structure
  effective_date: text('effective_date').notNull(),
  expired_date: text('expired_date').notNull(),
});

// 7. Route Capacities Table
export const capacities = pgTable('capacities', {
  id: text('id').primaryKey(),
  route_id: text('route_id')
    .notNull()
    .references(() => routes.id, { onDelete: 'cascade' }),
  vehicle_code: text('vehicle_code').notNull(),
  max_weight: integer('max_weight').notNull(),
  max_volume: integer('max_volume').notNull(),
  reserved_capacity: integer('reserved_capacity').notNull(), // percentage
  available_capacity: integer('available_capacity').notNull(), // percentage
});

// 8. Audit Logs Table
export const auditRecords = pgTable('audit_records', {
  id: text('id').primaryKey(),
  created_at: text('created_at').notNull(),
  created_by: text('created_by').notNull(),
  updated_at: text('updated_at'),
  updated_by: text('updated_by'),
  approved_at: text('approved_at'),
  approved_by: text('approved_by'),
  published_at: text('published_at'),
  published_by: text('published_by'),
  action_description: text('action_description').notNull(),
});

// 9. Vendors Table
export const vendors = pgTable('vendors', {
  id: text('id').primaryKey(),
  vendor_code: text('vendor_code').notNull().unique(),
  vendor_name: text('vendor_name').notNull(),
  vendor_type: text('vendor_type').notNull(), // 'BUMN', 'Swasta', 'Internasional', 'Koperasi'
  contact_person: text('contact_person').notNull(),
  contact_phone: text('contact_phone').notNull(),
  contact_email: text('contact_email').notNull(),
  status: text('status').notNull().default('Aktif'), // 'Aktif' | 'Suspended'
  rating: integer('rating').notNull().default(5),
});

// 10. Fleets Table (Armada)
export const fleets = pgTable('fleets', {
  id: text('id').primaryKey(),
  license_plate: text('license_plate').notNull().unique(),
  vehicle_name: text('vehicle_name').notNull(),
  vehicle_mode: text('vehicle_mode').notNull(), // 'Darat' | 'Udara' | 'Laut'
  max_weight: integer('max_weight').notNull(),
  max_volume: integer('max_volume').notNull(),
  vendor_id: text('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('Tersedia'), // 'Tersedia' | 'Beroperasi' | 'Perbaikan'
});

// Relationships
export const officesRelations = relations(offices, ({ many, one }) => ({
  transportNode: one(transportNodes, {
    fields: [offices.office_code],
    references: [transportNodes.office_code],
  }),
}));

export const routesRelations = relations(routes, ({ many }) => ({
  etapes: many(etapes),
  schedules: many(schedules),
  capacities: many(capacities),
}));

export const etapesRelations = relations(etapes, ({ one }) => ({
  route: one(routes, {
    fields: [etapes.route_id],
    references: [routes.id],
  }),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  route: one(routes, {
    fields: [schedules.route_id],
    references: [routes.id],
  }),
}));

export const capacitiesRelations = relations(capacities, ({ one }) => ({
  route: one(routes, {
    fields: [capacities.route_id],
    references: [routes.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  fleets: many(fleets),
}));

export const fleetsRelations = relations(fleets, ({ one }) => ({
  vendor: one(vendors, {
    fields: [fleets.vendor_id],
    references: [vendors.id],
  }),
}));

// Phase 3: Capacity Reservation, Booking, Release, Forecast, and Load Planning Tables
export const capacityReservations = pgTable('capacity_reservation', {
  id: serial('id').primaryKey(),
  reservation_code: text('reservation_code').notNull(),
  route_id: text('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
  schedule_id: text('schedule_id').notNull().references(() => schedules.id, { onDelete: 'cascade' }),
  reserved_weight: integer('reserved_weight').notNull(),
  reserved_volume: integer('reserved_volume').notNull(),
  priority: text('priority').notNull(), // 'Express' | 'Q9' | 'Paket Jumbo' | 'Logistik' | 'EMS' | 'Corporate'
  status: text('status').notNull().default('Draft'), // 'Draft' | 'Reserved' | 'Confirmed' | 'Expired' | 'Cancelled' | 'Released' | 'Completed'
  allocation_strategy: text('allocation_strategy').notNull().default('Priority Based'), // 'First Come First Serve' | 'Priority Based' | 'Quota Based' | 'Hybrid'
  created_by: text('created_by').notNull().default('Planner'),
  created_at: timestamp('created_at').defaultNow(),
  notes: text('notes'),
});

export const capacityBookings = pgTable('capacity_booking', {
  id: serial('id').primaryKey(),
  reservation_id: integer('reservation_id').references(() => capacityReservations.id, { onDelete: 'cascade' }),
  slot_code: text('slot_code').notNull(),
  booking_timestamp: timestamp('booking_timestamp').defaultNow(),
  occupancy_percentage: integer('occupancy_percentage').notNull(),
});

export const capacityReleases = pgTable('capacity_release', {
  id: serial('id').primaryKey(),
  reservation_id: integer('reservation_id').references(() => capacityReservations.id, { onDelete: 'cascade' }),
  released_weight: integer('released_weight').notNull(),
  released_volume: integer('released_volume').notNull(),
  released_at: timestamp('released_at').defaultNow(),
  released_by: text('released_by').notNull(),
});

export const capacityForecasts = pgTable('capacity_forecast', {
  id: serial('id').primaryKey(),
  route_id: text('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
  forecast_period: text('forecast_period').notNull(), // 'Daily' | 'Weekly' | 'Monthly' | 'Peak Season'
  predicted_volume_kg: integer('predicted_volume_kg').notNull(),
  current_capacity_kg: integer('current_capacity_kg').notNull(),
  capacity_gap_kg: integer('capacity_gap_kg').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const vehiclePlannings = pgTable('vehicle_planning', {
  id: serial('id').primaryKey(),
  route_id: text('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
  forecast_volume_kg: integer('forecast_volume_kg').notNull(),
  vehicle_capacity_kg: integer('vehicle_capacity_kg').notNull(),
  required_vehicle_count: integer('required_vehicle_count').notNull(),
  vehicle_type_recommended: text('vehicle_type_recommended').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const reservationPriorities = pgTable('reservation_priority', {
  id: serial('id').primaryKey(),
  priority_name: text('priority_name').notNull().unique(), // 'Express' | 'Q9' etc
  weight_value: integer('weight_value').notNull(),
  allocation_quota_pct: integer('allocation_quota_pct').notNull(),
  description: text('description'),
});

export const loadPlannings = pgTable('load_planning', {
  id: serial('id').primaryKey(),
  route_id: text('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
  total_shipment_weight_kg: integer('total_shipment_weight_kg').notNull(),
  recommended_vehicle_layout: text('recommended_vehicle_layout').notNull(), // JSON block or layout string
  overall_utilization_pct: integer('overall_utilization_pct').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const consolidationRecommendations = pgTable('consolidation_recommendation', {
  id: serial('id').primaryKey(),
  route_id: text('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
  manifests_grouped: json('manifests_grouped').notNull(), // details of small manifests
  destination_node_code: text('destination_node_code').notNull(),
  schedule_time: text('schedule_time').notNull(),
  total_weight_kg: integer('total_weight_kg').notNull(),
  action_recommended: text('action_recommended').notNull(), // 'Merge into one transport execution'
  status: text('status').notNull().default('Pending'), // 'Pending' | 'Merged' | 'Dismissed'
  created_at: timestamp('created_at').defaultNow(),
});

// Relationships for Capacity Reservations & Planning
export const capacityReservationsRelations = relations(capacityReservations, ({ one }) => ({
  route: one(routes, { fields: [capacityReservations.route_id], references: [routes.id] }),
  schedule: one(schedules, { fields: [capacityReservations.schedule_id], references: [schedules.id] }),
}));

// --- PHASE 4: INTELLIGENT ROUTING ENGINE SCHEMAS ---
export const routingRequests = pgTable('routing_request', {
  id: serial('id').primaryKey(),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  weight: integer('weight').notNull(),
  volume: integer('volume').notNull(),
  product_type: text('product_type').notNull(),
  priority: text('priority').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const routingResults = pgTable('routing_result', {
  id: serial('id').primaryKey(),
  request_id: integer('request_id'),
  recommended_route_code: text('recommended_route_code').notNull(),
  total_transit: integer('total_transit').notNull(),
  estimated_sla_hours: integer('estimated_sla_hours').notNull(),
  available_capacity_kg: integer('available_capacity_kg').notNull(),
  route_score: integer('route_score').notNull(),
  routing_status: text('routing_status').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export const routingRules = pgTable('routing_rule', {
  id: serial('id').primaryKey(),
  rule_name: text('rule_name').notNull(),
  parameter_target: text('parameter_target').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  description: text('description'),
});

export const routingStrategies = pgTable('routing_strategy', {
  id: serial('id').primaryKey(),
  strategy_name: text('strategy_name').notNull(),
  sla_weight: integer('sla_weight').notNull(),
  capacity_weight: integer('capacity_weight').notNull(),
  transit_weight: integer('transit_weight').notNull(),
  performance_weight: integer('performance_weight').notNull(),
  cost_weight: integer('cost_weight').notNull(),
});

export const routingScores = pgTable('routing_score', {
  id: serial('id').primaryKey(),
  result_id: integer('result_id'),
  sla_points: integer('sla_points').notNull(),
  capacity_points: integer('capacity_points').notNull(),
  transit_points: integer('transit_points').notNull(),
  performance_points: integer('performance_points').notNull(),
  cost_points: integer('cost_points').notNull(),
  final_aggregate_score: integer('final_aggregate_score').notNull(),
});

export const routePerformanceHistories = pgTable('route_performance_history', {
  id: serial('id').primaryKey(),
  route_code: text('route_code').notNull(),
  total_runs: integer('total_runs').notNull(),
  on_time_runs: integer('on_time_runs').notNull(),
  delayed_runs: integer('delayed_runs').notNull(),
  avg_delay_minutes: integer('avg_delay_minutes').notNull(),
  sla_achievement_pct: integer('sla_achievement_pct').notNull(),
});

export const routeRecommendationLogs = pgTable('route_recommendation_log', {
  id: serial('id').primaryKey(),
  origin_node_code: text('origin_node_code').notNull(),
  destination_node_code: text('destination_node_code').notNull(),
  selected_route_code: text('selected_route_code').notNull(),
  alternative_applied: text('alternative_applied').notNull(),
  score_applied: integer('score_applied').notNull(),
  trigger_timestamp: timestamp('trigger_timestamp').defaultNow(),
});


