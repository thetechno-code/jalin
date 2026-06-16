import React, { useState, useEffect } from 'react';
import { Office, TransportNode, Route, Etape, Schedule, RouteCapacity, UserRole, WorkflowStatus, Vendor, Fleet } from './types';
import {
  INITIAL_OFFICES,
  INITIAL_TRANSPORT_NODES,
  INITIAL_ROUTES,
  INITIAL_ETAPES,
  INITIAL_SCHEDULES,
  INITIAL_CAPACITIES,
  INITIAL_AUDIT_LOGS
} from './data/mockData';

// Custom Users Management 
import { LogisticsUser } from './types';
import UserManager from './components/UserManager';

// Component imports
import NetworkMap from './components/NetworkMap';
import DataMasterManager from './components/DataMasterManager';
import VendorManager from './components/VendorManager';
import RouteWizard from './components/RouteWizard';
import CapacityScheduler from './components/CapacityScheduler';
import ExcelUploadSimulator from './components/ExcelUploadSimulator';
import ApprovalWorkflow from './components/ApprovalWorkflow';
import DataQualityDash from './components/DataQualityDash';
import EnterpriseArchitectureDocs from './components/EnterpriseArchitectureDocs';
import RoleLoginModal from './components/RoleLoginModal';
import NationalControlTower from './components/NationalControlTower';
import RouteList from './components/RouteList';
import DBeaverGuideModal from './components/DBeaverGuideModal';
import TransportCostManager from './components/TransportCostManager';
import CapacityPlanningHub from './components/CapacityPlanningHub';

const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'V001',
    vendor_code: 'VND-POSLOG',
    vendor_name: 'PT POS LOGISTIK INDONESIA',
    vendor_type: 'BUMN',
    contact_person: 'Budi Santoso',
    contact_phone: '081122334455',
    contact_email: 'budi.s@poslogistik.co.id',
    status: 'Aktif',
    rating: 5
  },
  {
    id: 'V002',
    vendor_code: 'VND-GCARGO',
    vendor_name: 'PT GARUDA INDONESIA CARGO',
    vendor_type: 'BUMN',
    contact_person: 'Siti Rahma',
    contact_phone: '081234567890',
    contact_email: 'siti.r@garudacargo.co.id',
    status: 'Aktif',
    rating: 5
  },
  {
    id: 'V003',
    vendor_code: 'VND-PELNI',
    vendor_name: 'PT PELAYANAN NASIONAL INDONESIA (PELNI)',
    vendor_type: 'BUMN',
    contact_person: 'Agus Salim',
    contact_phone: '081398765432',
    contact_email: 'agus.s@pelni.co.id',
    status: 'Aktif',
    rating: 4
  },
  {
    id: 'V004',
    vendor_code: 'VND-SWA-INDOC',
    vendor_name: 'PT INDOCARGO NUSA UTAMA',
    vendor_type: 'Swasta',
    contact_person: 'Hendra Wijaya',
    contact_phone: '085711223344',
    contact_email: 'hendra@indocargo.com',
    status: 'Aktif',
    rating: 4
  }
];

const INITIAL_FLEETS: Fleet[] = [
  {
    id: 'F001',
    license_plate: 'B-9001-POS',
    vehicle_name: 'Hino Wingbox Heavy Truck',
    vehicle_mode: 'Darat',
    max_weight: 18000,
    max_volume: 45,
    vendor_id: 'V001',
    status: 'Tersedia'
  },
  {
    id: 'F002',
    license_plate: 'B-9543-POS',
    vehicle_name: 'Fuso Box Medium Truck',
    vehicle_mode: 'Darat',
    max_weight: 8000,
    max_volume: 24,
    vendor_id: 'V001',
    status: 'Tersedia'
  },
  {
    id: 'F003',
    license_plate: 'PK-GIA-737',
    vehicle_name: 'Boeing 737-800F Cargo Jet',
    vehicle_mode: 'Udara',
    max_weight: 22000,
    max_volume: 120,
    vendor_id: 'V002',
    status: 'Tersedia'
  },
  {
    id: 'F004',
    license_plate: 'KM-DOBONSOLO',
    vehicle_name: 'MV DOBONSOLO Express Vessel',
    vehicle_mode: 'Laut',
    max_weight: 500000,
    max_volume: 1800,
    vendor_id: 'V003',
    status: 'Tersedia'
  }
];


import {
  BarChart3,
  MapPin,
  Route as RouteIcon,
  Calendar,
  Share2,
  TrendingUp,
  FileSpreadsheet,
  FileCheck,
  ShieldAlert,
  BookOpen,
  Mail,
  Lock,
  Compass,
  AlertCircle,
  LogIn,
  LogOut,
  Database,
  Users
} from 'lucide-react';

