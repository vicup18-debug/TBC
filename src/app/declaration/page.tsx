import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Landmark, CheckCircle2, XCircle } from 'lucide-react'
import DeclarationForm from './DeclarationForm'

export default async function DeclarationPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: { group: true }
  })

  if (memberships.length === 0) redirect('/setup')

  const group = memberships[0].group

  // Calculate today's date string
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: group.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  const todayString = `${year}-${month}-${day}`

  const declarations = await prisma.financialDeclaration.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' }
  })

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-8 animate-in">
        
        {/* Header */}
        <div>
          <Link href="/dashboard" className="text-sm font-semibold text-gray-500 hover:text-black mb-2 flex items-center gap-1 transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Landmark className="w-8 h-8 text-yellow-500" />
            Financial Declaration
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Track your net worth progression and state your millionaire trajectory.
          </p>
        </div>

        <DeclarationForm todayDateString={todayString} />

        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Historical Declarations</h2>
          
          {declarations.length === 0 ? (
            <div className="text-center py-10 text-gray-500 font-medium">
              No declarations have been made yet.
            </div>
          ) : (
            <div className="space-y-4">
              {declarations.map(dec => (
                <div key={dec.id} className="flex flex-col sm:flex-row gap-6 p-5 rounded-2xl bg-gray-50 border border-gray-100">
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                      {dec.date.toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                    </h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Declared on {dec.createdAt.toLocaleDateString()}
                    </p>
                    
                    {dec.evidenceNote && (
                      <p className="text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-gray-100 text-sm">
                        "{dec.evidenceNote}"
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-4 sm:gap-2 justify-between sm:items-end min-w-[140px]">
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-semibold text-gray-400 uppercase block mb-0.5">Net Worth</span>
                      <span className="font-black text-gray-900 text-xl">
                        {dec.netWorth !== null ? `$${dec.netWorth.toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-semibold text-gray-400 uppercase block mb-0.5">Growth</span>
                      <span className={`font-bold ${dec.cumulativeGrowth && dec.cumulativeGrowth > 0 ? 'text-green-600' : dec.cumulativeGrowth && dec.cumulativeGrowth < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                        {dec.cumulativeGrowth !== null ? `${dec.cumulativeGrowth > 0 ? '+' : ''}$${dec.cumulativeGrowth.toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                    <div className="text-left sm:text-right mt-1">
                      {dec.onTrackForMillionaire ? (
                        <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" /> On Track
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> Off Track
                        </div>
                      )}
                    </div>
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
