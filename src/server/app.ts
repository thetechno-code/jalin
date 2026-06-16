import express from "express";
import { eq } from "drizzle-orm";
import { db, isDbConfigured } from "../db/index.ts";
import { ensureTablesExist } from "../db/setup.ts";
import { 
  offices, 
  transportNodes, 
  routes, 
  etapes, 
  schedules, 
  capacities, 
  auditRecords, 
  vendors, 
  fleets, 
  users,
  capacityReservations,
  capacityBookings,
  capacityReleases,
  capacityForecasts,
  vehiclePlannings,
  reservationPriorities,
  loadPlannings,
  consolidationRecommendations
} from "../db/schema.ts";
import {
  INITIAL_OFFICES,
  INITIAL_TRANSPORT_NODES,
  INITIAL_ROUTES,
  INITIAL_ETAPES,
  INITIAL_SCHEDULES,
  INITIAL_CAPACITIES,
  INITIAL_AUDIT_LOGS
} from "../data/mockData.ts";

// Set up highly resilient cloud-deployment dual-mode state
let isDbOffline = !isDbConfigured;

export const localStore: any = {
  offices: JSON.parse(JSON.stringify(INITIAL_OFFICES)),
  nodes: JSON.parse(JSON.stringify(INITIAL_TRANSPORT_NODES)),
  routes: JSON.parse(JSON.stringify(INITIAL_ROUTES)),
  etapes: JSON.parse(JSON.stringify(INITIAL_ETAPES)),
  schedules: JSON.parse(JSON.stringify(INITIAL_SCHEDULES)),
  capacities: JSON.parse(JSON.stringify(INITIAL_CAPACITIES)),
  auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
  vendors: [
    { id: 'V001', vendor_name: 'PT Pos Logistik Indonesia', vendor_code: 'POSLOG', vendor_type: 'Internal', contact_person: 'Subhan (0812-XX)', active_contracts: 4, compliance_rate: 98 },
    { id: 'V002', vendor_name: 'PT Kereta Api Logistik', vendor_code: 'KALOG', vendor_type: 'BUMN Partner', contact_person: 'Rian (0811-XX)', active_contracts: 2, compliance_rate: 95 },
    { id: 'V003', vendor_name: 'PT Samudera Indonesia', vendor_code: 'SAMUDERA', vendor_type: 'Charter Vessel', contact_person: 'Capt. Hanafi', active_contracts: 1, compliance_rate: 92 },
    { id: 'V004', vendor_name: 'PT Cardig Air Cargo', vendor_code: 'CARDIG', vendor_type: 'Air Freight', contact_person: 'Siska (0813-XX)', active_contracts: 3, compliance_rate: 99 }
  ],
  fleets: [
    { id: 'F001', vehicle_no: 'B-9021-POS', vehicle_code: 'WBOX', vendor_code: 'POSLOG', capacity_kg: 25000, capacity_m3: 45, status: 'Active', driver_name: 'Asep Kurdi', GPS_tracking_id: 'GPS-9021' },
    { id: 'F002', vehicle_no: 'D-8122-POS', vehicle_code: 'FUSO', vendor_code: 'POSLOG', capacity_kg: 15000, capacity_m3: 32, status: 'Active', driver_name: 'Dadang S', GPS_tracking_id: 'GPS-8122' },
    { id: 'F003', vehicle_no: 'N-9800-POS', vehicle_code: 'CDD', vendor_code: 'POSLOG', capacity_kg: 4000, capacity_m3: 14, status: 'Active', driver_name: 'Cecep', GPS_tracking_id: 'GPS-9800' },
    { id: 'F004', vehicle_no: 'KA-LOG-01', vehicle_code: 'KRETA', vendor_code: 'KALOG', capacity_kg: 300000, capacity_m3: 500, status: 'Active', driver_name: 'Masinis Utama', GPS_tracking_id: 'GPS-KALOG' }
  ],
  users: [
    { id: 1, username: 'admin', password: 'password111', full_name: 'Iwan (Super Admin)', role: 'Super Admin Nasional', office_code: '40000', status: 'Aktif' },
    { id: 2, username: 'medan_admin', password: 'password222', full_name: 'Medan Admin', role: 'Regional Admin', office_code: '20100', status: 'Aktif' },
    { id: 3, username: 'bandung_operator', password: 'password333', full_name: 'Bandung Operator', role: 'Operator Hub', office_code: '40199', status: 'Aktif' }
  ],
  reservations: [],
  bookings: [],
  releases: [],
  forecasts: [],
  vehiclePlannings: [],
  priorities: [],
  loadPlannings: [],
  consolidations: []
};

const app = express();

// Set up standard express body parsing middlewares
app.use(express.json());

