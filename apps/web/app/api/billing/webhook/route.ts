import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@klickkk/db'
import { verifyWebhookSignature, PLAN_PRICES } from '@/lib/razorpay'
import { createInvoice, buildPlanLineItem } from '@/lib/invoice'
import { addMonths } from 'date-fns'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const event = JSON.parse(body)
  const { event: eventName, payload } = event

  try {
    switch (eventName) {
      case 'subscription.charged':
        await handleSubscriptionCharged(payload.subscription.entity, payload.payment.entity)
        break
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(payload.subscription.entity)
        break
      case 'subscription.activated':
        await handleSubscriptionActivated(payload.subscription.entity)
        break
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity)
        break
    }
  } catch (err: any) {
    console.error(`Webhook handler error for ${eventName}:`, err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleSubscriptionCharged(sub: any, payment: any) {
  const tenantId = sub.notes?.tenantId
  const plan = (sub.notes?.plan ?? 'STARTER') as keyof typeof PLAN_PRICES
  if (!tenantId) return

  const planConfig = PLAN_PRICES[plan]
  const cycleStart = sub.current_start ? new Date(sub.current_start * 1000) : new Date()
  const cycleEnd = sub.current_end ? new Date(sub.current_end * 1000) : addMonths(cycleStart, 1)

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    update: { status: 'ACTIVE', billingCycleStart: cycleStart, billingCycleEnd: cycleEnd },
    create: {
      tenantId,
      plan,
      planEmployeeLimit: planConfig.employeeLimit,
      billingCycleStart: cycleStart,
      billingCycleEnd: cycleEnd,
      status: 'ACTIVE',
      stripeSubscriptionId: sub.id,
      amount: planConfig.amount,
    },
  })

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { plan, planEmployeeLimit: planConfig.employeeLimit },
  })

  // Generate GST invoice for renewal
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (tenant) {
    await createInvoice({
      tenantId,
      lineItems: [buildPlanLineItem(plan, planConfig.amount, planConfig.employeeLimit)],
      supplyType: tenant.supplyType,
      paidAt: new Date(),
    })
  }
}

async function handleSubscriptionCancelled(sub: any) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  })
}

async function handleSubscriptionActivated(sub: any) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: { status: 'ACTIVE' },
  })
}

async function handlePaymentFailed(payment: any) {
  // Log failed payment — could notify tenant admins in a future iteration
  console.warn('Razorpay payment failed:', payment.id, payment.error_description)
}
