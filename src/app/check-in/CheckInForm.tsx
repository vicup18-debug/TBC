'use client'

import { useState } from 'react'
import { Brain, Flame, Dumbbell, Coins, Loader2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Pillar = 'MIND' | 'SPIRIT' | 'BODY' | 'WEALTH'

interface ExistingLog {
  pillar: string;
  completed: boolean;
  note: string | null;
}

const pillars: { id: Pillar, label: string, icon: any, desc: string }[] = [
  { id: 'MIND', label: 'Mind', icon: Brain, desc: 'Reading, learning, meditation' },
  { id: 'SPIRIT', label: 'Spirit', icon: Flame, desc: 'Prayer, reflection, gratitude' },
  { id: 'BODY', label: 'Body', icon: Dumbbell, desc: 'Workout, physical activity' },
  { id: 'WEALTH', label: 'Wealth', icon: Coins, desc: 'Business, career, saving' },
]

export default function CheckInForm({ dateString, initialLogs }: { dateString: string, initialLogs: ExistingLog[] }) {
  const router = useRouter()
  const [logs, setLogs] = useState<Record<string, { completed: boolean, note: string }>>(() => {
    const defaultLogs: any = {}
    pillars.forEach(p => {
      const existing = initialLogs.find(l => l.pillar === p.id)
      defaultLogs[p.id] = {
        completed: existing ? existing.completed : false,
        note: existing?.note || ''
      }
    })
    return defaultLogs
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const togglePillar = (id: string) => {
    setLogs(prev => ({ ...prev, [id]: { ...prev[id], completed: !prev[id].completed } }))
  }

  const updateNote = (id: string, note: string) => {
    setLogs(prev => ({ ...prev, [id]: { ...prev[id], note } }))
  }

  const submit = async () => {
    setIsSubmitting(true)
    setSuccess(false)
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateString, logs }),
      })
      if (!res.ok) throw new Error('Failed to save logs')
      setSuccess(true)
      router.push('/dashboard')
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
     <div className="space-y-4">
       {pillars.map(pillar => {
         const log = logs[pillar.id]
         const Icon = pillar.icon
         return (
           <div key={pillar.id} className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 transition-all">
             <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => togglePillar(pillar.id)}>
               <div className="flex items-center gap-4">
                 <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${log.completed ? 'bg-brand' : 'bg-gray-100'}`}>
                   <Icon className={`w-6 h-6 ${log.completed ? 'text-black' : 'text-gray-500'}`} />
                 </div>
                 <div>
                   <h3 className="text-lg font-bold text-gray-900">{pillar.label}</h3>
                   <p className="text-sm text-gray-500 font-medium">{pillar.desc}</p>
                 </div>
               </div>
               
               <div className={`w-14 h-8 rounded-full p-1 transition-colors ${log.completed ? 'bg-brand' : 'bg-gray-200'}`}>
                 <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${log.completed ? 'translate-x-6' : 'translate-x-0'}`} />
               </div>
             </div>
             
             {log.completed && (
               <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                 <textarea
                   value={log.note}
                   onChange={e => updateNote(pillar.id, e.target.value)}
                   placeholder={`Add a private note for ${pillar.label}... (optional)`}
                   className="w-full bg-gray-50/50 border border-gray-200 rounded-xl p-4 text-sm focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none resize-none text-gray-900 placeholder:text-gray-400"
                   rows={2}
                 />
               </div>
             )}
           </div>
         )
       })}

       <button
         onClick={submit}
         disabled={isSubmitting}
         className="w-full mt-8 bg-black hover:bg-gray-800 text-white font-bold py-4 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
       >
         {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : success ? <Check className="w-5 h-5 text-brand" /> : 'Save Daily Check-In'}
       </button>
     </div>
  )
}
