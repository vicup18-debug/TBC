import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const logInputSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  logs: z.record(z.string(), z.object({
    completed: z.boolean(),
    note: z.string().optional()
  }))
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { date, logs } = logInputSchema.parse(body)
    
    const targetDate = new Date(`${date}T00:00:00Z`)

    // Using transaction to upsert all logs
    const queries = Object.entries(logs).map(([pillar, log]) => {
      return prisma.pillarLog.upsert({
        where: {
          userId_pillar_date: {
            userId: session.user.id,
            pillar,
            date: targetDate,
          }
        },
        update: {
          completed: log.completed,
          note: log.note || null,
        },
        create: {
          userId: session.user.id,
          pillar,
          date: targetDate,
          completed: log.completed,
          note: log.note || null,
        }
      })
    })

    await prisma.$transaction(queries)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
