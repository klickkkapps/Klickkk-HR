'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Department, Designation, Location } from '@klickkk/db'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  employeeCode: z.string().min(1, 'Required'),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  locationId: z.string().optional(),
  reportingTo: z.string().optional(),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'INTERN']),
  joiningDate: z.string().min(1, 'Required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
  dateOfBirth: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

type FormData = z.infer<typeof schema>

export function NewEmployeeForm({
  departments,
  designations,
  locations,
  managers,
  nextCode,
  canActivate,
}: {
  departments: Department[]
  designations: Designation[]
  locations: Location[]
  managers: { id: string; firstName: string; lastName: string; employeeCode: string }[]
  nextCode: string
  canActivate: boolean
}) {
  const router = useRouter()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeCode: nextCode,
      employmentType: 'FULL_TIME',
      status: canActivate ? 'ACTIVE' : 'INACTIVE',
    },
  })

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      if (err.code === 'CAPACITY_EXHAUSTED') {
        toast.error('No available slots. Purchase extra slots from Billing.')
        return
      }
      toast.error(err.error ?? 'Failed to create employee')
      return
    }

    const emp = await res.json()
    toast.success(`${data.firstName} ${data.lastName} added successfully`)
    router.push(`/employees/${emp.id}`)
  }

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )

  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const selectClass = "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Info */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name *" error={errors.firstName?.message}>
            <input {...register('firstName')} className={inputClass} placeholder="Ravi" />
          </Field>
          <Field label="Last Name *" error={errors.lastName?.message}>
            <input {...register('lastName')} className={inputClass} placeholder="Sharma" />
          </Field>
          <Field label="Work Email *" error={errors.email?.message}>
            <input {...register('email')} type="email" className={inputClass} placeholder="ravi@company.com" />
          </Field>
          <Field label="Phone" error={errors.phone?.message}>
            <input {...register('phone')} className={inputClass} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
            <input {...register('dateOfBirth')} type="date" className={inputClass} />
          </Field>
          <Field label="Gender" error={errors.gender?.message}>
            <select {...register('gender')} className={selectClass}>
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Job Details */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Job Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Employee Code *" error={errors.employeeCode?.message}>
            <input {...register('employeeCode')} className={inputClass} />
          </Field>
          <Field label="Joining Date *" error={errors.joiningDate?.message}>
            <input {...register('joiningDate')} type="date" className={inputClass} />
          </Field>
          <Field label="Department" error={errors.departmentId?.message}>
            <select {...register('departmentId')} className={selectClass}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Designation" error={errors.designationId?.message}>
            <select {...register('designationId')} className={selectClass}>
              <option value="">Select designation</option>
              {designations.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Location" error={errors.locationId?.message}>
            <select {...register('locationId')} className={selectClass}>
              <option value="">Select location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Reporting Manager" error={errors.reportingTo?.message}>
            <select {...register('reportingTo')} className={selectClass}>
              <option value="">Select manager</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.firstName} {m.lastName} ({m.employeeCode})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Employment Type" error={errors.employmentType?.message}>
            <select {...register('employmentType')} className={selectClass}>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACTOR">Contractor</option>
              <option value="INTERN">Intern</option>
            </select>
          </Field>
          <Field label="Status" error={errors.status?.message}>
            <select {...register('status')} className={selectClass} disabled={!canActivate}>
              <option value="ACTIVE" disabled={!canActivate}>Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            {!canActivate && (
              <p className="text-amber-600 text-xs mt-1">Cannot set Active — no available slots</p>
            )}
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium flex items-center gap-2"
        >
          {isSubmitting && <Loader2 size={15} className="animate-spin" />}
          Add Employee
        </button>
      </div>
    </form>
  )
}
