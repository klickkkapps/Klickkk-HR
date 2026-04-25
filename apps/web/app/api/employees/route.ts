import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { assertCanActivate } from '@/lib/capacity'
import { z } from 'zod'

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  employeeCode: z.string().min(1),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  locationId: z.string().optional(),
  reportingTo: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN']),
  joiningDate: z.string(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  dateOfBirth: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const page = Number(searchParams.get('page') ?? 1)
  const pageSize = Number(searchParams.get('pageSize') ?? 20)
  const q = searchParams.get('q')
  const status = searchParams.get('status')

  const where = {
    tenantId: session.user.tenantId,
    ...(q ? {
      OR: [
        { firstName: { contains: q, mode: 'insensitive' as const } },
        { lastName: { contains: q, mode: 'insensitive' as const } },
        { email: { contains: q, mode: 'insensitive' as const } },
      ],
    } : {}),
    ...(status ? { status: status as any } : {}),
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: { department: true, designation: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ])

  return NextResponse.json({ employees, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const body = await req.json()
  const parsed = createSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Check capacity before activating
  if (data.status === 'ACTIVE') {
    try {
      await assertCanActivate(tenantId)
    } catch (e: any) {
      return NextResponse.json({ error: e.message, code: 'CAPACITY_EXHAUSTED' }, { status: 403 })
    }
  }

  // Check unique email within tenant
  const existing = await prisma.employee.findUnique({
    where: { tenantId_email: { tenantId, email: data.email } },
  })
  if (existing) {
    return NextResponse.json({ error: 'An employee with this email already exists' }, { status: 409 })
  }

  const employee = await prisma.employee.create({
    data: {
      tenantId,
      employeeCode: data.employeeCode,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      departmentId: data.departmentId || null,
      designationId: data.designationId || null,
      locationId: data.locationId || null,
      reportingTo: data.reportingTo || null,
      employmentType: data.employmentType,
      joiningDate: new Date(data.joiningDate),
      gender: data.gender,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      status: data.status,
    },
  })

  return NextResponse.json(employee, { status: 201 })
}
