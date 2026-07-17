import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import BreachForm from './BreachForm'

export default async function BreachesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const userMembership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    include: { group: true }
  })

  if (!userMembership) redirect('/setup')

  const breaches = await prisma.breach.findMany({
    where: { groupId: userMembership.groupId },
    include: { user: true },
    orderBy: { date: 'desc' }
  })

  const groupMemberships = await prisma.membership.findMany({
    where: { groupId: userMembership.groupId },
    include: { user: true }
  })

  const isAdmin = userMembership.role === 'ACCOUNTABILITY_HOLDER'
  const membersList = groupMemberships.map(m => ({ id: m.user.id, name: m.user.name }))

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 bg-background overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full space-y-8 animate-in">
        
        {/* Header */}
        <div>
          <Link href="/group" className="text-sm font-semibold text-gray-500 hover:text-black mb-2 flex items-center gap-1 transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Group Hub
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            Breach Log
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Official record of covenant forfeitures.
          </p>
        </div>

        {isAdmin && <BreachForm members={membersList} />}

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Historical Forfeitures</h2>
          
          {breaches.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-medium">
              No breaches have been logged yet. The covenant holds strong!
            </div>
          ) : (
            <div className="space-y-4">
              {breaches.map(breach => (
                <div key={breach.id} className="flex gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-red-100 flex items-center justify-center mt-1">
                    <ShieldAlert className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <span className="font-bold text-gray-900 text-lg">{breach.user.name}</span>
                        <p className="text-sm text-gray-500 font-medium">
                          Logged on {breach.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="bg-red-50 text-red-600 font-black px-3 py-1 rounded-full border border-red-100 whitespace-nowrap">
                        - ₦{breach.amount.toLocaleString()}
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                      "{breach.note}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
