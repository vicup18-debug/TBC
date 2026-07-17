import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const depositSchema = z.object({
  groupId: z.string(),
  amount: z.number().min(1),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { groupId, amount } = depositSchema.parse(body)

    const membership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 })
    }

    // Atomic transaction: log deposit, increase stake balance
    await prisma.$transaction([
      prisma.walletTransaction.create({
        data: {
          userId: session.user.id,
          groupId,
          amount,
          type: 'DEPOSIT',
          status: 'SUCCESS',
          reference: `SIMULATED_${Date.now()}`
        }
      }),
      prisma.membership.update({
        where: {
          userId_groupId: {
            userId: session.user.id,
            groupId
          }
        },
        data: {
          stakeBalance: { increment: amount }
        }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Deposit error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
