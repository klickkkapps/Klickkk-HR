import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const { id } = await params

  const app = await prisma.jobApplication.findFirst({ where: { id, tenantId } })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()

  const updated = await prisma.jobApplication.update({
    where: { id },
    data: {
      status: body.status ?? undefined,
      notes: body.notes ?? undefined,
    },
  })

  return NextResponse.json(updated)
}
