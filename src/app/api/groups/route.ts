import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const createGroupSchema = z.object({
  name: z.string().min(2),
  effectiveDate: z.string(),
  reviewDate: z.string(),
  commitmentFundAmount: z.number().min(0),
  timezone: z.string().default('Africa/Lagos'),
})

// Generate a random 8-character invite code
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = createGroupSchema.parse(body)

    // Generate unique code (extremely low chance of collision, but handle gracefully in production)
    const inviteCode = generateInviteCode()

    const group = await prisma.covenantGroup.create({
      data: {
        name: parsed.name,
        effectiveDate: new Date(parsed.effectiveDate),
        reviewDate: new Date(parsed.reviewDate),
        commitmentFundAmount: parsed.commitmentFundAmount,
        timezone: parsed.timezone,
        inviteCode,
        memberships: {
          create: {
            userId: session.user.id,
            role: 'ACCOUNTABILITY_HOLDER', // Creator is initially the accountability holder
            stakeBalance: parsed.commitmentFundAmount,
          }
        }
      }
    })

    return NextResponse.json({ group })
  } catch (error) {
    console.error('Create group error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
