import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { UserModelName } from 'src/modules/admin/users/entities/user.model';
import { RoleModelName } from 'src/modules/admin/roles/entities/role.model';
import { PermissionModelName } from 'src/modules/admin/roles/entities/permission.model';

// ─── الأدوار العشرة ──────────────────────────────────────────────────────────
const SYSTEM_ROLES = [
  { name: 'Super Admin',        nameAr: 'المشرف العام',           isSystem: true },
  { name: 'General Manager',    nameAr: 'المدير العام',           isSystem: true },
  { name: 'Finance Manager',    nameAr: 'مدير المالية',           isSystem: true },
  { name: 'Procurement Manager',nameAr: 'مدير المشتريات',         isSystem: true },
  { name: 'Operations Manager', nameAr: 'مدير العمليات',          isSystem: true },
  { name: 'Store Keeper',       nameAr: 'أمين المخزن',            isSystem: true },
  { name: 'Project Manager',    nameAr: 'مدير المشروع',           isSystem: true },
  { name: 'Employee',           nameAr: 'موظف',                   isSystem: true },
  { name: 'Safety Officer',     nameAr: 'مسؤول السلامة',          isSystem: true },
  { name: 'Vendor',             nameAr: 'مورد',                   isSystem: true },
];

// ─── الصلاحيات الكاملة ────────────────────────────────────────────────────────
const ALL_PERMISSIONS = [
  // Dashboard
  { name: 'view:dashboard',         module: 'Dashboard',    action: 'view',   description: 'عرض لوحة التحكم الرئيسية' },
  // Procurement
  { name: 'view:procurement',       module: 'Procurement',  action: 'view',   description: 'عرض طلبات وأوامر الشراء' },
  { name: 'edit:procurement',       module: 'Procurement',  action: 'edit',   description: 'إنشاء وتعديل طلبات الشراء' },
  { name: 'approve:po',             module: 'Procurement',  action: 'approve',description: 'اعتماد أوامر الشراء' },
  { name: 'approve:pr',             module: 'Procurement',  action: 'approve',description: 'اعتماد طلبات الشراء' },
  // Inventory
  { name: 'view:inventory',         module: 'Inventory',    action: 'view',   description: 'عرض المخزون' },
  { name: 'edit:inventory',         module: 'Inventory',    action: 'edit',   description: 'تحديث المخزون والحركات' },
  // Vendors
  { name: 'view:vendors',           module: 'Vendors',      action: 'view',   description: 'عرض بيانات الموردين' },
  { name: 'edit:vendors',           module: 'Vendors',      action: 'edit',   description: 'إضافة وتعديل الموردين' },
  // Rigs
  { name: 'view:rigs',              module: 'Rigs',         action: 'view',   description: 'عرض الحفارات والمعدات' },
  { name: 'edit:rigs',              module: 'Rigs',         action: 'edit',   description: 'إدارة الحفارات والمعدات' },
  // Timesheets
  { name: 'view:timesheets',        module: 'Timesheets',   action: 'view',   description: 'عرض سجلات الوقت' },
  { name: 'edit:timesheets',        module: 'Timesheets',   action: 'edit',   description: 'إدخال وتعديل سجلات الوقت' },
  // HR
  { name: 'view:hr',                module: 'HR',           action: 'view',   description: 'عرض بيانات الموارد البشرية' },
  { name: 'edit:hr',                module: 'HR',           action: 'edit',   description: 'تعديل بيانات الموارد البشرية' },
  // Users & Roles
  { name: 'manage:users',           module: 'Admin',        action: 'manage', description: 'إدارة المستخدمين والحسابات' },
  { name: 'manage:roles',           module: 'Admin',        action: 'manage', description: 'إدارة الأدوار والصلاحيات' },
  // Projects
  { name: 'view:projects',          module: 'Projects',     action: 'view',   description: 'عرض المشاريع' },
  { name: 'edit:projects',          module: 'Projects',     action: 'edit',   description: 'إنشاء وتعديل المشاريع' },
  { name: 'approve:projects',       module: 'Projects',     action: 'approve',description: 'اعتماد المشاريع' },
  // Finance
  { name: 'view:finance',           module: 'Finance',      action: 'view',   description: 'عرض البيانات المالية' },
  { name: 'edit:finance',           module: 'Finance',      action: 'edit',   description: 'إدخال وتعديل البيانات المالية' },
  { name: 'approve:finance',        module: 'Finance',      action: 'approve',description: 'اعتماد المعاملات المالية' },
  // Reports
  { name: 'view:reports',           module: 'Reports',      action: 'view',   description: 'عرض التقارير' },
  // Settings
  { name: 'view:settings',          module: 'Settings',     action: 'view',   description: 'عرض إعدادات النظام' },
  { name: 'edit:settings',          module: 'Settings',     action: 'edit',   description: 'تعديل إعدادات النظام' },
  // Assets
  { name: 'view:assets',            module: 'Assets',       action: 'view',   description: 'عرض الأصول الثابتة' },
  { name: 'edit:assets',            module: 'Assets',       action: 'edit',   description: 'إدارة الأصول الثابتة' },
  // HSE
  { name: 'view:hse',               module: 'HSE',          action: 'view',   description: 'عرض تقارير الصحة والسلامة' },
  { name: 'edit:hse',               module: 'HSE',          action: 'edit',   description: 'إدخال بيانات الصحة والسلامة' },
  // Recruitment
  { name: 'view:recruitment',       module: 'Recruitment',  action: 'view',   description: 'عرض طلبات التوظيف' },
  { name: 'manage:recruitment',     module: 'Recruitment',  action: 'manage', description: 'إدارة عملية التوظيف' },
  // Maintenance
  { name: 'view:maintenance',       module: 'Maintenance',  action: 'view',   description: 'عرض أوامر الصيانة' },
  { name: 'edit:maintenance',       module: 'Maintenance',  action: 'edit',   description: 'إنشاء وتعديل أوامر الصيانة' },
  // Audit
  { name: 'view:audit',             module: 'Audit',        action: 'view',   description: 'عرض سجل التدقيق' },
  // Vendor Portal
  { name: 'view:vendor_portal',     module: 'Vendor',       action: 'view',   description: 'الوصول لبوابة الموردين' },
  { name: 'submit:vendor_quotation',module: 'Vendor',       action: 'submit', description: 'تقديم عروض أسعار' },
];

