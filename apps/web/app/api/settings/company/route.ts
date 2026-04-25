import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  supplyType: z.enum(['INTRA_STATE', 'INTER_STATE']).optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const tenant = await prisma.tenant.update({
    where: { id: session.user.tenantId },
    data: parsed.data,
  })

  return NextResponse.json(tenant)
}
