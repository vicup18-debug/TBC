import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Wallet, TrendingDown, TrendingUp, History } from 'lucide-react'
import DepositForm from './DepositForm'

export default async function WalletPage({
  searchParams
}: {
  searchParams: { groupId?: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const groupId = searchParams.groupId

  if (!groupId) {
    redirect('/group') // Redirect back if no group provided
  }

  // Fetch group and membership
  const membership = await prisma.membership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
    include: { group: true }
  })

  if (!membership) {
    redirect('/group')
  }

  const transactions = await prisma.walletTransaction.findMany({
    where: { userId: session.user.id, groupId },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 bg-gray-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-8 animate-in">
        
        {/* Header */}
        <div>
          <Link href="/group" className="text-sm font-semibold text-gray-500 hover:text-black mb-4 flex items-center gap-1 transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Back to Group
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Wallet className="w-8 h-8 text-brand-dark" />
            Wallet & Ledger
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Manage your stakes for {membership.group.name}.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Form & Stats */}
          <div className="space-y-8">
            <div className="bg-gray-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 rounded-bl-full blur-2xl" />
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Stake Balance</p>
              <h2 className="text-4xl font-black text-brand mb-4">${membership.stakeBalance.toLocaleString()}</h2>
              <p className="text-sm text-gray-300">
                Required Group Commitment: <strong className="text-white">${membership.group.commitmentFundAmount.toLocaleString()}</strong>
              </p>
            </div>

            <DepositForm 
              groupId={groupId} 
              currentBalance={membership.stakeBalance} 
              requiredBalance={membership.group.commitmentFundAmount} 
            />
          </div>

          {/* Right Column: Transaction History */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col h-full">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-gray-400" /> Transaction Ledger
            </h3>
            
            {transactions.length === 0 ? (
              <div className="text-center py-10 text-gray-500 font-medium">
                No transactions yet.
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-2 max-h-[500px]">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-brand/20 text-brand-dark' : 'bg-red-100 text-red-600'}`}>
                        {tx.type === 'DEPOSIT' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {tx.type === 'DEPOSIT' ? 'Stake Deposit' : 'Forfeiture Penalty'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {tx.createdAt.toLocaleDateString()} • {tx.createdAt.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <span className={`font-black ${tx.type === 'DEPOSIT' ? 'text-gray-900' : 'text-red-600'}`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}${tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
