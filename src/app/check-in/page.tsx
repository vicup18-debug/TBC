import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CheckInForm from './CheckInForm'

export default async function CheckInPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: { group: true }
  })

  if (memberships.length === 0) {
    redirect('/setup')
  }

  const group = memberships[0].group
  const timezone = group.timezone

  // Calculate today's date in group timezone as "YYYY-MM-DD"
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  const todayString = `${year}-${month}-${day}`
  const todayDate = new Date(`${todayString}T00:00:00Z`)

  // Fetch existing logs for today
  const existingLogs = await prisma.pillarLog.findMany({
    where: {
      userId: session.user.id,
      date: todayDate,
    }
  })

  return (
    <div className="flex-1 p-4 md:p-8 bg-background overflow-y-auto">
       <div className="max-w-xl mx-auto">
         <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Check-In</h1>
         <p className="text-gray-500 font-medium mb-8">Logging for {todayString}</p>
         
         <CheckInForm dateString={todayString} initialLogs={existingLogs} />
       </div>
    </div>
  )
}
