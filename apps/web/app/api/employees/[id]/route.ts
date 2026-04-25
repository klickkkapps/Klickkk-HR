import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { auth } from '@/lib/auth'
import { assertCanActivate } from '@/lib/capacity'
import { z } from 'zod'

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  designationId: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
  reportingTo: z.string().nullable().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ON_NOTICE', 'EXITED']).optional(),
  exitDate: z.string().nullable().optional(),
  exitReason: z.string().nullable().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  panNumber: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  bankAccountNumber: z.string().nullable().optional(),
  bankIfscCode: z.string().nullable().optional(),
  bankAccountHolderName: z.string().nullable().optional(),
  noticePeriodDays: z.number().optional(),
})

async function getEmployee(id: string, tenantId: string) {
  return prisma.employee.findFirst({
    where: { id, tenantId },
    include: {
      department: true,
      designation: true,
      location: true,
      reportingManager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      directReports: { select: { id: true, firstName: true, lastName: true, designation: true } },
      documents: true,
    },
  })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employee = await getEmployee(id, session.user.tenantId)
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(employee)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tenantId = session.user.tenantId
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const data = parsed.data

  // Capacity check when re-activating
  if (data.status === 'ACTIVE') {
    const current = await prisma.employee.findFirst({ where: { id, tenantId } })
    if (current && current.status !== 'ACTIVE') {
      try {
        await assertCanActivate(tenantId)
      } catch (e: any) {
        return NextResponse.json({ error: e.message, code: 'CAPACITY_EXHAUSTED' }, { status: 403 })
      }
    }
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : data.dateOfBirth,
      exitDate: data.exitDate ? new Date(data.exitDate) : data.exitDate,
    },
  })

  return NextResponse.json(employee)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Soft delete — mark as EXITED
  const employee = await prisma.employee.update({
    where: { id },
    data: { status: 'EXITED', exitDate: new Date() },
  })

  return NextResponse.json(employee)
}
