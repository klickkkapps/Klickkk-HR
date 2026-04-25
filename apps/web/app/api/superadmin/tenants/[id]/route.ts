import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
  plan: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']).optional(),
  planEmployeeLimit: z.number().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const tenant = await prisma.tenant.update({ where: { id }, data: parsed.data })
  return NextResponse.json(tenant)
}
