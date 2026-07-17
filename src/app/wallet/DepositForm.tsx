'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Coins, AlertCircle, ArrowRight } from 'lucide-react'

export default function DepositForm({ groupId, currentBalance, requiredBalance }: { groupId: string, currentBalance: number, requiredBalance: number }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState<number>(Math.max(0, requiredBalance - currentBalance) || 5000)
  const [error, setError] = useState('')

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, amount }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to deposit funds')
      }

      router.refresh()
      router.push('/group')
    } catch (err: any) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleDeposit} className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-bl-full -z-10" />
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-brand/20 flex items-center justify-center text-brand-dark">
          <Coins className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Deposit Funds</h2>
          <p className="text-sm text-gray-500 font-medium">Add to your covenant stake</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 pl-1">Amount to Deposit ($)</label>
          <input 
            type="number" 
            min="1"
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-4 py-4 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-brand focus:ring-1 focus:ring-brand outline-none text-lg font-bold text-gray-900" 
          />
          {currentBalance < requiredBalance && (
            <p className="text-xs text-orange-600 font-medium pl-1 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" />
              You need ${(requiredBalance - currentBalance).toLocaleString()} more to meet the group requirement.
            </p>
          )}
        </div>

        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl font-medium">{error}</div>}

        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full bg-black hover:bg-gray-900 text-brand font-bold py-4 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 mt-4"
        >
          {isSubmitting ? 'Processing...' : 'Simulate Deposit'}
          {!isSubmitting && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </form>
  )
}
