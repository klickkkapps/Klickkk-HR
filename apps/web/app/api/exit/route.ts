import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const DEFAULT_DEPTS = ['IT', 'Finance', 'HR', 'Admin', 'Manager']

const schema = z.object({
  employeeId:     z.string().min(1),
  resignationDate: z.string(),
  lastWorkingDay:  z.string(),
  reason:         z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const existing = await prisma.exitRequest.findUnique({ where: { employeeId: parsed.data.employeeId } })
  if (existing) return NextResponse.json({ error: 'Exit request already exists for this employee' }, { status: 409 })

  const request = await prisma.exitRequest.create({
    data: {
      tenantId:       session.user.tenantId,
      employeeId:     parsed.data.employeeId,
      resignationDate: new Date(parsed.data.resignationDate),
      lastWorkingDay:  new Date(parsed.data.lastWorkingDay),
      reason:         parsed.data.reason,
      clearanceItems: {
        create: DEFAULT_DEPTS.map((dept) => ({ department: dept })),
      },
    },
    include: { clearanceItems: true },
  })

  // Mark employee as ON_NOTICE
  await prisma.employee.update({
    where: { id: parsed.data.employeeId },
    data: { status: 'ON_NOTICE' },
  })

  return NextResponse.json(request, { status: 201 })
}
