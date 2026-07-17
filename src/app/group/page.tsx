import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Users, Brain, Flame, Dumbbell, Coins, Trophy, ShieldAlert, Wallet } from 'lucide-react'

export default async function GroupDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const groupData = await prisma.covenantGroup.findFirst({
    where: {
      memberships: {
        some: { userId: session.user.id }
      }
    },
    include: {
      memberships: {
        include: {
          user: {
            include: {
              pillarLogs: true
            }
          }
        }
      }
    }
  })

  if (!groupData) {
    redirect('/setup')
  }

  const timezone = groupData.timezone
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  const todayDate = new Date(`${year}-${month}-${day}T00:00:00Z`)
  
  const yesterdayDate = new Date(todayDate)
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1)

  const effective = new Date(groupData.effectiveDate)
  effective.setUTCHours(0,0,0,0)

  let daysSinceStart = Math.floor((todayDate.getTime() - effective.getTime()) / (1000 * 60 * 60 * 24)) + 1
  if (daysSinceStart < 1) daysSinceStart = 1 
  
  const totalPossible = daysSinceStart * 4

  const pillars = [
    { id: 'MIND', label: 'Mind', icon: Brain },
    { id: 'SPIRIT', label: 'Spirit', icon: Flame },
    { id: 'BODY', label: 'Body', icon: Dumbbell },
    { id: 'WEALTH', label: 'Wealth', icon: Coins },
  ]

  let totalFund = 0

  const memberStats = groupData.memberships.map(m => {
    totalFund += m.stakeBalance
    const logs = m.user.pillarLogs

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

    const totalCompleted = logs.filter(l => l.completed && l.date.getTime() >= effective.getTime() && l.date.getTime() <= todayDate.getTime()).length
    const complianceRate = Math.round((totalCompleted / totalPossible) * 100) || 0

    // Perfect Streak Calculation
    let perfectStreak = 0
    let checkDateStr = todayDate
    
    // Check if today is a perfect day yet
    const todayCompleted = pillars.every(p => logs.find(l => l.pillar === p.id && l.date.getTime() === todayDate.getTime())?.completed)
    
    if (!todayCompleted) {
      checkDateStr = yesterdayDate
    }

    let currentCheck = new Date(checkDateStr)
    while (true) {
      const isPerfectDay = pillars.every(p => logs.find(l => l.pillar === p.id && l.date.getTime() === currentCheck.getTime())?.completed)
      if (isPerfectDay) {
        perfectStreak++
        currentCheck = new Date(currentCheck)
        currentCheck.setUTCDate(currentCheck.getUTCDate() - 1)
      } else {
        break
      }
    }

    // Rank Calculation
    let rank = 'Cub'
    if (complianceRate >= 96) rank = 'Obi Agu 🦁'
    else if (complianceRate >= 81) rank = 'Warrior ⚔️'
    else if (complianceRate >= 51) rank = 'Hunter 🏹'
    else rank = 'Cub 🐾'

    return {
      user: m.user,
      role: m.role,
      stakeBalance: m.stakeBalance,
      complianceRate,
      streaks,
      perfectStreak,
      rank
    }
  })

  // Sort by compliance descending
  memberStats.sort((a, b) => b.complianceRate - a.complianceRate)

  // Glory & Shame Feed
  const breaches = await prisma.breach.findMany({
    where: { groupId: groupData.id },
    select: {
      id: true,
      type: true,
      amount: true,
      date: true,
      createdAt: true,
      user: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  })

  const logsForFeed = await prisma.pillarLog.findMany({
    where: {
      user: { memberships: { some: { groupId: groupData.id } } },
      completed: true,
      date: { gte: effective } // only logs since group started
    },
    select: {
      id: true,
      pillar: true,
      date: true,
      createdAt: true,
      user: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  })

  const combinedFeed = [
    ...breaches.map(b => ({ ...b, feedType: 'BREACH' as const })),
    ...logsForFeed.map(l => ({ ...l, feedType: 'PILLAR' as const }))
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20)

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 bg-background overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full space-y-8 animate-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold text-gray-500 hover:text-black mb-2 flex items-center gap-1 transition-colors w-fit">
              <ArrowLeft className="w-4 h-4" /> Personal Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-brand-dark" />
              {groupData.name}
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Group accountability and shared stakes.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="bg-gray-900 text-white rounded-2xl p-5 flex flex-col items-center md:items-end justify-center shadow-lg border border-gray-800 w-full sm:w-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand">Total Commitment Fund</span>
              <span className="text-3xl font-black">${totalFund.toLocaleString()}</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link href={`/wallet?groupId=${groupData.id}`} className="flex-1 bg-gray-100 text-gray-900 hover:bg-gray-200 font-bold py-2.5 px-6 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm text-sm">
                <Wallet className="w-4 h-4" /> Wallet
              </Link>
              <Link href="/breaches" className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold py-2.5 px-6 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm text-sm border border-red-100">
                <ShieldAlert className="w-4 h-4" /> Breaches
              </Link>
            </div>
          </div>
        </div>

        {/* Deposit Prompt if Balance is Low */}
        {memberStats.find(m => m.user.id === session.user.id)?.stakeBalance! < groupData.commitmentFundAmount && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <div>
              <h3 className="font-bold text-orange-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Low Stake Balance
              </h3>
              <p className="text-orange-800 text-sm mt-1">Your wallet balance is below the required ${groupData.commitmentFundAmount.toLocaleString()} commitment. Please deposit funds immediately.</p>
            </div>
            <Link href={`/wallet?groupId=${groupData.id}`} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-6 rounded-full transition-all text-sm whitespace-nowrap shadow-md">
              Deposit Funds
            </Link>
          </div>
        )}

        {/* Member Leaderboard */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" /> Leaderboard
          </h2>
          
          <div className="space-y-4">
            {memberStats.map((member, index) => (
              <div key={member.user.id} className={`flex flex-col sm:flex-row gap-6 p-5 sm:p-6 rounded-2xl border ${member.user.id === session.user.id ? 'bg-brand/5 border-brand/20' : 'bg-gray-50/50 border-gray-100'} transition-all`}>
                
                {/* Member Identity & Compliance */}
                <div className="flex items-center gap-5 sm:w-1/3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl shadow-md">
                      {member.user.name.charAt(0).toUpperCase()}
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                        1
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 text-lg">{member.user.name}</h3>
                      {member.user.id === session.user.id && (
                        <span className="bg-brand text-black text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">You</span>
                      )}
                      {member.perfectStreak >= 3 && (
                        <span className="text-orange-500 font-bold text-xs bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-orange-100" title={`${member.perfectStreak} Day Perfect Streak!`}>
                          🔥 {member.perfectStreak}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-1">
                        {member.role === 'ACCOUNTABILITY_HOLDER' && <ShieldAlert className="w-3.5 h-3.5 text-gray-400" />}
                        <span className="text-xs text-gray-500 font-medium">
                          {member.role === 'ACCOUNTABILITY_HOLDER' ? 'Admin' : 'Member'}
                        </span>
                      </div>
                      <span className="text-gray-300 text-xs">•</span>
                      <span className="text-xs font-bold text-gray-700">{member.rank}</span>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex-1 flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-8 justify-between">
                  
                  {/* Compliance Rate */}
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Compliance</span>
                    <span className="text-2xl font-black text-gray-900">{member.complianceRate}%</span>
                  </div>

                  {/* Streaks */}
                  <div className="flex gap-3">
                    {pillars.map(p => {
                      const Icon = p.icon
                      const streak = member.streaks[p.id]
                      return (
                        <div key={p.id} className="flex flex-col items-center" title={`${p.label} Streak`}>
                          <Icon className={`w-4 h-4 mb-1 ${streak > 0 ? 'text-gray-900' : 'text-gray-300'}`} />
                          <span className={`text-sm font-bold ${streak > 0 ? 'text-gray-900' : 'text-gray-400'}`}>{streak}</span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Stake Balance */}
                  <div className="flex flex-col items-end min-w-[80px]">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stake Left</span>
                    <span className={`text-xl font-black ${member.stakeBalance < groupData.commitmentFundAmount ? 'text-red-500' : 'text-gray-900'}`}>
                      ${member.stakeBalance.toLocaleString()}
                    </span>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Glory & Accountability Feed */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" /> Glory & Accountability Feed
          </h2>
          
          {combinedFeed.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-medium">No activity yet. Time to get to work!</div>
          ) : (
            <div className="space-y-4">
              {combinedFeed.map(item => (
                <div key={`${item.feedType}-${item.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                  {item.feedType === 'BREACH' ? (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center flex-shrink-0">
                      {item.pillar === 'MIND' && <Brain className="w-5 h-5 text-brand-dark" />}
                      {item.pillar === 'SPIRIT' && <Flame className="w-5 h-5 text-brand-dark" />}
                      {item.pillar === 'BODY' && <Dumbbell className="w-5 h-5 text-brand-dark" />}
                      {item.pillar === 'WEALTH' && <Coins className="w-5 h-5 text-brand-dark" />}
                    </div>
                  )}
                  
                  <div className="flex-1">
                    {item.feedType === 'BREACH' ? (
                      <p className="text-sm text-gray-900 font-medium">
                        <strong className="font-bold text-red-600">{item.user.name}</strong> forfeited <span className="font-black text-gray-900">${item.amount.toLocaleString()}</span>.
                      </p>
                    ) : (
                      <p className="text-sm text-gray-900 font-medium">
                        <strong className="font-bold">{item.user.name}</strong> completed their {item.pillar} pillar!
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.createdAt.toLocaleDateString()}
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