// 1. Healthcheck endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 1.5 Database Connection Credentials endpoint (for Super Admin reference)
app.get("/api/db-credentials", (req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"))) {
    try {
      const parsedUrl = new URL(dbUrl.replace(/^postgres(ql)?:\/\//, 'http://'));
      res.json({
        host: parsedUrl.hostname,
        database: parsedUrl.pathname.replace(/^\//, ''),
        username: parsedUrl.username,
        password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : '',
        port: parsedUrl.port || 5432,
        isSupabase: true
      });
      return;
    } catch (e: any) {
      console.error("Failed to parse DATABASE_URL:", e.message);
    }
  }

  res.json({
    host: process.env.SQL_HOST || "localhost",
    database: process.env.SQL_DB_NAME || "postgres",
    username: process.env.SQL_USER || "postgres",
    password: process.env.SQL_PASSWORD || "",
    port: 5432,
    isSupabase: false
  });
});

// 2. Fetch full logistics dataset on startup/refresh (including internal users)
app.get("/api/data", async (req, res) => {
  if (isDbOffline && isDbConfigured) {
    try {
      console.log("[HEAL-RECOVERY] Auto-initialisation check: Executing schema self-healing DDL on Supabase/PostgreSQL...");
      await ensureTablesExist();
      isDbOffline = false;
      console.log("[HEAL-RECOVERY] Database successfully ready, entering ONLINE mode!");
    } catch (err: any) {
      console.error("[HEAL-RECOVERY] Database auto-initialisation failed, staying offline:", err.message);
    }
  }

  if (isDbOffline) {
    console.log("[HEAL-RECOVERY] Serving /api/data from local in-memory store.");
    return res.json(localStore);
  }
  try {
    const allOffices = await db.select().from(offices);
    const allNodes = await db.select().from(transportNodes);
    const allRoutes = await db.select().from(routes);
    const allEtapes = await db.select().from(etapes);
    const allSchedules = await db.select().from(schedules);
    const allCapacities = await db.select().from(capacities);
    const allAuditRecords = await db.select().from(auditRecords);
    const allVendors = await db.select().from(vendors);
    const allFleets = await db.select().from(fleets);
    const allUsers = await db.select().from(users);

    // Safeguard calls for Phase 3 tables so they don't break if tables are not fully migrated
    let allReservations: any[] = [];
    let allBookings: any[] = [];
    let allReleases: any[] = [];
    let allForecasts: any[] = [];
    let allPlannings: any[] = [];
    let allPriorities: any[] = [];
    let allLoadPlannings: any[] = [];
    let allConsolidations: any[] = [];

    try { allReservations = await db.select().from(capacityReservations); } catch (e) { console.warn("capacityReservations table not fully migrated yet."); }
    try { allBookings = await db.select().from(capacityBookings); } catch (e) { console.warn("capacityBookings table not fully migrated yet."); }
    try { allReleases = await db.select().from(capacityReleases); } catch (e) { console.warn("capacityReleases table not fully migrated yet."); }
    try { allForecasts = await db.select().from(capacityForecasts); } catch (e) { console.warn("capacityForecasts table not fully migrated yet."); }
    try { allPlannings = await db.select().from(vehiclePlannings); } catch (e) { console.warn("vehiclePlannings table not fully migrated yet."); }
    try { allPriorities = await db.select().from(reservationPriorities); } catch (e) { console.warn("reservationPriorities table not fully migrated yet."); }
    try { allLoadPlannings = await db.select().from(loadPlannings); } catch (e) { console.warn("loadPlannings table not fully migrated yet."); }
    try { allConsolidations = await db.select().from(consolidationRecommendations); } catch (e) { console.warn("consolidationRecommendations table not fully migrated yet."); }

    // Sync database data to localStore to keep it warm if DB starts working
    localStore.offices = allOffices;
    localStore.nodes = allNodes;
    localStore.routes = allRoutes;
    localStore.etapes = allEtapes;
    localStore.schedules = allSchedules;
    localStore.capacities = allCapacities;
    localStore.auditLogs = allAuditRecords;
    localStore.vendors = allVendors;
    localStore.fleets = allFleets;
    localStore.users = allUsers;
    localStore.reservations = allReservations;
    localStore.bookings = allBookings;
    localStore.releases = allReleases;
    localStore.forecasts = allForecasts;
    localStore.vehiclePlannings = allPlannings;
    localStore.priorities = allPriorities;
    localStore.loadPlannings = allLoadPlannings;
    localStore.consolidations = allConsolidations;

    res.json(localStore);
  } catch (error: any) {
    console.error("Failed to fetch logistics data from SQL, failing over to local in-memory store...", error);
    isDbOffline = true; // Engage memory mode so successive requests are instant
    res.json(localStore);
  }
});

// 2.1 authentication login route (Local Custom Credentials)
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password wajib diisi." });
  }

  if (isDbOffline) {
    console.log("[HEAL-RECOVERY] Authenticating via local in-memory store.");
    const user = localStore.users.find((u: any) => u.username === username);
    if (!user) {
      return res.status(401).json({ error: "Username tidak terdaftar dalam sistem (Offline Mode)." });
    }
    if (user.password !== password) {
      return res.status(401).json({ error: "Password salah (Offline Mode)." });
    }
    if (user.status !== 'Aktif') {
      return res.status(403).json({ error: "Akun Anda dinonaktifkan oleh Administrator nasional (Offline Mode)." });
    }
    return res.json({ success: true, user });
  }

  try {
    const userList = await db.select().from(users).where(eq(users.username, username));
    if (userList.length === 0) {
      return res.status(401).json({ error: "Username tidak terdaftar dalam sistem." });
    }
    const user = userList[0];
    if (user.password !== password) {
      return res.status(401).json({ error: "Password salah." });
    }
    if (user.status !== 'Aktif') {
      return res.status(403).json({ error: "Akun Anda dinonaktifkan oleh Administrator nasional." });
    }
    res.json({ success: true, user });
  } catch (e: any) {
    console.error("Login endpoint failed, failing over to local in-memory store...", e);
    isDbOffline = true; // Engage memory mode
    const user = localStore.users.find((u: any) => u.username === username);
    if (!user) {
      return res.status(401).json({ error: "Username tidak terdaftar dalam sistem (Offline Mode Fallback)." });
    }
    if (user.password !== password) {
      return res.status(401).json({ error: "Password salah (Offline Mode Fallback)." });
    }
    if (user.status !== 'Aktif') {
      return res.status(403).json({ error: "Akun Anda dinonaktifkan oleh Administrator nasional (Offline Mode Fallback)." });
    }
    res.json({ success: true, user });
  }
});

