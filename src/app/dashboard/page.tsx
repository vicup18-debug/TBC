import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowRight, Brain, Flame, Dumbbell, Coins, Users, CheckCircle2, Lock, Landmark } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: { group: true },
  })

  if (memberships.length === 0) {
    redirect('/setup')
  }

  const membership = memberships[0]
  const currentGroup = membership.group
  const timezone = currentGroup.timezone

  // Timezone math
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  const todayString = `${year}-${month}-${day}`
  const todayDate = new Date(`${todayString}T00:00:00Z`)
  
  const yesterdayDate = new Date(todayDate)
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1)

  // Fetch all user logs
  const logs = await prisma.pillarLog.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
  })

  const pillars = [
    { id: 'MIND', label: 'Mind', icon: Brain },
    { id: 'SPIRIT', label: 'Spirit', icon: Flame },
    { id: 'BODY', label: 'Body', icon: Dumbbell },
    { id: 'WEALTH', label: 'Wealth', icon: Coins },
  ]

  // Calculate streaks
  const streaks: Record<string, number> = {}
  pillars.forEach(p => {
    let streak = 0
    const todayLog = logs.find(l => l.pillar === p.id && l.date.getTime() === todayDate.getTime())
    const yesterdayLog = logs.find(l => l.pillar === p.id && l.date.getTime() === yesterdayDate.getTime())
    
    let checkDate = todayDate
    
    if (!todayLog?.completed) {
       if (!yesterdayLog?.completed) {
          streaks[p.id] = 0
          return
       }
       checkDate = yesterdayDate
    }

    let currentCheck = new Date(checkDate)
    while (true) {
       const log = logs.find(l => l.pillar === p.id && l.date.getTime() === currentCheck.getTime())
       if (log?.completed) {
          streak++
          currentCheck = new Date(currentCheck)
          currentCheck.setUTCDate(currentCheck.getUTCDate() - 1)
       } else {
          break
       }
    }
    streaks[p.id] = streak
  })

  // Calculate Compliance Rate
  const effective = new Date(currentGroup.effectiveDate)
  effective.setUTCHours(0,0,0,0)

  let daysSinceStart = Math.floor((todayDate.getTime() - effective.getTime()) / (1000 * 60 * 60 * 24)) + 1
  if (daysSinceStart < 1) daysSinceStart = 1 
  
  const totalPossible = daysSinceStart * 4
  const totalCompleted = logs.filter(l => l.completed && l.date.getTime() >= effective.getTime() && l.date.getTime() <= todayDate.getTime()).length
  const complianceRate = Math.round((totalCompleted / totalPossible) * 100) || 0

  // Recent private notes
  const recentLogsWithNotes = logs.filter(l => l.note && l.note.trim() !== '').slice(0, 5)

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 bg-background overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-8 animate-in">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Personal Dashboard</h1>
            <p className="text-gray-500 font-medium mt-1">
              Welcome back, {session.user.name}. You're viewing your private stats.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/declaration" className="bg-white border border-gray-200 hover:border-gray-300 text-gray-900 font-bold py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm">
              <Landmark className="w-5 h-5 text-yellow-600" /> Wealth
            </Link>
            <Link href="/group" className="bg-white border border-gray-200 hover:border-gray-300 text-gray-900 font-bold py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm">
              <Users className="w-5 h-5" /> Group Hub
            </Link>
            <Link href="/check-in" className="bg-brand hover:bg-brand-dark text-black font-bold py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm group">
              Log Progress <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col justify-center items-center text-center">
            <div className="w-24 h-24 rounded-full border-8 border-gray-100 flex items-center justify-center relative mb-4">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gray-100" />
                <circle cx="50" cy="50" r="46" fill="transparent" stroke="#CCFF00" strokeWidth="8" strokeDasharray={`${(complianceRate / 100) * 289} 289`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              </svg>
              <span className="text-2xl font-black text-gray-900">{complianceRate}%</span>
            </div>
            <h3 className="font-bold text-gray-900">Compliance Rate</h3>
            <p className="text-sm text-gray-500">Overall adherence since start</p>
          </div>

          <div className="md:col-span-2 bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 text-lg">Current Streaks</h3>
              <Flame className="w-5 h-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {pillars.map(pillar => {
                const Icon = pillar.icon
                const currentStreak = streaks[pillar.id]
                return (
                  <div key={pillar.id} className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center text-center border border-gray-100">
                    <div className="h-10 w-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-gray-700" />
                    </div>
                    <span className="text-2xl font-black text-gray-900">{currentStreak}</span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{pillar.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Private Activity & Invite Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Private Journal */}
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 text-lg">Private Journal</h3>
              <Lock className="w-5 h-5 text-gray-400" />
            </div>
            {recentLogsWithNotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No recent notes found. Add notes during your daily check-in to see them here!
              </div>
            ) : (
              <div className="space-y-4">
                {recentLogsWithNotes.map(log => {
                  const pillarConfig = pillars.find(p => p.id === log.pillar)
                  const Icon = pillarConfig?.icon || CheckCircle2
                  return (
                    <div key={log.id} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-brand/20 flex items-center justify-center mt-1">
                        <Icon className="w-5 h-5 text-gray-900" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">{pillarConfig?.label}</span>
                          <span className="text-xs font-medium text-gray-400">
                            {log.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          "{log.note}"
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Group Info */}
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col">
            <h3 className="font-bold text-gray-900 text-lg mb-6">Group Info</h3>
            
            <div className="bg-gray-900 rounded-2xl p-6 flex flex-col items-center text-center text-white mb-6 flex-1 justify-center">
              <p className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Group Invite Code</p>
              <div className="text-4xl font-black tracking-[0.25em] mb-4 text-brand">
                {currentGroup.inviteCode}
              </div>
              <p className="text-sm text-gray-400 max-w-sm">
                Share this code to invite others to <strong>{currentGroup.name}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Stake</p>
                <p className="text-xl font-black text-gray-900">₦{membership.stakeBalance.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 font-semibold mb-1 uppercase">Role</p>
                <p className="text-sm font-black text-gray-900 mt-1">{membership.role === 'ACCOUNTABILITY_HOLDER' ? 'Admin' : 'Member'}</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
