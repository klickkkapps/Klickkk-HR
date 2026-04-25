import { prisma, SupplyType } from '@klickkk/db'
import { splitGst, generateInvoiceNumber } from './utils'

interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number // paise, GST incl.
  taxableValue: number
  gstRate: number
  gstAmount: number
  total: number // paise, GST incl.
}

interface CreateInvoiceParams {
  tenantId: string
  lineItems: InvoiceLineItem[]
  supplyType?: SupplyType
  paidAt?: Date
}

export async function createInvoice(params: CreateInvoiceParams) {
  const { tenantId, lineItems, supplyType = SupplyType.INTRA_STATE, paidAt } = params

  const total = lineItems.reduce((sum, li) => sum + li.total, 0)
  const taxableValue = lineItems.reduce((sum, li) => sum + li.taxableValue, 0)
  const totalGst = total - taxableValue

  const isIntraState = supplyType === SupplyType.INTRA_STATE

  // Get next sequence for invoice number
  const count = await prisma.invoice.count({ where: { tenantId } })
  const invoiceNumber = generateInvoiceNumber(count + 1)

  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { gstin: true },
  })

  return prisma.invoice.create({
    data: {
      tenantId,
      invoiceNumber,
      lineItems: lineItems as any,
      taxableValue,
      cgst: isIntraState ? Math.round(totalGst / 2) : 0,
      sgst: isIntraState ? Math.round(totalGst / 2) : 0,
      igst: !isIntraState ? totalGst : 0,
      total,
      customerGstin: tenant.gstin,
      supplyType,
      status: 'PAID',
      paidAt: paidAt ?? new Date(),
    },
  })
}

export function buildPlanLineItem(plan: string, amount: number, employeeLimit: number): InvoiceLineItem {
  const { taxableValue, gstAmount } = splitGst(amount)
  return {
    description: `${plan} Plan — up to ${employeeLimit} active employees (1 month)`,
    quantity: 1,
    unitPrice: amount,
    taxableValue,
    gstRate: 18,
    gstAmount,
    total: amount,
  }
}

export function buildExtraSlotLineItem(slots: number): InvoiceLineItem {
  const unitPricePaise = 4900
  const totalPaise = slots * unitPricePaise
  const { taxableValue, gstAmount } = splitGst(totalPaise)
  return {
    description: `Prepaid Extra Employee Slots × ${slots} (₹49/slot, GST incl.)`,
    quantity: slots,
    unitPrice: unitPricePaise,
    taxableValue,
    gstRate: 18,
    gstAmount,
    total: totalPaise,
  }
}
