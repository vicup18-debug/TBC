'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, TrendingUp, Check } from 'lucide-react'

export default function DeclarationForm({ todayDateString }: { todayDateString: string }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [onTrack, setOnTrack] = useState(false)
  const [success, setSuccess] = useState(false)

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/declarations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.get('date'),
          netWorth: formData.get('netWorth') ? Number(formData.get('netWorth')) : null,
          cumulativeGrowth: formData.get('cumulativeGrowth') ? Number(formData.get('cumulativeGrowth')) : null,
          evidenceNote: formData.get('evidenceNote'),
          onTrackForMillionaire: onTrack,
        })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to submit declaration')
      }
      e.currentTarget.reset()
      setSuccess(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 animate-in">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-brand-dark" /> Submit New Declaration
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 pl-1">Date</label>
          <input name="date" type="date" defaultValue={todayDateString} required className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none text-sm text-gray-900" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 pl-1">Total Net Worth (₦)</label>
          <input name="netWorth" type="number" step="0.01" className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none text-sm text-gray-900" placeholder="e.g. 50000" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700 pl-1">Monthly Growth (₦)</label>
          <input name="cumulativeGrowth" type="number" step="0.01" className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none text-sm text-gray-900" placeholder="e.g. +2500 or -500" />
        </div>
      </div>
      
      <div className="space-y-1.5 mb-6">
        <label className="text-sm font-semibold text-gray-700 pl-1">Evidence & Notes</label>
        <textarea name="evidenceNote" placeholder="Link to spreadsheet, bank screenshot, or general breakdown of assets and liabilities." className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none text-sm text-gray-900 resize-y" rows={3} />
      </div>

      <div className="mb-8">
         <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 bg-gray-50 cursor-pointer transition-colors hover:border-gray-300" onClick={() => setOnTrack(!onTrack)}>
           <div className={`w-14 h-8 rounded-full p-1 transition-colors ${onTrack ? 'bg-brand' : 'bg-gray-300'}`}>
             <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${onTrack ? 'translate-x-6' : 'translate-x-0'}`} />
           </div>
           <div>
             <h4 className="font-bold text-gray-900">On Track for Millionaire?</h4>
             <p className="text-sm text-gray-500">Are your current habits and growth rates aligning with the ultimate goal?</p>
           </div>
         </div>
      </div>

      {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl mb-6 font-medium">{error}</div>}

      <button type="submit" disabled={isSubmitting} className="w-full bg-black hover:bg-gray-800 text-white font-bold py-4 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-70">
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? <Check className="w-5 h-5 text-brand" /> : 'Sign Declaration'}
      </button>
    </form>
  )
}
