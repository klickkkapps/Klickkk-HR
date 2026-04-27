import { requireAuth } from '@/lib/session'
import { prisma } from '@klickkk/db'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { EmployeeActions } from '@/components/employees/employee-actions'
import {
  Mail, Phone, MapPin, Calendar, Briefcase, Users, Building2, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default async function EmployeeDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { id, slug } = await params
  const session = await requireAuth()
  const tenantId = session.user.tenantId!

  const employee = await prisma.employee.findFirst({
    where: { id, tenantId },
    include: {
      department: true,
      designation: true,
      location: true,
      reportingManager: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      directReports: { select: { id: true, firstName: true, lastName: true, designation: { select: { name: true } } } },
      documents: true,
    },
  })

  if (!employee) notFound()

  const STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    INACTIVE: 'bg-slate-100 text-slate-600',
    SUSPENDED: 'bg-orange-100 text-orange-700',
    ON_NOTICE: 'bg-amber-100 text-amber-700',
    EXITED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/${slug}/employees`} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{employee.firstName} {employee.lastName}</h1>
          <p className="text-slate-500 text-sm">{employee.employeeCode}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[employee.status]}`}>
            {employee.status.replace('_', ' ')}
          </span>
          <EmployeeActions employeeId={employee.id} currentStatus={employee.status} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Main info */}
        <div className="col-span-2 space-y-5">
          {/* Personal */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Personal Information</h3>
            <div className="space-y-3">
              <InfoRow icon={Mail} label="Email" value={employee.email} />
              <InfoRow icon={Phone} label="Phone" value={employee.phone ?? '—'} />
              <InfoRow icon={Calendar} label="Date of Birth" value={employee.dateOfBirth ? formatDate(employee.dateOfBirth) : '—'} />
              <InfoRow icon={Users} label="Gender" value={employee.gender?.replace('_', ' ') ?? '—'} />
              <InfoRow icon={MapPin} label="Address" value={[employee.address, employee.city, employee.state].filter(Boolean).join(', ') || '—'} />
            </div>
          </div>

          {/* Job */}
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Job Details</h3>
            <div className="space-y-3">
              <InfoRow icon={Building2} label="Department" value={employee.department?.name ?? '—'} />
              <InfoRow icon={Briefcase} label="Designation" value={employee.designation?.name ?? '—'} />
              <InfoRow icon={MapPin} label="Location" value={employee.location?.name ?? '—'} />
              <InfoRow icon={Calendar} label="Joining Date" value={formatDate(employee.joiningDate)} />
              <InfoRow icon={Users} label="Employment Type" value={employee.employmentType.replace('_', ' ')} />
              {employee.reportingManager && (
                <div className="flex gap-3">
                  <span className="text-sm text-slate-500 w-32 flex-shrink-0">Reports To</span>
                  <Link
                    href={`/employees/${employee.reportingManager.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {employee.reportingManager.firstName} {employee.reportingManager.lastName}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900">Documents</h3>
              <button className="text-xs text-blue-600 hover:underline">Upload document</button>
            </div>
            {employee.documents.length === 0 ? (
              <p className="text-sm text-slate-400">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {employee.documents.map((doc) => (
                  <div key={doc.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{doc.name}</div>
                      <div className="text-xs text-slate-500">{doc.type} · {formatDate(doc.uploadedAt)}</div>
                    </div>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Avatar */}
          <div className="bg-white rounded-xl border border-border p-5 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <span className="text-blue-700 font-bold text-2xl">
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            </div>
            <div className="text-center">
              <div className="font-semibold text-slate-900">{employee.firstName} {employee.lastName}</div>
              <div className="text-sm text-slate-500 mt-0.5">{employee.designation?.name ?? '—'}</div>
              <div className="text-xs text-slate-400 mt-1">{employee.employeeCode}</div>
            </div>
          </div>

          {/* Direct reports */}
          {employee.directReports.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Direct Reports ({employee.directReports.length})</h3>
              <div className="space-y-2">
                {employee.directReports.map((r) => (
                  <Link
                    key={r.id}
                    href={`/employees/${r.id}`}
                    className="flex items-center gap-2 hover:bg-slate-50 rounded-lg p-1.5 -mx-1.5"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-slate-600 font-medium text-xs">{r.firstName[0]}{r.lastName[0]}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{r.firstName} {r.lastName}</div>
                      <div className="text-xs text-slate-500">{r.designation?.name ?? '—'}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      <Icon size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
      <span className="text-sm text-slate-500 w-28 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-900">{value}</span>
    </div>
  )
}
