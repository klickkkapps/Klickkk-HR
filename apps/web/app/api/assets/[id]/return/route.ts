import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const assignment = await prisma.assetAssignment.findFirst({
    where: { assetId: id, returnedAt: null },
  })
  if (!assignment) return NextResponse.json({ error: 'No active assignment' }, { status: 404 })

  await prisma.$transaction([
    prisma.assetAssignment.update({
      where: { id: assignment.id },
      data: { returnedAt: new Date() },
    }),
    prisma.asset.update({ where: { id }, data: { status: 'AVAILABLE' } }),
  ])

  return NextResponse.json({ ok: true })
}
