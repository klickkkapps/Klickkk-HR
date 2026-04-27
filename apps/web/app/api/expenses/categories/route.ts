import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'

export async function GET() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const categories = await prisma.expenseCategory.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(categories)
}

export async function POST(req: Request) {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const body = await req.json()

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const category = await prisma.expenseCategory.create({
    data: { tenantId, name: body.name.trim(), description: body.description ?? null },
  })

  return NextResponse.json(category, { status: 201 })
}
