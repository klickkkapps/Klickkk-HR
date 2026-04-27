import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma, ExpenseStatus } from '@klickkk/db'

export async function GET(req: Request) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === 'true'

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true },
  })

  const allStatuses: ExpenseStatus[] = ['SUBMITTED', 'APPROVED', 'REJECTED', 'PAID']
  const where = all
    ? { tenantId, status: { in: allStatuses } }
    : { tenantId, employeeId: employee?.id ?? '__none__' }

  const claims = await prisma.expenseClaim.findMany({
    where,
    include: {
      category: { select: { name: true } },
      employee: { select: { firstName: true, lastName: true, employeeCode: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(claims)
}

export async function POST(req: Request) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const employee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true },
  })

  if (!employee) {
    return NextResponse.json({ error: 'No employee profile linked to your account' }, { status: 400 })
  }

  const body = await req.json()
  if (!body.categoryId || !body.amount || !body.date || !body.description) {
    return NextResponse.json({ error: 'categoryId, amount, date and description are required' }, { status: 400 })
  }

  const claim = await prisma.expenseClaim.create({
    data: {
      tenantId,
      employeeId: employee.id,
      categoryId: body.categoryId,
      amount: Math.round(Number(body.amount) * 100),
      date: new Date(body.date),
      description: body.description,
      receiptUrl: body.receiptUrl ?? null,
      status: 'SUBMITTED',
    },
  })

  return NextResponse.json(claim, { status: 201 })
}
