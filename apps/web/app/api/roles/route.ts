import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissionIds: z.array(z.string()),
})

export async function GET() {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [systemRoles, tenantRoles, permissions] = await Promise.all([
    prisma.role.findMany({
      where: { isSystem: true },
      include: { rolePermissions: { include: { permission: true } } },
    }),
    prisma.role.findMany({
      where: { tenantId: session.user.tenantId },
      include: { rolePermissions: { include: { permission: true } } },
    }),
    prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] }),
  ])

  return NextResponse.json({ systemRoles, tenantRoles, permissions })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { name, description, permissionIds } = parsed.data

  const role = await prisma.role.create({
    data: {
      tenantId: session.user.tenantId,
      name,
      description,
      rolePermissions: {
        create: permissionIds.map((permissionId) => ({ permissionId })),
      },
    },
    include: { rolePermissions: { include: { permission: true } } },
  })

  return NextResponse.json(role, { status: 201 })
}
