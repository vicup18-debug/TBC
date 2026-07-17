'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertOctagon } from 'lucide-react'

export default function BreachForm({ members }: { members: { id: string, name: string }[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/breaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: formData.get('userId'),
          amountForfeited: Number(formData.get('amountForfeited')),
          reason: formData.get('reason'),
        })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to log breach')
      }
      e.currentTarget.reset()
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-red-100 animate-in">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <AlertOctagon className="w-5 h-5 text-red-500" /> Log a New Breach
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 pl-1">Member</label>
          <select name="userId" required className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none text-sm text-gray-900">
            <option value="">Select member...</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 pl-1">Amount Forfeited (₦)</label>
          <input name="amountForfeited" type="number" min="1" required placeholder="50" className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none text-sm text-gray-900" />
        </div>
      </div>
      
      <div className="space-y-1.5 mb-4">
        <label className="text-sm font-semibold text-gray-700 pl-1">Reason for Breach</label>
        <textarea name="reason" required placeholder="e.g. Failed to complete 3 workouts this week." className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none text-sm text-gray-900 resize-none" rows={2} />
      </div>

      {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl mb-4 font-medium">{error}</div>}

      <button type="submit" disabled={isSubmitting} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70">
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Forfeiture'}
      </button>
    </form>
  )
}
