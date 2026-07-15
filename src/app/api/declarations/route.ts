import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const declarationSchema = z.object({
  date: z.string(),
  netWorth: z.number().optional().nullable(),
  cumulativeGrowth: z.number().optional().nullable(),
  evidenceNote: z.string().optional().nullable(),
  onTrackForMillionaire: z.boolean().default(false),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = declarationSchema.parse(body)

    const declaration = await prisma.financialDeclaration.create({
      data: {
        userId: session.user.id,
        date: new Date(`${parsed.date}T00:00:00Z`),
        netWorth: parsed.netWorth !== null ? parsed.netWorth : null,
        cumulativeGrowth: parsed.cumulativeGrowth !== null ? parsed.cumulativeGrowth : null,
        evidenceNote: parsed.evidenceNote || null,
        onTrackForMillionaire: parsed.onTrackForMillionaire,
      }
    })

    return NextResponse.json({ declaration })
  } catch (error) {
    console.error('Declaration error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
