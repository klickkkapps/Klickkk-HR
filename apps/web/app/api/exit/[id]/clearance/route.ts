import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  itemId:  z.string().min(1),
  cleared: z.boolean(),
  remarks: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  // Verify the exit request belongs to this tenant
  const exitReq = await prisma.exitRequest.findFirst({ where: { id, tenantId: session.user.tenantId } })
  if (!exitReq) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.exitClearanceItem.update({
    where: { id: parsed.data.itemId },
    data: {
      cleared:   parsed.data.cleared,
      clearedBy: session.user.id,
      clearedAt: parsed.data.cleared ? new Date() : null,
      remarks:   parsed.data.remarks,
    },
  })

  // Check if all items cleared → auto-move to IN_PROGRESS or COMPLETED
  const allItems = await prisma.exitClearanceItem.findMany({ where: { exitRequestId: id } })
  if (allItems.every((item) => item.cleared)) {
    await prisma.exitRequest.update({ where: { id }, data: { status: 'IN_PROGRESS' } })
  }

  return NextResponse.json({ ok: true })
}
