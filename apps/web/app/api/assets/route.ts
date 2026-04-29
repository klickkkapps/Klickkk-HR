import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  name:          z.string().min(1),
  category:      z.string().min(1),
  serialNumber:  z.string().optional(),
  brand:         z.string().optional(),
  model:         z.string().optional(),
  purchaseDate:  z.string().optional(),
  purchasePrice: z.number().int().optional(),
  notes:         z.string().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const { purchaseDate, ...rest } = parsed.data
  const asset = await prisma.asset.create({
    data: {
      ...rest,
      tenantId: session.user.tenantId,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
    },
  })
  return NextResponse.json(asset, { status: 201 })
}
