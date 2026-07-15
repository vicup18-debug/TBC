import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const joinGroupSchema = z.object({
  inviteCode: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { inviteCode } = joinGroupSchema.parse(body)

    const group = await prisma.covenantGroup.findUnique({
      where: { inviteCode }
    })

    if (!group) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: group.id,
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'You are already a member of this group' }, { status: 409 })
    }

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        userId: session.user.id,
        groupId: group.id,
        role: 'MEMBER',
        stakeBalance: group.commitmentFundAmount,
      }
    })

    return NextResponse.json({ group, membership })
  } catch (error) {
    console.error('Join group error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
