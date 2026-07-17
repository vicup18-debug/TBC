import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const breachSchema = z.object({
  userId: z.string(),
  amountForfeited: z.number().min(1),
  reason: z.string().min(2),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Find the group the current user belongs to and check if they are the admin
    const adminMembership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { group: true }
    })

    if (!adminMembership || adminMembership.role !== 'ACCOUNTABILITY_HOLDER') {
       return NextResponse.json({ error: 'Only the Accountability Holder can log a breach' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, amountForfeited, reason } = breachSchema.parse(body)

    // Ensure the target user is in the same group
    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: adminMembership.groupId
        }
      }
    })

    if (!targetMembership) {
      return NextResponse.json({ error: 'Target user is not in the group' }, { status: 400 })
    }

    // Transaction: Create breach log, decrement stake balance, and record penalty in wallet ledger
    await prisma.$transaction([
      prisma.breach.create({
        data: {
          groupId: adminMembership.groupId,
          userId,
          amount: amountForfeited,
          note: reason,
          type: 'FORFEITURE',
          date: new Date(),
        }
      }),
      prisma.membership.update({
        where: {
          userId_groupId: {
            userId,
            groupId: adminMembership.groupId,
          }
        },
        data: {
          stakeBalance: { decrement: amountForfeited }
        }
      }),
      prisma.walletTransaction.create({
        data: {
          userId,
          groupId: adminMembership.groupId,
          amount: amountForfeited,
          type: 'PENALTY',
          status: 'SUCCESS'
        }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Log breach error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
