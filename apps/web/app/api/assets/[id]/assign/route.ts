import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  employeeId: z.string().min(1),
  notes:      z.string().optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const asset = await prisma.asset.findFirst({ where: { id, tenantId: session.user.tenantId } })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (asset.status === 'ASSIGNED') return NextResponse.json({ error: 'Asset is already assigned' }, { status: 409 })

  await prisma.$transaction([
    prisma.assetAssignment.create({
      data: {
        assetId:    id,
        employeeId: parsed.data.employeeId,
        tenantId:   session.user.tenantId,
        notes:      parsed.data.notes,
      },
    }),
    prisma.asset.update({ where: { id }, data: { status: 'ASSIGNED' } }),
  ])

  return NextResponse.json({ ok: true })
}
