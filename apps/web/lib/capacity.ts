import { prisma } from '@klickkk/db'

export interface CapacityInfo {
  planLimit: number
  extraSlotsPurchased: number
  totalCapacity: number
  usedSlots: number
  availableSlots: number
  canActivate: boolean
}

export async function getTenantCapacity(tenantId: string): Promise<CapacityInfo> {
  const now = new Date()

  const [tenant, activeCount, extraSlots] = await Promise.all([
    prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } }),
    prisma.employee.count({
      where: { tenantId, status: 'ACTIVE' },
    }),
    prisma.subscriptionExtraSlot.aggregate({
      where: {
        tenantId,
        billingCycleStart: { lte: now },
        billingCycleEnd: { gte: now },
      },
      _sum: { slotsPurchased: true },
    }),
  ])

  const planLimit = tenant.planEmployeeLimit
  const extraSlotsPurchased = extraSlots._sum.slotsPurchased ?? 0
  const totalCapacity = planLimit + extraSlotsPurchased
  const usedSlots = activeCount
  const availableSlots = Math.max(0, totalCapacity - usedSlots)

  return {
    planLimit,
    extraSlotsPurchased,
    totalCapacity,
    usedSlots,
    availableSlots,
    canActivate: availableSlots > 0,
  }
}

/** Call before activating an employee. Throws if capacity is exhausted. */
export async function assertCanActivate(tenantId: string): Promise<void> {
  const capacity = await getTenantCapacity(tenantId)
  if (!capacity.canActivate) {
    throw new Error(
      'CAPACITY_EXHAUSTED: No available slots. Please purchase additional employee slots before activating more employees.'
    )
  }
}