// ─── توزيع الصلاحيات على الأدوار ─────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Super Admin': ALL_PERMISSIONS.map((p) => p.name),

  'General Manager': [
    'view:dashboard','view:procurement','approve:po','approve:pr',
    'view:inventory','view:vendors','view:rigs','view:projects','approve:projects',
    'view:finance','approve:finance','view:reports','view:hr','view:settings',
    'view:assets','view:hse','view:recruitment','view:maintenance','view:audit',
    'manage:users',
  ],

  'Finance Manager': [
    'view:dashboard','view:procurement','view:inventory','view:finance',
    'edit:finance','approve:finance','view:reports','view:audit',
  ],

  'Procurement Manager': [
    'view:dashboard','view:procurement','edit:procurement','approve:pr',
    'view:inventory','view:vendors','edit:vendors','view:reports',
  ],

  'Operations Manager': [
    'view:dashboard','view:procurement','view:inventory','edit:inventory',
    'view:rigs','edit:rigs','view:projects','edit:projects','view:maintenance',
    'edit:maintenance','view:reports',
  ],

  'Store Keeper': [
    'view:dashboard','view:inventory','edit:inventory','view:procurement',
  ],

  'Project Manager': [
    'view:dashboard','view:projects','edit:projects','view:inventory',
    'view:timesheets','edit:timesheets','view:reports',
  ],

  'Employee': [
    'view:dashboard','view:timesheets','edit:timesheets',
  ],

  'Safety Officer': [
    'view:dashboard','view:hse','edit:hse','view:rigs','view:reports',
  ],

  'Vendor': [
    'view:vendor_portal','submit:vendor_quotation',
  ],
};

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    @InjectModel(UserModelName) private userModel: Model<any>,
    @InjectModel(RoleModelName) private roleModel: Model<any>,
    @InjectModel(PermissionModelName) private permissionModel: Model<any>,
    @InjectConnection() private connection: Connection,
  ) {}

  async onApplicationBootstrap() {
    await this.seed();
  }

  async seed() {
    try {
      this.logger.log('🌱 Running database seeder...');

      // 1. بذر الصلاحيات
      const permissionMap = await this.seedPermissions();

      // 2. بذر الأدوار
      const roleMap = await this.seedRoles(permissionMap);

      // 3. بذر مستخدم Super Admin
      await this.seedSuperAdmin(roleMap);

      this.logger.log('✅ Seeder completed successfully.');
    } catch (err) {
      this.logger.error('❌ Seeder failed:', err);
    }
  }

  private async seedPermissions(): Promise<Map<string, Types.ObjectId>> {
    const permMap = new Map<string, Types.ObjectId>();

    for (const perm of ALL_PERMISSIONS) {
      let existing = await this.permissionModel.findOne({ name: perm.name });
      if (!existing) {
        existing = await this.permissionModel.create(perm);
        this.logger.debug(`  Created permission: ${perm.name}`);
      }
      permMap.set(perm.name, existing._id);
    }

    this.logger.log(`  ✔ ${ALL_PERMISSIONS.length} permissions ensured.`);
    return permMap;
  }

  private async seedRoles(permMap: Map<string, Types.ObjectId>): Promise<Map<string, Types.ObjectId>> {
    const roleMap = new Map<string, Types.ObjectId>();

    for (const roleDef of SYSTEM_ROLES) {
      const permNames = ROLE_PERMISSIONS[roleDef.name] || [];
      const permIds = permNames
        .map((n) => permMap.get(n))
        .filter(Boolean) as Types.ObjectId[];

      let role = await this.roleModel.findOne({ name: roleDef.name });
      if (!role) {
        role = await this.roleModel.create({ ...roleDef, permissions: permIds });
        this.logger.debug(`  Created role: ${roleDef.name} (${permIds.length} permissions)`);
      } else {
        await this.roleModel.updateOne({ _id: role._id }, { $set: { permissions: permIds } });
      }
      roleMap.set(roleDef.name, role._id);
    }

    this.logger.log(`  ✔ ${SYSTEM_ROLES.length} roles ensured.`);
    return roleMap;
  }

  private async seedSuperAdmin(roleMap: Map<string, Types.ObjectId>) {
    const superAdminRole = roleMap.get('Super Admin');
    if (!superAdminRole) {
      this.logger.error('Super Admin role not found!');
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@petroflow.com';

    // التحقق بالـ username أو الـ email لتجنب تكرار البذر عند إعادة التشغيل
    const adminExists = await this.userModel.findOne({
      $or: [{ username: 'superadmin' }, { email: adminEmail }],
    });

    if (adminExists) {
      // تحديث الـ roleId للمستخدم الموجود ليكون Super Admin
      await this.userModel.updateOne(
        { _id: adminExists._id },
        { $set: { roleId: superAdminRole, status: 'Active' } },
      );
      this.logger.log('  ✔ Super Admin user already exists — role updated to Super Admin.');
      return;
    }

    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    await this.userModel.create({
      username: 'superadmin',
      email: adminEmail,
      fullName: 'Super Administrator',
      fullNameAr: 'المشرف العام',
      passwordHash,
      roleId: superAdminRole,
      status: 'Active',
      mustChangePassword: false,
    });

    this.logger.log('  ✔ Super Admin user created.');
    this.logger.log(`  🔑 Default credentials → username: superadmin | password: ${defaultPassword}`);
  }
}
