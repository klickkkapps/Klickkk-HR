import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  status:  z.enum(['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']).optional(),
  hrNotes: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const exitReq = await prisma.exitRequest.findFirst({
    where: { id, tenantId: session.user.tenantId },
  })
  if (!exitReq) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.exitRequest.update({
    where: { id },
    data: { ...parsed.data, processedBy: session.user.id },
  })

  // If completed, mark employee as EXITED
  if (parsed.data.status === 'COMPLETED') {
    await prisma.employee.update({
      where: { id: exitReq.employeeId },
      data: { status: 'EXITED', exitDate: exitReq.lastWorkingDay },
    })
  }

  return NextResponse.json(updated)
}
