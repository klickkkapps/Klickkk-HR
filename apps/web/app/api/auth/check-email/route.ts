import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ exists: false })

  const user = await prisma.user.findFirst({
    where: { email, isSuperAdmin: false },
    select: { id: true },
  })

  return NextResponse.json({ exists: !!user })
}