export default function App() {
  // Master state parameters
  const [offices, setOffices] = useState<Office[]>(INITIAL_OFFICES);
  const [nodes, setNodes] = useState<TransportNode[]>(INITIAL_TRANSPORT_NODES);
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);
  const [etapes, setEtapes] = useState<Etape[]>(INITIAL_ETAPES);
  const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
  const [capacities, setCapacities] = useState<RouteCapacity[]>(INITIAL_CAPACITIES);
  const [auditLogs, setAuditLogs] = useState<any[]>(INITIAL_AUDIT_LOGS);
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [fleets, setFleets] = useState<Fleet[]>(INITIAL_FLEETS);

  // active selected tabs in Dashboard
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('Operator Hub');
  const [activeCategory, setActiveCategory] = useState<'control' | 'operations' | 'finance' | 'admin'>('control');
  const [isSelectRoleModalOpen, setIsSelectRoleModalOpen] = useState<boolean>(false);
  const [isDBeaverModalOpen, setIsDBeaverModalOpen] = useState<boolean>(false);

  // Tab permissions configuration mapping block
  const ALLOWED_TABS: Record<UserRole, string[]> = {
    'Super Admin Nasional': ['dashboard', 'routes', 'master', 'vendors', 'wizard', 'capacity', 'capacity_planning', 'excel', 'approval', 'quality', 'users', 'docs', 'cost_manager'],
    'Regional Admin': ['dashboard', 'routes', 'master', 'vendors', 'capacity', 'capacity_planning', 'approval', 'quality', 'docs', 'cost_manager'],
    'Operator Hub': ['dashboard', 'routes', 'master', 'vendors', 'wizard', 'capacity', 'capacity_planning', 'excel', 'docs', 'cost_manager'],
    'Auditor': ['dashboard', 'routes', 'vendors', 'capacity_planning', 'approval', 'quality', 'docs', 'cost_manager'],
    'Viewer': ['dashboard', 'routes', 'vendors', 'capacity_planning', 'docs', 'cost_manager']
  };

  const isTabAllowed = (tabId: string) => {
    return ALLOWED_TABS[currentRole]?.includes(tabId) ?? false;
  };

  // Keep category automatically synchronized when tab changes elsewhere
  useEffect(() => {
    if (['dashboard', 'quality', 'docs'].includes(activeTab)) {
      setActiveCategory('control');
    } else if (['routes', 'wizard', 'capacity', 'capacity_planning', 'excel'].includes(activeTab)) {
      setActiveCategory('operations');
    } else if (['cost_manager'].includes(activeTab)) {
      setActiveCategory('finance');
    } else if (['master', 'vendors', 'approval', 'users'].includes(activeTab)) {
      setActiveCategory('admin');
    }
  }, [activeTab]);

  const handleCategoryChange = (category: 'control' | 'operations' | 'finance' | 'admin') => {
    setActiveCategory(category);
    // Auto-redirect to first allowed tab in the category
    let tabsInCategory: string[] = [];
    if (category === 'control') tabsInCategory = ['dashboard', 'quality', 'docs'];
    else if (category === 'operations') tabsInCategory = ['routes', 'wizard', 'capacity', 'capacity_planning', 'excel'];
    else if (category === 'finance') tabsInCategory = ['cost_manager'];
    else if (category === 'admin') tabsInCategory = ['master', 'vendors', 'approval', 'users'];

    const allowed = tabsInCategory.find(t => isTabAllowed(t));
    if (allowed) {
      setActiveTab(allowed);
    }
  };

  const changeRoleAndRedirect = (role: UserRole) => {
    setCurrentRole(role);
    const allowed = ALLOWED_TABS[role] || ['dashboard'];
    if (!allowed.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  };

  // Custom Users & Postgres auth structures
  const [users, setUsers] = useState<LogisticsUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LogisticsUser | null>(null);
  const [dbLoading, setDbLoading] = useState<boolean>(true);
  const [dbSyncStatus, setDbSyncStatus] = useState<'synced' | 'local_fallback' | 'loading'>('loading');
  const [dbError, setDbError] = useState<string | null>(null);

  // Monitor Auth state changes - Local Storage Restore
  useEffect(() => {
    const savedUser = localStorage.getItem('logged_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        setCurrentRole(parsed.role);
      } catch (e) {
        console.error("Failed to restore saved user session:", e);
      }
    } else {
      // open login modal automatically on startup
      setIsSelectRoleModalOpen(true);
    }
  }, []);

  const handleLoginSuccess = (user: LogisticsUser) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    localStorage.setItem('logged_user', JSON.stringify(user));
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('logged_user');
    setIsSelectRoleModalOpen(true);
  };

  const handleSaveUser = async (userToSave: LogisticsUser) => {
    try {
      const auditLog = {
        id: 'user-' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        created_by: currentUser ? currentUser.username : 'System',
        action_description: `Super Admin mengupdate/mendaftar user: ${userToSave.username} (Role: ${userToSave.role}, Kantor: ${userToSave.office_code})`
      };

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userToSave, auditLog })
      });

      if (!res.ok) throw new Error("Gagal menyimpan data.");
      
      // Update local state
      setUsers((prev) => {
        const exists = prev.find((u) => u.id === userToSave.id || (userToSave.id === undefined && u.username === userToSave.username));
        if (exists) {
          return prev.map((u) => ((u.id === userToSave.id && u.id !== undefined) || u.username === userToSave.username ? { ...u, ...userToSave } : u));
        } else {
          return [...prev, { ...userToSave, id: Math.floor(Math.random() * 1000 + 100) }];
        }
      });

      // append audit Log
      setAuditLogs((prev) => [auditLog, ...prev]);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      const auditLog = {
        id: 'user-del-' + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        created_by: currentUser ? currentUser.username : 'System',
        action_description: `Super Admin menghapus permanen user: ${userToDelete ? userToDelete.username : userId}`
      };

      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditLog })
      });

      if (!res.ok) throw new Error("Gagal menghapus user.");

      // update local state
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setAuditLogs((prev) => [auditLog, ...prev]);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Synchronize master database on page load
  useEffect(() => {
    async function fetchDatabase() {
      try {
        setDbSyncStatus('loading');
        setDbError(null);
        const res = await fetch('/api/data');
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server returned database error code ${res.status}`);
        }
        const data = await res.json();

        setOffices(data.offices || []);
        setNodes(data.nodes || []);
        setRoutes(data.routes || []);
        setEtapes(data.etapes || []);
        setSchedules(data.schedules || []);
        setCapacities(data.capacities || []);
        setAuditLogs(data.auditLogs || []);
        setVendors(data.vendors || []);
        setFleets(data.fleets || []);
        setUsers(data.users || []);

        setDbSyncStatus('synced');
      } catch (error: any) {
        console.error("Cloud SQL fetch failed, disabling silent offline fallback:", error);
        setDbSyncStatus('local_fallback');
        setDbError(error.message || String(error));
        
        // Disable local backup database restore to enforce full visibility of the error on blank slate
        setOffices([]);
        setNodes([]);
        setRoutes([]);
        setEtapes([]);
        setSchedules([]);
        setCapacities([]);
        setVendors([]);
        setFleets([]);
      } finally {
        setDbLoading(false);
      }
    }
    fetchDatabase();
  }, []);

  // Persist local state edits to localStorage in local fallback mode
  useEffect(() => {
    if (dbSyncStatus === 'local_fallback') {
      localStorage.setItem('local_offices', JSON.stringify(offices));
      localStorage.setItem('local_nodes', JSON.stringify(nodes));
      localStorage.setItem('local_routes', JSON.stringify(routes));
      localStorage.setItem('local_etapes', JSON.stringify(etapes));
      localStorage.setItem('local_schedules', JSON.stringify(schedules));
      localStorage.setItem('local_capacities', JSON.stringify(capacities));
      localStorage.setItem('local_vendors', JSON.stringify(vendors));
      localStorage.setItem('local_fleets', JSON.stringify(fleets));
      localStorage.setItem('local_auditLogs', JSON.stringify(auditLogs));
      localStorage.setItem('local_users', JSON.stringify(users));
    }
  }, [offices, nodes, routes, etapes, schedules, capacities, vendors, fleets, auditLogs, users, dbSyncStatus]);

  // WIPE & RESET THE SYSTEM DATABASE (Simulator Helper)
  const handleResetDatabase = async () => {
    if (!window.confirm("PERINGATAN: Apakah Anda yakin ingin MENGOSONGKAN SELURUH database (Kantor Master, Rute, Etape, Jadwal, Kapasitas, Vendor, dll)?\n\nTindakan ini menghapus semua entitas di server PostgreSQL atau memori lokal agar Anda dapat menyimulasikan pengisian mandiri dengan data baru riil.")) {
      return;
    }

    try {
      setDbSyncStatus('loading');
      
      let backendSuccess = false;
      let errorMsg = "";

      if (dbSyncStatus !== 'local_fallback') {
        try {
          const res = await fetch('/api/reset-database', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (res.ok) {
            backendSuccess = true;
          } else {
            const errData = await res.json();
            errorMsg = errData.error || "Gagal menghubungi modul api reset.";
          }
        } catch (e: any) {
          errorMsg = e.message || "Network error ketika menghubungi server.";
        }
      }

      // Clear all react collections so the screen instantly goes blank/fresh
      setOffices([]);
      setNodes([]);
      setRoutes([]);
      setEtapes([]);
      setSchedules([]);
      setCapacities([]);
      setVendors([]);
      setFleets([]);

      // Reinstate the default login users in memory so the app stays logged in
      setUsers([
        {
          id: 1,
          username: 'admin',
          password: 'password111',
          full_name: 'Iwan (Super Admin)',
          role: 'Super Admin Nasional',
          office_code: '40000',
          status: 'Aktif'
        },
        {
          id: 2,
          username: 'medan_admin',
          password: 'password222',
          full_name: 'Medan Admin',
          role: 'Regional Admin',
          office_code: '20100',
          status: 'Aktif'
        },
        {
          id: 3,
          username: 'bandung_operator',
          password: 'password333',
          full_name: 'Bandung Operator',
          role: 'Operator Hub',
          office_code: '40199',
          status: 'Aktif'
        }
      ]);

      // Set default single audit log
      setAuditLogs([
        {
          id: `RESET-${Date.now()}`,
          created_at: new Date().toISOString(),
          created_by: currentUser ? currentUser.username : 'System',
          action_description: backendSuccess 
            ? 'Modul Reset Sistem diaktifkan. Melakukan pembersihan PostgreSQL menyeluruh.'
            : 'Modul Reset Sistem diaktifkan (Mode Memori Lokal). Data simulasi dibersihkan dari memori browser.'
        }
      ]);

      if (dbSyncStatus !== 'local_fallback' && backendSuccess) {
        setDbSyncStatus('synced');
        alert("Database PostgreSQL berhasil dibersihkan! Seluruh data dummy atau data lama telah dihapus. Silakan mulai simulasi pengisian data Anda secara mandiri.");
      } else {
        // Fallback reset in local mode
        setDbSyncStatus('local_fallback');
        alert("Database dalam memori lokal berhasil dikosongkan! (Koneksi PostgreSQL cloud dilewati/tidak dikonfigurasi). Silakan mulai simulasi pengisian data Anda dari nol.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Gagal melakukan reset database: " + err.message);
      setDbSyncStatus('local_fallback');
    }
  };

  // SEED THE ENTIRE CLOUD DATABASE WITH POS MASTER DATA
  const handleSeedDatabase = async () => {
    if (!window.confirm("Apakah Anda ingin MENGINISIALISASI database PostgreSQL Supabase Anda dengan data master default Pos Indonesia?\n\nIni akan mengisi 21 Kantor Pos, 11 Hub Transportasi, 4 Vendor BUMN/Swasta, 5 Koridor Rute Prima, Kapasitas, dan Jadwal Armada secara instan agar dashboard terisi lengkap.")) {
      return;
    }

    try {
      setDbSyncStatus('loading');
      const res = await fetch('/api/seed-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error("Gagal melakukan inisialisasi cloud database.");
      }

      const resData = await res.json();
      
      // Refetch the data
      const dataRes = await fetch('/api/data');
      if (dataRes.ok) {
        const data = await dataRes.json();
        setOffices(data.offices || []);
        setNodes(data.nodes || []);
        setRoutes(data.routes || []);
        setEtapes(data.etapes || []);
        setSchedules(data.schedules || []);
        setCapacities(data.capacities || []);
        setAuditLogs(data.auditLogs || []);
        setVendors(data.vendors || []);
        setFleets(data.fleets || []);
        setUsers(data.users || []);
        setDbSyncStatus('synced');
      }
      
      alert(resData.message || "Seeding database sukses!");
    } catch (err: any) {
      console.error(err);
      alert("Gagal melakukan seeding database: " + err.message);
      setDbSyncStatus('synced');
    }
  };

  // State modifiers hooked up to full-stack Express + Cloud SQL backend
  const handleAddOffice = async (office: Office) => {
    const newLog = {
      id: `A_MOCK_${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: currentUser ? currentUser.full_name || currentUser.username : `${currentRole} (Guest)`,
      action_description: `Mendaftarkan Kantor Pos Baru ke Master Kantor Nasional: [${office.office_code}] ${office.office_name}`
    };

    try {
      const res = await fetch('/api/offices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...office, auditLog: newLog })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status ${res.status}`);
      }

      setOffices((prev) => [...prev, office]);
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error("Failed to sync office registration to database", err);
      alert("❌ GAGAL MENYIMPAN KANTOR POS KEDALAM DATABASE SUPABASE:\n\n" + err.message);
    }
  };

  const handleToggleTransportNode = async (node: TransportNode) => {
    const getOfficeName = offices.find(o => o.office_code === node.office_code)?.office_name || node.office_code;
    const actionDesc = node.is_transport_node
      ? `Mengaktifkan status Transport Node untuk Kantor: [${node.office_code}] ${getOfficeName}.`
      : `Menonaktifkan status Transport Node untuk Kantor: [${node.office_code}] ${getOfficeName}.`;
      
    const newLog = {
      id: `A_MOCK_${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: currentUser ? currentUser.full_name || currentUser.username : `${currentRole} (Guest)`,
      action_description: actionDesc
    };

    try {
      const matchedOffice = offices.find(o => o.office_code === node.office_code);
      const res = await fetch('/api/transport-nodes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...node,
          office_name: matchedOffice?.office_name,
          office_type: matchedOffice?.office_type,
          region_code: matchedOffice?.region_code,
          auditLog: newLog
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status ${res.status}`);
      }

      setNodes((prev) => {
        const idx = prev.findIndex((n) => n.office_code === node.office_code);
        if (idx > -1) {
          const copy = [...prev];
          copy[idx] = node;
          return copy;
        }
        return [...prev, node];
      });
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error("Failed to sync transport node state", err);
      alert("❌ GAGAL MENGUBAH STATUS HUB TRANSPORTASI KEDALAM DATABASE SUPABASE:\n\n" + err.message);
    }
  };

  const handleSaveVendor = async (vendor: Vendor) => {
    const isEditing = vendors.some(v => v.id === vendor.id);
    const actionDesc = isEditing
      ? `Memperbarui profil mitra vendor: [${vendor.vendor_code}] ${vendor.vendor_name}`
      : `Mendaftarkan mitra vendor baru ke Master Vendor Nasional: [${vendor.vendor_code}] ${vendor.vendor_name}`;

    const newLog = {
      id: `A_MOCK_${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: currentUser ? currentUser.full_name || currentUser.username : `${currentRole} (Guest)`,
      action_description: actionDesc
    };

    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor, auditLog: newLog })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status ${res.status}`);
      }

      setVendors((prev) => {
        const idx = prev.findIndex(v => v.id === vendor.id);
        if (idx > -1) {
          const copy = [...prev];
          copy[idx] = vendor;
          return copy;
        }
        return [...prev, vendor];
      });
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error("Failed to sync vendor save to database", err);
      alert("❌ GAGAL MENYIMPAN VENDOR MASTER KEDALAM DATABASE SUPABASE:\n\n" + err.message);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    const target = vendors.find(v => v.id === id);
    const actionDesc = target
      ? `Menghapus mitra vendor dan melikuidasi armada terdaftar: [${target.vendor_code}] ${target.vendor_name}`
      : `Menghapus mitra vendor dengan ID: ${id}`;

    const newLog = {
      id: `A_MOCK_${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: currentUser ? currentUser.full_name || currentUser.username : `${currentRole} (Guest)`,
      action_description: actionDesc
    };

    try {
      const res = await fetch(`/api/vendors/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditLog: newLog })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status ${res.status}`);
      }

      setVendors((prev) => prev.filter(v => v.id !== id));
      setFleets((prev) => prev.filter(f => f.vendor_id !== id)); // Cascade delete fleets in client
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error("Failed to delete vendor", err);
      alert("❌ GAGAL MENGHAPUS VENDOR DARI DATABASE SUPABASE:\n\n" + err.message);
    }
  };

  const handleSaveFleet = async (fleet: Fleet) => {
    const isEditing = fleets.some(f => f.id === fleet.id);
    const actionDesc = isEditing
      ? `Memperbarui spesifikasi teknis armada: [${fleet.license_plate}] ${fleet.vehicle_name}`
      : `Mendaftarkan armada angkutan baru ke inventaris: [${fleet.license_plate}] ${fleet.vehicle_name}`;

    const newLog = {
      id: `A_MOCK_${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: currentUser ? currentUser.full_name || currentUser.username : `${currentRole} (Guest)`,
      action_description: actionDesc
    };

    try {
      const res = await fetch('/api/fleets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fleet, auditLog: newLog })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status ${res.status}`);
      }

      setFleets((prev) => {
        const idx = prev.findIndex(f => f.id === fleet.id);
        if (idx > -1) {
          const copy = [...prev];
          copy[idx] = fleet;
          return copy;
        }
        return [...prev, fleet];
      });
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error("Failed to save fleet", err);
      alert("❌ GAGAL MENYIMPAN ARMADA KEDALAM DATABASE SUPABASE:\n\n" + err.message);
    }
  };

  const handleDeleteFleet = async (id: string) => {
    const target = fleets.find(f => f.id === id);
    const actionDesc = target
      ? `Decommission / menghapus unit armada: [${target.license_plate}] ${target.vehicle_name}`
      : `Menghapus unit armada ID: ${id}`;

    const newLog = {
      id: `A_MOCK_${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: currentUser ? currentUser.full_name || currentUser.username : `${currentRole} (Guest)`,
      action_description: actionDesc
    };

    try {
      const res = await fetch(`/api/fleets/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditLog: newLog })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status ${res.status}`);
      }

      setFleets((prev) => prev.filter(f => f.id !== id));
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error("Failed to delete fleet", err);
      alert("❌ GAGAL MENGHAPUS ARMADA DARI DATABASE SUPABASE:\n\n" + err.message);
    }
  };

  const handleSaveRoute = async (
    newRoute: Route,
    newEtapes: Omit<Etape, 'id'>[],
    newSchedule: Omit<Schedule, 'id'>
  ) => {
    const dbEtapes: Etape[] = newEtapes.map((e, idx) => ({
      ...e,
      id: `E_MOCK_${newRoute.route_code}_${idx}_${Date.now()}`,
      route_id: newRoute.id
    }));

    const finalSchedule: Schedule = {
      ...newSchedule,
      id: `S_MOCK_${newRoute.route_code}_${Date.now()}`,
      route_id: newRoute.id
    };

    const defaultCapacity: RouteCapacity = {
      id: `C_MOCK_${newRoute.route_code}_${Date.now()}`,
      route_id: newRoute.id,
      vehicle_code: 'WBOX',
      max_weight: 25000,
      max_volume: 45,
      reserved_capacity: 10,
      available_capacity: 90
    };

    const newLog = {
      id: `A_MOCK_${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: currentUser ? currentUser.full_name || currentUser.username : `${currentRole} (Guest)`,
      action_description: `Membuat Rute Baru "${newRoute.route_name}" [${newRoute.route_code}] dengan total ${newEtapes.length} Etape transit.`
    };

    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: newRoute,
          etapes: dbEtapes,
          schedule: finalSchedule,
          capacity: defaultCapacity,
          auditLog: newLog
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status ${res.status}`);
      }

      setRoutes((prev) => [newRoute, ...prev]);
      setEtapes((prev) => [...prev, ...dbEtapes]);
      setSchedules((prev) => [...prev, finalSchedule]);
      setCapacities((prev) => [...prev, defaultCapacity]);
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error("Failed to sync route bundle saving", err);
      alert("❌ GAGAL MENYIMPAN RUTE BARU KE DATABASE SUPABASE:\n\n" + err.message);
    }
  };

  const handleImportBulk = async (newRoutes: Route[], newEtapes: Etape[]) => {
    const newSchedules: Schedule[] = [];
    const newCapacities: RouteCapacity[] = [];

    newRoutes.forEach((nr) => {
      newSchedules.push({
        id: `S_XLS_${nr.route_code}`,
        route_id: nr.id,
        departure_time: '08:00',
        arrival_time: '21:00',
        frequency: 'Daily',
        operating_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
        effective_date: '2026-06-12',
        expired_date: '2027-12-31'
      });

      newCapacities.push({
        id: `C_XLS_${nr.route_code}`,
        route_id: nr.id,
        vehicle_code: 'FUSO',
        max_weight: 15000,
        max_volume: 32,
        reserved_capacity: 15,
        available_capacity: 85
      });
    });

    const newLog = {
      id: `A_MOCK_${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: currentUser ? currentUser.full_name || currentUser.username : `${currentRole} (System Bulk Import)`,
      action_description: `Melakukan Import Massal Excel/CSV berisi ${newRoutes.length} Rute baru dan ${newEtapes.length} Total Etape Transit sekaligus.`
    };

    try {
      const res = await fetch('/api/routes/import-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routes: newRoutes,
          etapes: newEtapes,
          schedules: newSchedules,
          capacities: newCapacities,
          auditLog: newLog
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status ${res.status}`);
      }

      setRoutes((prev) => [...newRoutes, ...prev]);
      setEtapes((prev) => [...newEtapes, ...prev]);
      setSchedules((prev) => [...newSchedules, ...prev]);
      setCapacities((prev) => [...newCapacities, ...prev]);
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error("Bulk sync upload failed", err);
      alert("❌ GAGAL MENYIMPAN IMPORT MASSAL RUTE KE DATABASE SUPABASE:\n\n" + err.message);
    }
  };

  const handleUpdateStatus = async (routeId: string, nextStatus: WorkflowStatus, actor: string) => {
    const matchRoute = routes.find((r) => r.id === routeId);
    const rName = matchRoute ? matchRoute.route_name : 'Unknown';
    const rCode = matchRoute ? matchRoute.route_code : 'Unknown';

    const newLog = {
      id: `A_MOCK_${Date.now()}`,
      created_at: new Date().toISOString(),
      created_by: currentUser ? currentUser.full_name || currentUser.username : `${currentRole} (${actor})`,
      action_description: `Mengubah status persetujuan rute [${rCode}] ${rName} menjadi: ${nextStatus.toUpperCase()}`
    };

    try {
      const res = await fetch(`/api/routes/${routeId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextStatus, auditLog: newLog })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status ${res.status}`);
      }

      setRoutes((prev) =>
        prev.map((r) => (r.id === routeId ? { ...r, status: nextStatus } : r))
      );
      setAuditLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error("Failed to sync workflow status state", err);
      alert("❌ GAGAL MENGUBAH STATUS PERSETUJUAN RUTE DI DATABASE SUPABASE:\n\n" + err.message);
    }
  };

  const handleAllocateCapacity = async (routeId: string, vehicleCode: string) => {
    const isExist = capacities.some(c => c.route_id === routeId && c.vehicle_code === vehicleCode);
    if (isExist) return;

    const newCap: RouteCapacity = {
      id: `C_MOCK_${routeId}_${vehicleCode}_${Date.now()}`,
      route_id: routeId,
      vehicle_code: vehicleCode,
      max_weight: vehicleCode === 'CDD' ? 4000 : vehicleCode === 'FUSO' ? 15000 : vehicleCode === 'WBOX' ? 25000 : vehicleCode === 'PCARGO' ? 21000 : 500000,
      max_volume: vehicleCode === 'CDD' ? 14 : vehicleCode === 'FUSO' ? 32 : vehicleCode === 'WBOX' ? 45 : vehicleCode === 'PCARGO' ? 120 : 4800,
      reserved_capacity: Math.floor(Math.random() * 50) + 15,
      available_capacity: 0
    };
    newCap.available_capacity = 100 - newCap.reserved_capacity;

    try {
      const res = await fetch('/api/capacities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCap)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status ${res.status}`);
      }

      setCapacities(prev => [...prev, newCap]);
    } catch (err: any) {
      console.error("Failed to allocate cargo capacity dynamically", err);
      alert("❌ GAGAL MENYIMPAN ALOKASI KAPASITAS ARMADA KE DATABASE SUPABASE:\n\n" + err.message);
    }
  };

  const handleDeleteCapacity = async (capacityId: string) => {
    try {
      const res = await fetch(`/api/capacities/${capacityId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned error status ${res.status}`);
      }

      setCapacities(prev => prev.filter(c => c.id !== capacityId));
    } catch (err: any) {
      console.error("Failed to delete capacity dynamically", err);
      // Fallback in offline state
      setCapacities(prev => prev.filter(c => c.id !== capacityId));
    }
  };

  const handleSaveSchedule = (schedule: Schedule) => {
    setSchedules((prev) => [...prev, schedule]);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none selection:bg-cyan-200 selection:text-slate-900">
      
      {/* Prominent Database Connection/Operation error warning banner */}
      {dbError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-start gap-4 animate-fade-in font-mono text-xs">
          <div className="p-2.5 bg-red-100 text-red-700 rounded-xl mt-0.5 shadow-sm border border-red-300">
            <AlertCircle className="w-5 h-5 animate-pulse text-red-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold text-[13px] text-red-800 uppercase tracking-wide">
                ⚠️ Peringatan: Gagal Menghubungkan ke Database Supabase / PostgreSQL
              </span>
              <span className="px-1.5 py-0.5 bg-red-600 text-white font-mono font-bold text-[9px] rounded uppercase select-none">
                DATABASE_ERROR
              </span>
            </div>
            <p className="text-slate-700 font-bold max-w-4xl leading-relaxed text-[11px] mb-3 bg-red-100/60 p-3 rounded-lg border border-red-200 break-all select-all shadow-inner">
              {dbError}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="bg-red-600 hover:bg-red-700 hover:scale-[1.02] text-white font-bold py-1.5 px-3.5 rounded-lg text-[10px] tracking-wider uppercase cursor-pointer shadow transition-all duration-155 flex items-center gap-1.5"
              >
                <Database className="w-3 h-3 text-red-100 animate-spin" />
                Coba Hubungkan Kembali (Reload)
              </button>
              <button
                onClick={() => setDbError(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer shadow transition-all duration-150 transform"
              >
                Abaikan / Tutup Pesan
              </button>
              <span className="text-[10px] text-slate-500 font-sans">
                Fungsi fallback (pengalihan otomatis) telah dimatikan secara eksplisit untuk mencegah penyimpanan lokal tidak sinkron.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header Navigation Bar */}
      <header className="border-b border-slate-800 bg-[#1C2D5A] sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-md text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 via-red-500 to-orange-350 p-[1.5px] shadow flex items-center justify-center">
            <div className="w-full h-full bg-[#1C2D5A] rounded-[10px] flex items-center justify-center">
              <span className="font-mono font-extrabold text-orange-400 text-[15px] tracking-wide">P</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[15px] font-extrabold text-white uppercase tracking-wider font-mono">N22POS</h1>
              <span className="px-1.5 py-0.5 bg-orange-500/20 border border-orange-500/30 text-orange-350 text-orange-300 rounded text-[9px] font-mono font-semibold uppercase">
                Transport Upgrade
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-medium">Nasional Transport &amp; Capacity Planner Portal • Angkutan N22</p>
          </div>
        </div>

        {/* Sync status and authentication section */}
        <div className="flex items-center gap-3">
          {/* Database Synchronization Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/40 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs font-mono">
            <Database className={`w-3.5 h-3.5 ${
              dbSyncStatus === 'synced' ? 'text-emerald-400' : dbSyncStatus === 'loading' ? 'text-cyan-400 animate-spin' : 'text-amber-400'
            }`} />
            <span className="text-[10px] text-slate-300">PostgreSQL:</span>
            <span className={`text-[10px] font-bold uppercase transition-colors ${
              dbSyncStatus === 'synced' ? 'text-emerald-400' : dbSyncStatus === 'loading' ? 'text-cyan-400' : 'text-amber-400'
            }`}>
              {dbSyncStatus === 'synced' ? 'Connected' : dbSyncStatus === 'loading' ? 'Syncing...' : 'Local Fallback'}
            </span>
          </div>



          {/* User Sign-In Action Component */}
          {currentUser ? (
            <div 
              onClick={() => setIsSelectRoleModalOpen(true)}
              className="flex items-center gap-3 bg-slate-900/40 border border-slate-700/60 p-1.5 rounded-xl pr-3 shadow-sm hover:border-orange-500/35 hover:bg-orange-500/10 cursor-pointer transition-all"
            >
              <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs font-mono">
                {(currentUser.full_name || currentUser.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <span className="text-[10px] font-semibold text-white block leading-tight truncate max-w-[125px]">
                  {currentUser.full_name || currentUser.username}
                </span>
                <span className="text-[8px] text-slate-300 font-mono uppercase block">{currentRole} ({currentUser.office_code})</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSignOut();
                }}
                title="Log Out"
                className="p-1 hover:bg-slate-800 text-slate-300 hover:text-red-400 rounded-lg transition-colors border border-transparent"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSelectRoleModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md hover:from-orange-400 hover:to-red-400 active:scale-95 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login / Pilih Peran</span>
            </button>
          )}

          {/* Global User status badge */}
          <button
            onClick={() => setIsSelectRoleModalOpen(true)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/65 p-2 border border-slate-200 hover:border-orange-300 rounded-xl cursor-pointer transition-all focus:outline-none"
            title="Klik untuk mengubah Peran Akses Anda"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] text-slate-500 block font-mono hidden md:inline">Role:</span>
            <span className="text-slate-800 text-xs font-bold uppercase">{currentRole}</span>
          </button>
        </div>
      </header>

      {/* 2. Main Tab Buttons Navigation Grouped & Restructured */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-col gap-3 shadow-xs">
        {/* Category Group Selector Row */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2">
          <button
            id="nav-cat-control"
            onClick={() => handleCategoryChange('control')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'control'
                ? 'bg-[#1C2D5A] text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Control Tower &amp; Monitoring</span>
          </button>

          <button
            id="nav-cat-operations"
            onClick={() => handleCategoryChange('operations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'operations'
                ? 'bg-[#1C2D5A] text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <RouteIcon className="w-3.5 h-3.5" />
            <span>Transport Operations</span>
          </button>

          <button
            id="nav-cat-finance"
            onClick={() => handleCategoryChange('finance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'finance'
                ? 'bg-[#1C2D5A] text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Cost Management &amp; Invoice Reconciliation</span>
          </button>

          <button
            id="nav-cat-admin"
            onClick={() => handleCategoryChange('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'admin'
                ? 'bg-[#1C2D5A] text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Master &amp; Administration</span>
          </button>
        </div>

        {/* Sub-tab selection nested inside category */}
        <div className="flex flex-wrap items-center gap-1 animate-fade-in">
          {activeCategory === 'control' && (
            <>
              {isTabAllowed('dashboard') && (
                <button
                  id="tab-dashboard"
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'dashboard' ? 'bg-[#1C2D5A]/10 text-cyan-900 border border-[#1C2D5A]/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" /> Control Tower Dashboard
                </button>
              )}

              {isTabAllowed('quality') && (
                <button
                  id="tab-quality"
                  onClick={() => setActiveTab('quality')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'quality' ? 'bg-[#1C2D5A]/10 text-cyan-900 border border-[#1C2D5A]/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" /> Diagnostik &amp; Kualitas Data
                </button>
              )}

              {isTabAllowed('docs') && (
                <button
                  id="tab-docs"
                  onClick={() => setActiveTab('docs')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'docs' ? 'bg-[#1C2D5A]/10 text-cyan-900 border border-[#1C2D5A]/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4" /> Arsitektur EA Wiki Docs
                </button>
              )}
            </>
          )}

          {activeCategory === 'operations' && (
            <>
              {isTabAllowed('routes') && (
                <button
                  id="tab-routes"
                  onClick={() => setActiveTab('routes')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'routes' ? 'bg-[#1C2D5A]/10 text-cyan-900 border border-[#1C2D5A]/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <RouteIcon className="w-4 h-4" /> Daftar Rute (Top 100)
                </button>
              )}

              {isTabAllowed('wizard') && (
                <button
                  id="tab-wizard"
                  onClick={() => setActiveTab('wizard')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'wizard' ? 'bg-[#1C2D5A]/10 text-cyan-900 border border-[#1C2D5A]/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <RouteIcon className="w-4 h-4" /> Buat Rute Baru
                </button>
              )}

              {isTabAllowed('capacity') && (
                <button
                  id="tab-capacity"
                  onClick={() => setActiveTab('capacity')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'capacity' ? 'bg-[#1C2D5A]/10 text-cyan-900 border border-[#1C2D5A]/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-4 h-4" /> Alokasi &amp; Kapasitas Armada
                </button>
              )}

              {isTabAllowed('capacity_planning') && (
                <button
                  id="tab-capacity_planning"
                  onClick={() => setActiveTab('capacity_planning')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'capacity_planning' ? 'bg-[#1C2D5A]/10 text-cyan-900 border border-[#1C2D5A]/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" /> Proactive Routing Hub
                </button>
              )}

              {isTabAllowed('excel') && (
                <button
                  id="tab-excel"
                  onClick={() => setActiveTab('excel')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'excel' ? 'bg-[#1C2D5A]/10 text-cyan-900 border border-[#1C2D5A]/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" /> Excel Cargo Importer
                </button>
              )}
            </>
          )}

          {activeCategory === 'finance' && (
            <>
              {isTabAllowed('cost_manager') && (
                <button
                  id="tab-cost_manager"
                  onClick={() => setActiveTab('cost_manager')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'cost_manager' ? 'bg-[#1C2D5A]/10 text-cyan-900 border border-[#1C2D5A]/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 text-emerald-500 font-bold" /> Cost Management &amp; Invoice Reconciliation
                </button>
              )}
            </>
          )}

          {activeCategory === 'admin' && (
            <>
              {isTabAllowed('master') && (
                <button
                  id="tab-master"
                  onClick={() => setActiveTab('master')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'master' ? 'bg-[#1C2D5A]/10 text-cyan-900 border border-[#1C2D5A]/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <MapPin className="w-4 h-4" /> Master Node Kantor Pos
                </button>
              )}

              {isTabAllowed('vendors') && (
                <button
                  id="tab-vendors"
                  onClick={() => setActiveTab('vendors')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'vendors' ? 'bg-[#1C2D5A]/10 text-cyan-900 border border-[#1C2D5A]/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" /> Vendor Kontrak &amp; Hub Armada
                </button>
              )}

              {isTabAllowed('approval') && (
                <button
                  id="tab-approval"
                  onClick={() => setActiveTab('approval')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'approval' ? 'bg-[#1C2D5A]/10 text-cyan-900 border border-[#1C2D5A]/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FileCheck className="w-4 h-4" /> Alur Approval Workflow
                </button>
              )}

              {isTabAllowed('users') && (
                <button
                  id="tab-users"
                  onClick={() => setActiveTab('users')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === 'users' ? 'bg-[#1C2D5A]/10 text-cyan-900 border border-[#1C2D5A]/20 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" /> Manajemen Otorisasi User
                </button>
              )}
            </>
          )}
        </div>


      </div>

      {/* 3. Main Workspace Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-8">
        
        {/* TAB 1: DASHBOARD & MAP SECTION (Phase 2 National Control Tower) */}
        {activeTab === 'dashboard' && (
          <NationalControlTower
            offices={offices}
            nodes={nodes}
            routes={routes}
            etapes={etapes}
            schedules={schedules}
          />
        )}

        {/* TAB 1.5: DAFTAR RUTE (TOP 100) */}
        {activeTab === 'routes' && (
          <RouteList
            routes={routes}
            offices={offices}
            etapes={etapes}
            schedules={schedules}
            capacities={capacities}
          />
        )}

        {/* TAB 2: DATA MASTER & NODE */}
        {activeTab === 'master' && (
          <DataMasterManager
            offices={offices}
            nodes={nodes}
            onAddOffice={handleAddOffice}
            onToggleTransportNode={handleToggleTransportNode}
            onUpdateNode={handleToggleTransportNode}
          />
        )}

        {/* VENDOR & FLEET MANAGEMENT TAB */}
        {activeTab === 'vendors' && (
          <VendorManager
            vendors={vendors}
            fleets={fleets}
            onSaveVendor={handleSaveVendor}
            onDeleteVendor={handleDeleteVendor}
            onSaveFleet={handleSaveFleet}
            onDeleteFleet={handleDeleteFleet}
            currentRole={currentRole}
          />
        )}

        {/* TAB 3: ROUTE BUILDER WIZARD */}
        {activeTab === 'wizard' && (
          <RouteWizard
            nodes={nodes}
            routes={routes}
            offices={offices}
            onSaveRoute={handleSaveRoute}
          />
        )}

        {/* TAB 4: CAPACITY PLANNER */}
        {activeTab === 'capacity' && (
          <CapacityScheduler
            routes={routes}
            schedules={schedules}
            capacities={capacities}
            offices={offices}
            vendors={vendors}
            fleets={fleets}
            onSaveSchedule={handleSaveSchedule}
            onAllocateCapacity={handleAllocateCapacity}
            onDeleteCapacity={handleDeleteCapacity}
          />
        )}

        {/* TAB 4.5: PROACTIVE CAPACITY PLANNING HUB (PHASE 3) */}
        {activeTab === 'capacity_planning' && (
          <CapacityPlanningHub
            routes={routes}
            schedules={schedules}
            currentUser={currentUser}
          />
        )}

        {/* TAB 5: EXCEL BULK IMPORTER */}
        {activeTab === 'excel' && (
          <ExcelUploadSimulator
            nodes={nodes}
            routes={routes}
            etapes={etapes}
            offices={offices}
            onImportBulk={handleImportBulk}
          />
        )}

        {/* TAB 6: WORKFLOW APPROVALS */}
        {activeTab === 'approval' && (
          <ApprovalWorkflow
            routes={routes}
            offices={offices}
            currentRole={currentRole}
            onChangeRole={changeRoleAndRedirect}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* TAB 7: DATA QUALITY MONITOR */}
        {activeTab === 'quality' && (
          <DataQualityDash
            routes={routes}
            etapes={etapes}
            schedules={schedules}
            capacities={capacities}
            nodes={nodes}
            offices={offices}
          />
        )}

        {/* TAB 8: ARCHITECTURE WIKI DOCUMENTS */}
        {activeTab === 'docs' && (
          <EnterpriseArchitectureDocs />
        )}

        {/* TAB 9: USER ACCESS & PRIVILEGES ADMINISTRATION */}
        {activeTab === 'users' && (
          <UserManager
            users={users}
            offices={offices}
            currentUser={currentUser}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
          />
        )}

        {/* TAB 10: TRANSPORT COST & FINANCE RECONCILIATION */}
        {activeTab === 'cost_manager' && (
          <TransportCostManager
            routes={routes}
            vendors={vendors}
            fleets={fleets}
            offices={offices}
          />
        )}

      </main>

      {/* 4. Footer Segment */}
      <footer className="mt-auto border-t border-slate-200 bg-white p-6 text-center text-xs text-slate-500 font-mono space-y-2 shadow-sm">
        <p className="font-semibold text-slate-700">N22POS Enterprise Logistics Hub • Portfolio Transformation 2026</p>
        <p className="max-w-2xl mx-auto text-[10px] text-slate-500 font-normal leading-relaxed">
          Dirancang untuk mitigasi overlapping schedules, digitalisasi manifest otomatis, dan optimasi load-factor angkutan.
        </p>
      </footer>

      {/* Role and Authentication Selection Dialog Overlay */}
      <RoleLoginModal
        isOpen={isSelectRoleModalOpen}
        onClose={() => setIsSelectRoleModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onSignOut={handleSignOut}
      />

      {/* DBeaver Connection and Setup Guide Overlay */}
      <DBeaverGuideModal
        isOpen={isDBeaverModalOpen}
        onClose={() => setIsDBeaverModalOpen(false)}
      />

    </div>
  );
}
