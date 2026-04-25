import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SYSTEM_PERMISSIONS = [
  { resource: 'employees', action: 'read' },
  { resource: 'employees', action: 'write' },
  { resource: 'employees', action: 'delete' },
  { resource: 'attendance', action: 'read' },
  { resource: 'attendance', action: 'write' },
  { resource: 'leave', action: 'read' },
  { resource: 'leave', action: 'write' },
  { resource: 'leave', action: 'approve' },
  { resource: 'payroll', action: 'read' },
  { resource: 'payroll', action: 'write' },
  { resource: 'payroll', action: 'run' },
  { resource: 'recruitment', action: 'read' },
  { resource: 'recruitment', action: 'write' },
  { resource: 'performance', action: 'read' },
  { resource: 'performance', action: 'write' },
  { resource: 'reports', action: 'read' },
  { resource: 'billing', action: 'read' },
  { resource: 'billing', action: 'write' },
  { resource: 'settings', action: 'read' },
  { resource: 'settings', action: 'write' },
  { resource: 'roles', action: 'read' },
  { resource: 'roles', action: 'write' },
]

const SYSTEM_ROLES = [
  {
    name: 'HR Admin',
    description: 'Full HR access — manage all employees, payroll, settings',
    permissions: SYSTEM_PERMISSIONS.map((p) => `${p.resource}:${p.action}`),
  },
  {
    name: 'Manager',
    description: 'Manage own team — view employees, approve leave, attendance',
    permissions: [
      'employees:read',
      'attendance:read',
      'attendance:write',
      'leave:read',
      'leave:write',
      'leave:approve',
      'performance:read',
      'performance:write',
      'reports:read',
    ],
  },
  {
    name: 'Employee',
    description: 'Self-service only — view own data, apply for leave',
    permissions: ['employees:read', 'attendance:read', 'leave:read', 'leave:write'],
  },
]

async function main() {
  console.log('Seeding database...')

  // Create all permissions
  for (const perm of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      update: {},
      create: perm,
    })
  }
  console.log(`✓ ${SYSTEM_PERMISSIONS.length} permissions seeded`)

  // Create system roles (tenantId = null → available to all tenants)
  for (const roleData of SYSTEM_ROLES) {
    const { name, description, permissions: permKeys } = roleData

    // System roles have tenantId = null — find by name + isSystem
    let role = await prisma.role.findFirst({ where: { name, isSystem: true, tenantId: null } })
    if (!role) {
      role = await prisma.role.create({
        data: { name, description, isSystem: true, tenantId: null },
      })
    }

    for (const key of permKeys) {
      const [resource, action] = key.split(':')
      const perm = await prisma.permission.findUnique({
        where: { resource_action: { resource, action } },
      })
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        })
      }
    }
  }
  console.log(`✓ ${SYSTEM_ROLES.length} system roles seeded`)

  // Create super admin user
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? 'admin@klickkk.com'
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD ?? 'Admin@123!'

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { email: superAdminEmail, isSuperAdmin: true },
  })

  if (!existingSuperAdmin) {
    const passwordHash = await bcrypt.hash(superAdminPassword, 12)
    await prisma.user.create({
      data: {
        email: superAdminEmail,
        name: 'Super Admin',
        passwordHash,
        isSuperAdmin: true,
        emailVerified: new Date(),
      },
    })
    console.log(`✓ Super admin created: ${superAdminEmail}`)
  } else {
    console.log(`✓ Super admin already exists`)
  }

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
