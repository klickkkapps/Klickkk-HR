import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name:          z.string().min(1).optional(),
  category:      z.string().optional(),
  serialNumber:  z.string().optional(),
  brand:         z.string().optional(),
  model:         z.string().optional(),
  status:        z.enum(['AVAILABLE', 'ASSIGNED', 'UNDER_REPAIR', 'RETIRED']).optional(),
  notes:         z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const result = await prisma.asset.updateMany({
    where: { id, tenantId: session.user.tenantId },
    data: parsed.data,
  })
  if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.asset.deleteMany({ where: { id, tenantId: session.user.tenantId } })
  return NextResponse.json({ ok: true })
}