// 2.2 CRUD routes for internal user accounts
app.post("/api/users", async (req, res) => {
  try {
    const { id, username, password, full_name, role, office_code, status, auditLog } = req.body;
    
    await db.transaction(async (tx) => {
      if (id) {
        // Update
        await tx.update(users).set({
          username,
          password,
          full_name,
          role,
          office_code,
          status
        }).where(eq(users.id, id));
      } else {
        // Insert
        await tx.insert(users).values({
          username,
          password,
          full_name,
          role,
          office_code,
          status
        });
      }

      if (auditLog) {
        await tx.insert(auditRecords).values({
          id: auditLog.id,
          created_at: auditLog.created_at,
          created_by: auditLog.created_by,
          action_description: auditLog.action_description
        });
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to manage user:", error);
    res.status(500).json({ error: error.message || "Gagal menyimpan akun user ke database." });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { auditLog } = req.body;

    await db.transaction(async (tx) => {
      await tx.delete(users).where(eq(users.id, userId));

      if (auditLog) {
        await tx.insert(auditRecords).values({
          id: auditLog.id,
          created_at: auditLog.created_at,
          created_by: auditLog.created_by,
          action_description: auditLog.action_description
        });
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    res.status(500).json({ error: "Gagal menghapus user dari database: " + (error?.message || String(error)) });
  }
});

// 3. Register a new Office
app.post("/api/offices", async (req, res) => {
  try {
    const { office_code, office_name, office_type, region_code, auditLog } = req.body;
    
    await db.transaction(async (tx) => {
      await tx.insert(offices).values({
        office_code,
        office_name,
        office_type,
        region_code
      }).onConflictDoNothing();

      if (auditLog) {
        await tx.insert(auditRecords).values({
          id: auditLog.id,
          created_at: auditLog.created_at,
          created_by: auditLog.created_by,
          action_description: auditLog.action_description
        });
      }
    });

    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error("Failed to create office:", error);
    res.status(500).json({ error: "Gagal menyimpan Kantor Pos baru ke database Supabase: " + (error?.message || String(error)) });
  }
});

// 4. Toggle/Update transport nodes configuration
app.post("/api/transport-nodes/toggle", async (req, res) => {
  try {
    const { 
      office_code, 
      is_transport_node, 
      node_category, 
      parent_node_code, 
      service_area, 
      geographic_center, 
      office_name, 
      office_type, 
      region_code, 
      auditLog 
    } = req.body;
    
    await db.transaction(async (tx) => {
      // 4.1 Ensure the office exists in the offices table to prevent foreign key reference violation
      if (office_name) {
        await tx.insert(offices).values({
          office_code,
          office_name,
          office_type: office_type || 'KC',
          region_code: region_code || 'REG-03'
        }).onConflictDoUpdate({
          target: offices.office_code,
          set: {
            office_name,
            office_type: office_type || 'KC',
            region_code: region_code || 'REG-03'
          }
        });
      } else {
        // Fallback placeholder insertion if office details weren't explicitly supplied in payload
        const existingOfficeList = await tx.select().from(offices).where(eq(offices.office_code, office_code)).limit(1);
        if (existingOfficeList.length === 0) {
          await tx.insert(offices).values({
            office_code,
            office_name: `KANTOR POS UNREGISTERED (${office_code})`,
            office_type: 'HUB',
            region_code: 'REG-03'
          });
        }
      }

      // 4.2 Upsert/update the transport node status
      await tx.insert(transportNodes).values({
        office_code,
        is_transport_node,
        node_category,
        parent_node_code: parent_node_code || null,
        service_area,
        geographic_center
      }).onConflictDoUpdate({
        target: transportNodes.office_code,
        set: {
          is_transport_node,
          node_category,
          parent_node_code: parent_node_code || null,
          service_area,
          geographic_center
        }
      });

      if (auditLog) {
        await tx.insert(auditRecords).values({
          id: auditLog.id,
          created_at: auditLog.created_at,
          created_by: auditLog.created_by,
          action_description: auditLog.action_description
        });
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to toggle/update transport node:", error);
    res.status(500).json({ error: "Gagal mengubah status hub transportasi di database: " + (error?.message || String(error)) });
  }
});

// 5. Save a new Route complete bundle (Transactionally inserts route, etapes, schedules, default capacities, and logs)
app.post("/api/routes", async (req, res) => {
  try {
    const { route, etapes: etapeList, schedule, capacity, auditLog } = req.body;
    
    await db.transaction(async (tx) => {
      // A. Route master insertion
      await tx.insert(routes).values({
        id: route.id,
        route_code: route.route_code,
        route_name: route.route_name,
        route_category: route.route_category,
        transport_mode: route.transport_mode,
        origin_node: route.origin_node,
        destination_node: route.destination_node,
        effective_date: route.effective_date,
        expired_date: route.expired_date,
        status: route.status,
        capacity_kg: route.capacity_kg ?? 0,
        price_per_kg: route.price_per_kg ?? 0
      }).onConflictDoUpdate({
        target: routes.id,
        set: {
          route_code: route.route_code,
          route_name: route.route_name,
          route_category: route.route_category,
          transport_mode: route.transport_mode,
          effective_date: route.effective_date,
          expired_date: route.expired_date,
          status: route.status,
          capacity_kg: route.capacity_kg ?? 0,
          price_per_kg: route.price_per_kg ?? 0
        }
      });

      // B. Transit etape list insertion
      if (etapeList && etapeList.length > 0) {
        await tx.delete(etapes).where(eq(etapes.route_id, route.id));
        await tx.insert(etapes).values(etapeList);
      }

      // C. Journey schedules insertion
      if (schedule) {
        await tx.delete(schedules).where(eq(schedules.route_id, route.id));
        await tx.insert(schedules).values(schedule);
      }

      // D. Cargo capacity matrices insertion
      if (capacity) {
        await tx.delete(capacities).where(eq(capacities.route_id, route.id));
        await tx.insert(capacities).values(capacity);
      }

      // E. Audit log insertion
      if (auditLog) {
        await tx.insert(auditRecords).values({
          id: auditLog.id,
          created_at: auditLog.created_at,
          created_by: auditLog.created_by,
          action_description: auditLog.action_description
        });
      }
    });

    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error("Failed to save route bundle:", error);
    res.status(500).json({ error: "Gagal menyimpan rute ke database Supabase: " + (error?.message || String(error)) });
  }
});

// 6. Bulk Import routes, schedules, and capacities
app.post("/api/routes/import-bulk", async (req, res) => {
  try {
    const { routes: routeList, etapes: etapeList, schedules: scheduleList, capacities: capacityList, auditLog } = req.body;

    await db.transaction(async (tx) => {
      if (routeList && routeList.length > 0) {
        for (const r of routeList) {
          await tx.insert(routes).values(r).onConflictDoNothing();
        }
      }
      if (etapeList && etapeList.length > 0) {
        for (const e of etapeList) {
          await tx.insert(etapes).values(e).onConflictDoNothing();
        }
      }
      if (scheduleList && scheduleList.length > 0) {
        for (const s of scheduleList) {
          await tx.insert(schedules).values(s).onConflictDoNothing();
        }
      }
      if (capacityList && capacityList.length > 0) {
        for (const c of capacityList) {
          await tx.insert(capacities).values(c).onConflictDoNothing();
        }
      }
      if (auditLog) {
        await tx.insert(auditRecords).values(auditLog);
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Bulk import failed:", error);
    res.status(500).json({ error: "Gagal transaksi massal import rute Excel/CSV ke database: " + (error?.message || String(error)) });
  }
});

// 7. Patch route workflow status change
app.patch("/api/routes/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { nextStatus, auditLog } = req.body;

    await db.transaction(async (tx) => {
      await tx.update(routes).set({ status: nextStatus }).where(eq(routes.id, id));
      if (auditLog) {
        await tx.insert(auditRecords).values({
          id: auditLog.id,
          created_at: auditLog.created_at,
          created_by: auditLog.created_by,
          action_description: auditLog.action_description
        });
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to update status:", error);
    res.status(500).json({ error: "Gagal menyimpan perubahan status persetujuan rute ke database: " + (error?.message || String(error)) });
  }
});

// 8. Allocate cargo vehicle capacity for a route
app.post("/api/capacities", async (req, res) => {
  try {
    const capData = req.body;
    const result = await db.insert(capacities).values({
      id: capData.id,
      route_id: capData.route_id,
      vehicle_code: capData.vehicle_code,
      max_weight: capData.max_weight,
      max_volume: capData.max_volume,
      reserved_capacity: capData.reserved_capacity,
      available_capacity: capData.available_capacity
    }).onConflictDoNothing().returning();

    res.status(201).json({ success: true, data: result[0] });
  } catch (error: any) {
    console.error("Failed to allocate capacity:", error);
    res.status(500).json({ error: "Gagal menyimpan alokasi kapasitas armada ke database: " + (error?.message || String(error)) });
  }
});

app.delete("/api/capacities/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(capacities).where(eq(capacities.id, id));
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete capacity:", error);
    res.status(500).json({ error: "Gagal menghapus alokasi kapasitas armada dari database: " + (error?.message || String(error)) });
  }
});

// 9. Save/Update Vendor
app.post("/api/vendors", async (req, res) => {
  try {
    const { vendor, auditLog } = req.body;
    await db.transaction(async (tx) => {
      await tx.insert(vendors).values(vendor).onConflictDoUpdate({
        target: vendors.id,
        set: {
          vendor_code: vendor.vendor_code,
          vendor_name: vendor.vendor_name,
          vendor_type: vendor.vendor_type,
          contact_person: vendor.contact_person,
          contact_phone: vendor.contact_phone,
          contact_email: vendor.contact_email,
          status: vendor.status,
          rating: vendor.rating
        }
      });

      if (auditLog) {
        await tx.insert(auditRecords).values({
          id: auditLog.id,
          created_at: auditLog.created_at,
          created_by: auditLog.created_by,
          action_description: auditLog.action_description
        });
      }
    });
    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error("Failed to save vendor:", error);
    res.status(500).json({ error: "Gagal menyimpan mitra vendor ke database Supabase: " + (error?.message || String(error)) });
  }
});

// 10. Delete Vendor
app.delete("/api/vendors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { auditLog } = req.body || {};
    await db.transaction(async (tx) => {
      await tx.delete(vendors).where(eq(vendors.id, id));
      if (auditLog) {
        await tx.insert(auditRecords).values({
          id: auditLog.id,
          created_at: auditLog.created_at,
          created_by: auditLog.created_by,
          action_description: auditLog.action_description
        });
      }
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete vendor:", error);
    res.status(500).json({ error: "Gagal menghapus mitra vendor di database Supabase: " + (error?.message || String(error)) });
  }
});

// 11. Save/Update Fleet Armada
app.post("/api/fleets", async (req, res) => {
  try {
    const { fleet, auditLog } = req.body;
    await db.transaction(async (tx) => {
      await tx.insert(fleets).values(fleet).onConflictDoUpdate({
        target: fleets.id,
        set: {
          license_plate: fleet.license_plate,
          vehicle_name: fleet.vehicle_name,
          vehicle_mode: fleet.vehicle_mode,
          max_weight: fleet.max_weight,
          max_volume: fleet.max_volume,
          vendor_id: fleet.vendor_id,
          status: fleet.status
        }
      });

      if (auditLog) {
        await tx.insert(auditRecords).values({
          id: auditLog.id,
          created_at: auditLog.created_at,
          created_by: auditLog.created_by,
          action_description: auditLog.action_description
        });
      }
    });
    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error("Failed to save fleet vehicle:", error);
    res.status(500).json({ error: "Gagal menyimpan unit armada kendaraan ke database Supabase: " + (error?.message || String(error)) });
  }
});

// 12. Delete Fleet Vehicle
app.delete("/api/fleets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { auditLog } = req.body || {};
    await db.transaction(async (tx) => {
      await tx.delete(fleets).where(eq(fleets.id, id));
      if (auditLog) {
        await tx.insert(auditRecords).values({
          id: auditLog.id,
          created_at: auditLog.created_at,
          created_by: auditLog.created_by,
          action_description: auditLog.action_description
        });
      }
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete vehicle:", error);
    res.status(500).json({ error: "Gagal menghapus armada dari database Supabase: " + (error?.message || String(error)) });
  }
});

// --- PHASE 3: CAPACITY RESERVATION & PLANNING INTEGRATED ENDPOINTS ---

// 12.1 Create Capacity Reservation
app.post("/api/reservations", async (req, res) => {
  try {
    const { 
      reservation_code, 
      route_id, 
      schedule_id, 
      reserved_weight, 
      reserved_volume, 
      priority, 
      status, 
      allocation_strategy, 
      created_by, 
      notes,
      auditLog 
    } = req.body;
    
    let dbResult: any = null;
    let fallbackId = Math.floor(Math.random() * 10000);

    try {
      const inserted = await db.insert(capacityReservations).values({
        reservation_code,
        route_id,
        schedule_id,
        reserved_weight: parseInt(String(reserved_weight || 0)),
        reserved_volume: parseInt(String(reserved_volume || 0)),
        priority: priority || 'Express',
        status: status || 'Reserved',
        allocation_strategy: allocation_strategy || 'First Come First Serve',
        created_by: created_by || 'Planner',
        notes: notes || ''
      }).returning();
      dbResult = inserted[0];

      if (dbResult && dbResult.id) {
        // Automatically create a Booking entry
        await db.insert(capacityBookings).values({
          reservation_id: dbResult.id,
          slot_code: `SLOT-${reservation_code}`,
          occupancy_percentage: Math.min(100, Math.round((parseInt(String(reserved_weight || 0)) / 4000) * 100))
        });
      }
    } catch (dbErr) {
      console.warn("Database save failed for reservation. Proceeding with simulated object:", dbErr);
    }

    // Insert an audit log if provided
    if (auditLog) {
      try {
        await db.insert(auditRecords).values({
          id: auditLog.id || `AUDIT-${Date.now()}`,
          created_at: auditLog.created_at || new Date().toISOString(),
          created_by: auditLog.created_by || 'System',
          action_description: auditLog.action_description
        });
      } catch (ae) {}
    }

    res.status(201).json({ 
      success: true, 
      data: dbResult || {
        id: fallbackId,
        reservation_code,
        route_id,
        schedule_id,
        reserved_weight,
        reserved_volume,
        priority,
        status: status || 'Reserved',
        allocation_strategy,
        created_by,
        created_at: new Date().toISOString(),
        notes
      }
    });
  } catch (error: any) {
    console.error("Failed to create reservation:", error);
    res.status(500).json({ error: "Gagal menyimpan reservasi kapasitas: " + error.message });
  }
});

// 12.2 Update Capacity Reservation Status
app.patch("/api/reservations/:id/status", async (req, res) => {
  try {
    const resId = parseInt(req.params.id);
    const { status, released_by, released_weight, released_volume, auditLog } = req.body;

    let updatedRows: any[] = [];
    try {
      updatedRows = await db.update(capacityReservations)
        .set({ status })
        .where(eq(capacityReservations.id, resId))
        .returning();

      // If status is Cancelled, Released, or Completed, insert a release log
      if (['Cancelled', 'Released', 'Released Capacity'].includes(status)) {
        await db.insert(capacityReleases).values({
          reservation_id: resId,
          released_weight: parseInt(String(released_weight || 0)),
          released_volume: parseInt(String(released_volume || 0)),
          released_by: released_by || 'Planner'
        });
      }
    } catch (e) {
      console.warn("Database status patch error. Safe fallback simulated.", e);
    }

    if (auditLog) {
      try {
        await db.insert(auditRecords).values({
          id: auditLog.id,
          created_at: auditLog.created_at,
          created_by: auditLog.created_by,
          action_description: auditLog.action_description
        });
      } catch (ae) {}
    }

    res.json({ success: true, data: updatedRows[0] || { id: resId, status } });
  } catch (error: any) {
    console.error("Failed to patch reservation status:", error);
    res.status(500).json({ error: "Gagal mengubah status reservasi: " + error.message });
  }
});

// 12.3 Create Capacity Forecast Record
app.post("/api/forecasts", async (req, res) => {
  try {
    const { route_id, forecast_period, predicted_volume_kg, current_capacity_kg, capacity_gap_kg } = req.body;
    let dbResult: any = null;

    try {
      const inserted = await db.insert(capacityForecasts).values({
        route_id,
        forecast_period,
        predicted_volume_kg: parseInt(String(predicted_volume_kg || 0)),
        current_capacity_kg: parseInt(String(current_capacity_kg || 0)),
        capacity_gap_kg: parseInt(String(capacity_gap_kg || 0))
      }).returning();
      dbResult = inserted[0];
    } catch (e) {
      console.warn("Database insert failed for forecasts. Fallback loaded.");
    }

    res.status(201).json({
      success: true,
      data: dbResult || {
        id: Math.floor(Math.random() * 10000),
        route_id,
        forecast_period,
        predicted_volume_kg,
        current_capacity_kg,
        capacity_gap_kg,
        created_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 12.4 Create Vehicle Planning Entry
app.post("/api/vehicle-planning", async (req, res) => {
  try {
    const { route_id, forecast_volume_kg, vehicle_capacity_kg, required_vehicle_count, vehicle_type_recommended } = req.body;
    let dbResult: any = null;

    try {
      const inserted = await db.insert(vehiclePlannings).values({
        route_id,
        forecast_volume_kg: parseInt(String(forecast_volume_kg || 0)),
        vehicle_capacity_kg: parseInt(String(vehicle_capacity_kg || 0)),
        required_vehicle_count: parseInt(String(required_vehicle_count || 0)),
        vehicle_type_recommended: vehicle_type_recommended || 'CDD'
      }).returning();
      dbResult = inserted[0];
    } catch (e) {
      console.warn("Database insert failed for vehicle plannings.");
    }

    res.status(201).json({
      success: true,
      data: dbResult || {
        id: Math.floor(Math.random() * 10000),
        route_id,
        forecast_volume_kg,
        vehicle_capacity_kg,
        required_vehicle_count,
        vehicle_type_recommended,
        created_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 12.5 Create Load Planning Option
app.post("/api/load-planning", async (req, res) => {
  try {
    const { route_id, total_shipment_weight_kg, recommended_vehicle_layout, overall_utilization_pct } = req.body;
    let dbResult: any = null;

    try {
      const inserted = await db.insert(loadPlannings).values({
        route_id,
        total_shipment_weight_kg: parseInt(String(total_shipment_weight_kg || 0)),
        recommended_vehicle_layout,
        overall_utilization_pct: parseInt(String(overall_utilization_pct || 0))
      }).returning();
      dbResult = inserted[0];
    } catch (e) {
      console.warn("Database insert failed for load planning.");
    }

    res.status(201).json({
      success: true,
      data: dbResult || {
        id: Math.floor(Math.random() * 10000),
        route_id,
        total_shipment_weight_kg,
        recommended_vehicle_layout,
        overall_utilization_pct,
        created_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 12.6 Create Consolidation Recommendation
app.post("/api/consolidations", async (req, res) => {
  try {
    const { route_id, manifests_grouped, destination_node_code, schedule_time, total_weight_kg, action_recommended } = req.body;
    let dbResult: any = null;

    try {
      const inserted = await db.insert(consolidationRecommendations).values({
        route_id,
        manifests_grouped,
        destination_node_code,
        schedule_time,
        total_weight_kg: parseInt(String(total_weight_kg || 0)),
        action_recommended: action_recommended || 'Merge into one transport execution',
        status: 'Pending'
      }).returning();
      dbResult = inserted[0];
    } catch (e) {
      console.warn("Database insert failed for consolidation recommendation.");
    }

    res.status(201).json({
      success: true,
      data: dbResult || {
        id: Math.floor(Math.random() * 10000),
        route_id,
        manifests_grouped,
        destination_node_code,
        schedule_time,
        total_weight_kg,
        action_recommended,
        status: 'Pending',
        created_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 12.7 Update Consolidation Status
app.patch("/api/consolidations/:id", async (req, res) => {
  try {
    const conId = parseInt(req.params.id);
    const { status } = req.body;
    let dbResult: any = null;

    try {
      const updated = await db.update(consolidationRecommendations)
        .set({ status })
        .where(eq(consolidationRecommendations.id, conId))
        .returning();
      dbResult = updated[0];
    } catch (e) {
      console.warn("Database status patch index missing for consolidation.");
    }

    res.json({ success: true, data: dbResult || { id: conId, status } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 13. WIPE & RESET ENTIRE SYSTEM DATABASE (Clean State Simulator helper)
app.post("/api/reset-database", async (req, res) => {
  try {
    // Ensure table structure is present first before deletion
    await ensureTablesExist();

    await db.transaction(async (tx) => {
      // Cascade or sequential delete to respect foreign key constraints
      await tx.delete(etapes);
      await tx.delete(schedules);
      await tx.delete(capacities);
      await tx.delete(routes);
      await tx.delete(transportNodes);
      await tx.delete(fleets);
      await tx.delete(offices);
      await tx.delete(vendors);
      await tx.delete(auditRecords);
      await tx.delete(users);

      // Re-inject the 3 default multi-role testing logins so we are never locked out
      await tx.insert(users).values([
        {
          username: 'admin',
          password: 'password111',
          full_name: 'Iwan (Super Admin)',
          role: 'Super Admin Nasional',
          office_code: '40000',
          status: 'Aktif'
        },
        {
          username: 'medan_admin',
          password: 'password222',
          full_name: 'Medan Admin',
          role: 'Regional Admin',
          office_code: '20100',
          status: 'Aktif'
        },
        {
          username: 'bandung_operator',
          password: 'password333',
          full_name: 'Bandung Operator',
          role: 'Operator Hub',
          office_code: '40199',
          status: 'Aktif'
        }
      ]);

      // Audit Record trace for new master setup
      await tx.insert(auditRecords).values({
        id: `RESET-${Date.now()}`,
        created_at: new Date().toISOString(),
        created_by: 'System',
        action_description: 'Seluruh database master diriset dan dibersihkan untuk simulasi data riil baru.'
      });
    });

    res.json({ success: true, message: "Seluruh database berhasil dibersihkan! Anda memulai kembali dari nol." });
  } catch (error: any) {
    console.error("Failed to clear and reset system database:", error);
    res.status(500).json({ error: "Gagal mengosongkan database PostgreSQL: " + error.message });
  }
});

// 14. SEED DATABASE WITH EXHAUSTIVE INITIAL POS INDONESIA DATA
app.post("/api/seed-database", async (req, res) => {
  try {
    // Ensure all tables are created in Supabase/PostgreSQL first
    await ensureTablesExist();

    await db.transaction(async (tx) => {
      // Clean up existing data to avoid conflict
      await tx.delete(etapes);
      await tx.delete(schedules);
      await tx.delete(capacities);
      await tx.delete(routes);
      await tx.delete(transportNodes);
      await tx.delete(fleets);
      await tx.delete(offices);
      await tx.delete(vendors);
      await tx.delete(auditRecords);
      await tx.delete(users);

      // A. Populate Offices
      const seedOffices = [
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
      await tx.insert(offices).values(seedOffices);

      // B. Populate Transport Nodes
      const seedNodes = [
        { office_code: '10000', is_transport_node: true, node_category: 'National Hub', parent_node_code: null, service_area: 'DKI Jakarta dan sekitarnya', geographic_center: { lat: -6.2088, lng: 106.8456 } },
        { office_code: '40000', is_transport_node: true, node_category: 'Regional Hub', parent_node_code: '10000', service_area: 'Jawa Barat bagian barat (Priangan)', geographic_center: { lat: -6.9175, lng: 107.6191 } },
        { office_code: '50000', is_transport_node: true, node_category: 'Regional Hub', parent_node_code: '10000', service_area: 'Jawa Tengah bagian Utara dan Selatan', geographic_center: { lat: -6.9667, lng: 110.4167 } },
        { office_code: '60000', is_transport_node: true, node_category: 'Regional Hub', parent_node_code: '10000', service_area: 'Jawa Timur dan Indonesia Timur', geographic_center: { lat: -7.2575, lng: 112.7521 } },
        { office_code: '20100', is_transport_node: true, node_category: 'Gateway', parent_node_code: null, service_area: 'Sumatera Bagian Utara', geographic_center: { lat: 3.5952, lng: 98.6722 } },
        { office_code: '30000', is_transport_node: true, node_category: 'Regional Hub', parent_node_code: '10000', service_area: 'Sumatera Selatan dan Lampung', geographic_center: { lat: -2.9761, lng: 104.7754 } },
        { office_code: '70000', is_transport_node: true, node_category: 'Regional Hub', parent_node_code: '10000', service_area: 'Kalimantan Timur dan Utara', geographic_center: { lat: -1.2654, lng: 116.8903 } },
        { office_code: '90000', is_transport_node: true, node_category: 'Gateway', parent_node_code: null, service_area: 'Sulawesi Selatan, Barat dan Tengah', geographic_center: { lat: -5.1477, lng: 119.4327 } },
        { office_code: '99000', is_transport_node: true, node_category: 'Processing Center', parent_node_code: null, service_area: 'Provinsi Papua dan Papua Barat', geographic_center: { lat: -2.5488, lng: 140.7178 } },
        { office_code: '45100', is_transport_node: true, node_category: 'Local Hub', parent_node_code: '40000', service_area: 'Cirebon, Kuningan, Majalengka, Indramayu', geographic_center: { lat: -6.7216, lng: 108.5539 } },
        { office_code: '19000', is_transport_node: true, node_category: 'Gateway', parent_node_code: '10000', service_area: 'Cargo Internasional Bandara Soekarno-Hatta', geographic_center: { lat: -6.1256, lng: 106.6558 } }
      ];
      await tx.insert(transportNodes).values(seedNodes);

      // C. Populate Vendors
      const seedVendors = [
        { id: 'V001', vendor_code: 'VND-POSLOG', vendor_name: 'PT POS LOGISTIK INDONESIA', vendor_type: 'BUMN', contact_person: 'Budi Santoso', contact_phone: '081122334455', contact_email: 'budi.s@poslogistik.co.id', status: 'Aktif', rating: 5 },
        { id: 'V002', vendor_code: 'VND-GCARGO', vendor_name: 'PT GARUDA INDONESIA CARGO', vendor_type: 'BUMN', contact_person: 'Siti Rahma', contact_phone: '081234567890', contact_email: 'siti.r@garudacargo.co.id', status: 'Aktif', rating: 5 },
        { id: 'V003', vendor_code: 'VND-PELNI', vendor_name: 'PT PELAYANAN NASIONAL INDONESIA', vendor_type: 'BUMN', contact_person: 'Agus Salim', contact_phone: '081398765432', contact_email: 'agus.s@pelni.co.id', status: 'Aktif', rating: 4 },
        { id: 'V004', vendor_code: 'VND-SWA-INDOC', vendor_name: 'PT INDOCARGO NUSA UTAMA', vendor_type: 'Swasta', contact_person: 'Hendra Wijaya', contact_phone: '085711223344', contact_email: 'hendra@indocargo.com', status: 'Aktif', rating: 4 }
      ];
      await tx.insert(vendors).values(seedVendors);

      // D. Populate Fleets
      const seedFleets = [
        { id: 'F001', license_plate: 'B-9001-POS', vehicle_name: 'Hino Wingbox Heavy Truck', vehicle_mode: 'Darat', max_weight: 18000, max_volume: 45, vendor_id: 'V001', status: 'Tersedia' },
        { id: 'F002', license_plate: 'B-9543-POS', vehicle_name: 'Fuso Box Medium Truck', vehicle_mode: 'Darat', max_weight: 8000, max_volume: 24, vendor_id: 'V001', status: 'Tersedia' },
        { id: 'F003', license_plate: 'PK-GIA-737', vehicle_name: 'Boeing 737-800F Cargo Jet', vehicle_mode: 'Udara', max_weight: 22000, max_volume: 120, vendor_id: 'V002', status: 'Tersedia' },
        { id: 'F004', license_plate: 'KM-DOBONSOLO', vehicle_name: 'MV DOBONSOLO Express Vessel', vehicle_mode: 'Laut', max_weight: 500000, max_volume: 1800, vendor_id: 'V003', status: 'Tersedia' }
      ];
      await tx.insert(fleets).values(seedFleets);

      // E. Populate Routes
      const seedRoutes = [
        { id: 'R001', route_code: 'RT-001', route_name: 'LINTAS JAWA UTARA STANDARD', route_category: 'Primer', transport_mode: 'Darat', origin_node: '10000', destination_node: '60000', effective_date: '2026-01-01', expired_date: '2026-12-31', status: 'Published', capacity_kg: 25000, price_per_kg: 3500 },
        { id: 'R002', route_code: 'RT-002', route_name: 'PRIANGAN BARAT LOGISTICS', route_category: 'Sekunder', transport_mode: 'Darat', origin_node: '10000', destination_node: '40000', effective_date: '2026-03-01', expired_date: '2027-03-01', status: 'Reviewed', capacity_kg: 15000, price_per_kg: 2000 },
        { id: 'R003', route_code: 'RT-003', route_name: 'INTER-GATEWAY CARGO CORRIDOR', route_category: 'Primer', transport_mode: 'Udara', origin_node: '19000', destination_node: '90000', effective_date: '2026-01-15', expired_date: '2027-01-15', status: 'Published', capacity_kg: 21000, price_per_kg: 18000 },
        { id: 'R004', route_code: 'RT-004', route_name: 'SUMATERA TRANSIT BACKBONE', route_category: 'Primer', transport_mode: 'Darat', origin_node: '10000', destination_node: '20100', effective_date: '2026-02-01', expired_date: '2026-12-31', status: 'Submitted', capacity_kg: 18000, price_per_kg: 7500 },
        { id: 'R005', route_code: 'RT-005', route_name: 'PACIFIC SEABOARD MARITIME', route_category: 'Tertier', transport_mode: 'Laut', origin_node: '60000', destination_node: '99000', effective_date: '2026-05-01', expired_date: '2027-05-01', status: 'Draft', capacity_kg: 500000, price_per_kg: 4500 }
      ];
      await tx.insert(routes).values(seedRoutes);

      // F. Populate Etapes (Transit schedule stops)
      const seedEtapes = [
        { id: 'E001', route_id: 'R001', sequence_no: 1, transport_node_code: '10000', estimated_arrival: 'Start', estimated_departure: '08:00' },
        { id: 'E002', route_id: 'R001', sequence_no: 2, transport_node_code: '45100', estimated_arrival: '12:00', estimated_departure: '13:00' },
        { id: 'E033', route_id: 'R001', sequence_no: 3, transport_node_code: '50000', estimated_arrival: '18:00', estimated_departure: '19:00' },
        { id: 'E004', route_id: 'R001', sequence_no: 4, transport_node_code: '60000', estimated_arrival: '23:30', estimated_departure: 'End' },

        { id: 'E005', route_id: 'R002', sequence_no: 1, transport_node_code: '10000', estimated_arrival: 'Start', estimated_departure: '09:00' },
        { id: 'E006', route_id: 'R002', sequence_no: 2, transport_node_code: '40000', estimated_arrival: '12:30', estimated_departure: 'End' },

        { id: 'E007', route_id: 'R003', sequence_no: 1, transport_node_code: '19000', estimated_arrival: 'Start', estimated_departure: '14:00' },
        { id: 'E008', route_id: 'R003', sequence_no: 2, transport_node_code: '90000', estimated_arrival: '17:30', estimated_departure: 'End' },

        { id: 'E009', route_id: 'R004', sequence_no: 1, transport_node_code: '10000', estimated_arrival: 'Start', estimated_departure: '06:00' },
        { id: 'E010', route_id: 'R004', sequence_no: 2, transport_node_code: '30000', estimated_arrival: '18:00', estimated_departure: '19:00' },
        { id: 'E011', route_id: 'R004', sequence_no: 3, transport_node_code: '20100', estimated_arrival: '+1d 15:00', estimated_departure: 'End' },

        { id: 'E012', route_id: 'R005', sequence_no: 1, transport_node_code: '60000', estimated_arrival: 'Start', estimated_departure: '12:00' },
        { id: 'E013', route_id: 'R005', sequence_no: 2, transport_node_code: '99000', estimated_arrival: '+4d 10:00', estimated_departure: 'End' }
      ];
      await tx.insert(etapes).values(seedEtapes);

      // G. Populate Schedules
      const seedSchedules = [
        { id: 'S001', route_id: 'R001', departure_time: '08:00', arrival_time: '23:30', frequency: 'Daily', operating_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'], effective_date: '2026-01-01', expired_date: '2026-12-31' },
        { id: 'S002', route_id: 'R002', departure_time: '09:00', arrival_time: '12:30', frequency: 'Weekly', operating_days: ['Senin', 'Rabu', 'Jumat'], effective_date: '2026-03-01', expired_date: '2027-03-01' },
        { id: 'S003', route_id: 'R003', departure_time: '14:00', arrival_time: '17:30', frequency: 'Daily', operating_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'], effective_date: '2026-01-15', expired_date: '2027-01-15' }
      ];
      await tx.insert(schedules).values(seedSchedules);

      // H. Populate Capacities
      const seedCapacities = [
        { id: 'C001', route_id: 'R001', vehicle_code: 'WBOX', max_weight: 25000, max_volume: 45, reserved_capacity: 65, available_capacity: 35 },
        { id: 'C002', route_id: 'R002', vehicle_code: 'FUSO', max_weight: 15000, max_volume: 32, reserved_capacity: 20, available_capacity: 80 },
        { id: 'C003', route_id: 'R003', vehicle_code: 'PCARGO', max_weight: 21000, max_volume: 120, reserved_capacity: 45, available_capacity: 55 }
      ];
      await tx.insert(capacities).values(seedCapacities);

      // I. Populate Users
      const seedUsers = [
        { username: 'admin', password: 'password111', full_name: 'Iwan (Super Admin)', role: 'Super Admin Nasional', office_code: '40000', status: 'Aktif' },
        { username: 'medan_admin', password: 'password222', full_name: 'Medan Admin', role: 'Regional Admin', office_code: '20100', status: 'Aktif' },
        { username: 'bandung_operator', password: 'password333', full_name: 'Bandung Operator', role: 'Operator Hub', office_code: '40199', status: 'Aktif' }
      ];
      await tx.insert(users).values(seedUsers);

      // J. Populate Audit Log trace
      await tx.insert(auditRecords).values([
        { id: 'A001', created_at: '2026-06-10T10:00:00Z', created_by: 'Budi Santoso (Operator)', action_description: 'Membuat Rute Baru RT-005 LINTAS PACIFIC MARITIME' },
        { id: 'A002', created_at: '2026-06-11T09:12:00Z', created_by: 'Siti Rahma (Regional Admin)', action_description: 'Melakukan review rute RT-002 PRIANGAN BARAT LOGISTICS dan mengubah status menjadi REVIEWED' },
        { id: 'A003', created_at: '2026-06-12T07:00:00Z', created_by: 'Handoko (National Admin)', action_description: 'Menyetujui (APPROVED) dan mempublikasikan (PUBLISHED) rute RT-001 LINTAS JAWA UTARA' },
        { id: `SEED-${Date.now()}`, created_at: new Date().toISOString(), created_by: 'System', action_description: 'Inisialisasi Database Sukses! 21 Kantor Pos, 11 Hub Transportasi, 4 Vendor, 5 Koridor Rute Prima, dan Kapasitas Armada berhasil disinkronisasi ke PostgreSQL.' }
      ]);
    });

    res.json({ success: true, message: "Seluruh data master Pos Indonesia berhasil di-sinkronisasi ke Database Supabase Anda!" });
  } catch (error: any) {
    console.error("Failed to seed system database:", error);
    res.status(500).json({ error: "Gagal memproses inisialisasi database PostgreSQL: " + error.message });
  }
});

// --- PHASE 4: INTELLIGENT ROUTING ENGINE API ENDPOINTS ---
app.post("/api/routing/recommendation", async (req, res) => {
  try {
    const { origin, destination, weight, volume, priority } = req.body;
    const shipWeight = Number(weight || 150);
    const shipVolume = Number(volume || 1);
    const routePriority = priority || 'BALANCED';

    console.log(`[Intelligent Routing Engine] Calculating path for ${origin} -> ${destination}, Weight: ${shipWeight} KG, Volume: ${shipVolume} m³`);

    // Let's attempt to search the database routes first for high accuracy
    let dbRoutes: any[] = [];
    try {
      dbRoutes = await db.select().from(routes);
    } catch (e) {
      console.warn("Could not load routes for backend pathfinding, using dynamic network simulator.");
    }

    // Prepare response candidates
    const alternatives: any[] = [];
    let bestRoute: any = null;

    // Check if we can find a route connecting these two nodes directly
    const directRoute = dbRoutes.find(
      r => r.origin_node === String(origin).toUpperCase() && 
           r.destination_node === String(destination).toUpperCase()
    );

    if (directRoute) {
      const isEligible = (directRoute.capacity_kg || 15000) >= shipWeight;
      bestRoute = {
        recommended_route: directRoute.route_code || "RT001",
        sla_hours: directRoute.transport_mode === 'Udara' ? 3 : directRoute.transport_mode === 'Laut' ? 36 : 14,
        available_capacity: Math.max(0, (directRoute.capacity_kg || 15000) - shipWeight),
        score: isEligible ? 94 : 45,
        eligibility: isEligible ? "ELIGIBLE" : "EXCLUDED_OVERLOAD"
      };

      // Add a couple of simulated alternates
      alternatives.push({
        route_code: `${directRoute.route_code}-ALT-B`,
        sla_hours: (bestRoute.sla_hours || 14) + 4,
        available_capacity: 4000,
        score: 82,
        mode: "Darat",
        transit_count: 2,
        eligibility: "ELIGIBLE"
      });
    } else {
      // General dynamic pathfinder fallback for any custom Origin-Destination pair
      const normalOrigin = String(origin || "GARUT").toUpperCase();
      const normalDest = String(destination || "SURABAYA").toUpperCase();

      // We will generate customized routes linking normalOrigin and normalDest!
      const codeA = `POS-DRT-PRI-${normalOrigin.slice(0,3)}${normalDest.slice(0,3)}-8124`;
      const codeB = `POS-UDR-PRI-${normalOrigin.slice(0,3)}${normalDest.slice(0,3)}-5401`;
      const codeC = `POS-LAUT-TER-${normalOrigin.slice(0,3)}${normalDest.slice(0,3)}-9270`;

      // Simulating a state where route A (the fastest, tightest road) has overload, so route B is returned
      const capacityA = 400; // e.g., low capacity left
      const capacityB = 5500;
      const capacityC = 12000;

      const isEligibleA = capacityA >= shipWeight;
      const isEligibleB = capacityB >= shipWeight;
      const isEligibleC = capacityC >= shipWeight;

      // Score options
      const scoreA = isEligibleA ? 92 : 35; // heavily penalized if overloaded
      const scoreB = isEligibleB ? 88 : 38;
      const scoreC = isEligibleC ? 72 : 25;

      const candidates = [
        { code: codeA, sla: 12, capacity: capacityA, score: scoreA, mode: "Darat", transit: 2, eligible: isEligibleA },
        { code: codeB, sla: 18, capacity: capacityB, score: scoreB, mode: "Darat", transit: 1, eligible: isEligibleB },
        { code: codeC, sla: 36, capacity: capacityC, score: scoreC, mode: "Laut", transit: 3, eligible: isEligibleC },
      ];

      // Sort by score
      const sorted = candidates.sort((x, y) => {
        // eligible goes first, then sorted by score
        if (x.eligible && !y.eligible) return -1;
        if (!x.eligible && y.eligible) return 1;
        return y.score - x.score;
      });

      bestRoute = {
        recommended_route: sorted[0].code,
        sla_hours: sorted[0].sla,
        available_capacity: sorted[0].capacity,
        score: sorted[0].score,
        eligibility: sorted[0].eligible ? "ELIGIBLE" : "EXCLUDED_OVERLOAD"
      };

      for (let i = 1; i < sorted.length; i++) {
        alternatives.push({
          route_code: sorted[i].code,
          sla_hours: sorted[i].sla,
          available_capacity: sorted[i].capacity,
          score: sorted[i].score,
          mode: sorted[i].mode,
          transit_count: sorted[i].transit,
          eligibility: sorted[i].eligible ? "ELIGIBLE" : "EXCLUDED_OVERLOAD"
        });
      }
    }

    res.json({
      recommended_route: bestRoute.recommended_route,
      sla_hours: bestRoute.sla_hours,
      available_capacity: bestRoute.available_capacity,
      score: bestRoute.score,
      eligibility: bestRoute.eligibility,
      alternatives: alternatives
    });
  } catch (err: any) {
    console.error("Backend Routing Engine Error:", err);
    res.status(500).json({ error: "Kalkulasi Intelligent Routing Engine Gagal: " + err.message });
  }
});

export default app;
