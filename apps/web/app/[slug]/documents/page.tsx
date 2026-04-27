import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { hasPermission } from '@/lib/utils'
import DocumentsClient from './documents-client'
import { format } from 'date-fns'

export default async function DocumentsPage() {
  const session = await requireAuth()
  const tenantId = session.user.tenantId!
  const canViewAll = hasPermission(session.user.permissions, 'documents', 'read')
  const canManageAll = hasPermission(session.user.permissions, 'documents', 'manage')

  const myEmployee = await prisma.employee.findFirst({
    where: { userId: session.user.id, tenantId },
    select: { id: true, firstName: true, lastName: true },
  })

  const myDocs = myEmployee
    ? await prisma.employeeDocument.findMany({
        where: { employeeId: myEmployee.id },
        orderBy: { uploadedAt: 'desc' },
      })
    : []

  const allEmployees = canViewAll
    ? await prisma.employee.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeCode: true,
          department: { select: { name: true } },
          documents: { orderBy: { uploadedAt: 'desc' } },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      })
    : []

  return (
    <DocumentsClient
      data={{
        employee: myEmployee ? { id: myEmployee.id, name: `${myEmployee.firstName} ${myEmployee.lastName}` } : null,
        canViewAll,
        canManageAll,
        myDocs: myDocs.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          url: d.url,
          size: d.size,
          uploadedAt: format(d.uploadedAt, 'dd MMM yyyy'),
        })),
        allEmployees: allEmployees.map((e) => ({
          id: e.id,
          name: `${e.firstName} ${e.lastName}`,
          code: e.employeeCode,
          department: e.department?.name ?? null,
          documents: e.documents.map((d) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            url: d.url,
            size: d.size,
            uploadedAt: format(d.uploadedAt, 'dd MMM yyyy'),
          })),
        })),
      }}
    />
  )
}
