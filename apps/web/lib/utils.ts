import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(paise / 100)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

/** Splits a GST-inclusive amount (in paise) into taxable + GST components */
export function splitGst(
  totalPaise: number,
  gstRate = 0.18
): { taxableValue: number; gstAmount: number; cgst: number; sgst: number; igst: number; total: number } {
  const taxableValue = Math.round(totalPaise / (1 + gstRate))
  const gstAmount = totalPaise - taxableValue
  return {
    taxableValue,
    gstAmount,
    cgst: Math.round(gstAmount / 2),
    sgst: Math.round(gstAmount / 2),
    igst: gstAmount,
    total: totalPaise,
  }
}

export function generateInvoiceNumber(sequence: number): string {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  return `INV-${year}${month}-${String(sequence).padStart(5, '0')}`
}

export function generateEmployeeCode(sequence: number, prefix = 'EMP'): string {
  return `${prefix}-${String(sequence).padStart(4, '0')}`
}

export function hasPermission(permissions: string[], resource: string, action: string): boolean {
  return permissions.includes('*') || permissions.includes(`${resource}:${action}`)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
