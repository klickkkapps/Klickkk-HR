import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { slugify } from '@/lib/utils'
import { PLAN_PRICES } from '@/lib/razorpay'
import { addDays } from 'date-fns'

const schema = z.object({
  companyName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  plan: z.enum(['STARTER', 'GROWTH']),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { companyName, name, email, password, plan } = parsed.data

  // Check if email already registered
  const existing = await prisma.user.findFirst({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const slug = await generateUniqueSlug(companyName)
  const passwordHash = await bcrypt.hash(password, 12)
  const planConfig = PLAN_PRICES[plan]
  const now = new Date()
  const trialEndsAt = addDays(now, 7)

  const result = await prisma.$transaction(async (tx) => {
    // Create tenant
    const tenant = await tx.tenant.create({
      data: {
        name: companyName,
        slug,
        plan,
        planEmployeeLimit: planConfig.employeeLimit,
        onboardingStatus: 'IN_PROGRESS',
      },
    })

    // Create admin user
    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email,
        name,
        passwordHash,
        emailVerified: new Date(),
        isActive: true,
      },
    })

    // Assign HR Admin role to first user
    const hrAdminRole = await tx.role.findFirst({ where: { name: 'HR Admin', isSystem: true } })
    if (hrAdminRole) {
      await tx.userRole.create({ data: { userId: user.id, roleId: hrAdminRole.id } })
    }

    // Create trial subscription
    await tx.subscription.create({
      data: {
        tenantId: tenant.id,
        plan,
        planEmployeeLimit: planConfig.employeeLimit,
        billingCycleStart: now,
        billingCycleEnd: trialEndsAt,
        status: 'TRIALING',
        amount: planConfig.amount,
        trialEndsAt,
      },
    })

    return { tenant, user }
  })

  return NextResponse.json(
    { message: 'Account created successfully', tenantSlug: result.tenant.slug },
    { status: 201 }
  )
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name)
  let slug = base
  let counter = 1

  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`
  }

  return slug
}
