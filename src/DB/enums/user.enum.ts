export enum UserRole {
  SuperAdmin = 'Super Admin',
  GeneralManager = 'General Manager',
  FinanceManager = 'Finance Manager',
  ProcurementManager = 'Procurement Manager',
  OperationsManager = 'Operations Manager',
  StoreKeeper = 'Store Keeper',
  ProjectManager = 'Project Manager',
  Employee = 'Employee',
  SafetyOfficer = 'Safety Officer',
  Vendor = 'Vendor',
}

// للتوافق مع الكود القديم
export enum Role {
  requester = 'requester',
  procurement_officer = 'procurement_officer',
  procurement_manager = 'procurement_manager',
  finance_director = 'finance_director',
  ceo = 'ceo',
  store_keeper = 'store_keeper',
  warehouse_manager = 'warehouse_manager',
  admin = 'admin',
}

export enum UserStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Suspended = 'Suspended',
  Pending = 'Pending',
}

export type Permission =
  | 'view:dashboard'
  | 'view:procurement'
  | 'edit:procurement'
  | 'approve:po'
  | 'approve:pr'
  | 'view:inventory'
  | 'edit:inventory'
  | 'view:vendors'
  | 'edit:vendors'
  | 'view:rigs'
  | 'edit:rigs'
  | 'view:timesheets'
  | 'edit:timesheets'
  | 'view:hr'
  | 'edit:hr'
  | 'manage:users'
  | 'manage:roles'
  | 'view:projects'
  | 'edit:projects'
  | 'approve:projects'
  | 'view:finance'
  | 'edit:finance'
  | 'approve:finance'
  | 'view:reports'
  | 'view:settings'
  | 'edit:settings'
  | 'view:assets'
  | 'edit:assets'
  | 'view:hse'
  | 'edit:hse'
  | 'view:recruitment'
  | 'manage:recruitment'
  | 'view:maintenance'
  | 'edit:maintenance'
  | 'view:audit'
  | 'view:vendor_portal'
  | 'submit:vendor_quotation';
