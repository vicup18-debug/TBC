'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Users, Plus, Loader2 } from 'lucide-react'

// Schemas
const createGroupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  effectiveDate: z.string().min(1, 'Start date is required'),
  reviewDate: z.string().min(1, 'End date is required'),
  commitmentFundAmount: z.number().min(0, 'Must be at least 0'),
})

const joinGroupSchema = z.object({
  inviteCode: z.string().min(1, 'Invite code is required'),
})

export default function SetupPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'selection' | 'create' | 'join'>('selection')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createForm = useForm<z.infer<typeof createGroupSchema>>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      commitmentFundAmount: 100,
    }
  })

  const joinForm = useForm<z.infer<typeof joinGroupSchema>>({
    resolver: zodResolver(joinGroupSchema),
  })

  const onCreateSubmit = async (data: z.infer<typeof createGroupSchema>) => {
    setIsLoading(true)
    setError(null)
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, timezone }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to create group')
      }
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const onJoinSubmit = async (data: z.infer<typeof joinGroupSchema>) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to join group')
      }
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 animate-in bg-background">
      <div className="w-full max-w-lg bg-white rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
        
        {mode === 'selection' && (
          <div className="flex flex-col items-center animate-in duration-300">
            <div className="h-16 w-16 rounded-full bg-brand flex items-center justify-center mb-6 shadow-sm">
              <Users className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Group Setup</h1>
            <p className="text-sm text-gray-500 text-center font-medium mb-10 max-w-xs">
              To begin the Covenant, either create a new group or join an existing one.
            </p>

            <div className="w-full space-y-4">
              <button
                onClick={() => setMode('create')}
                className="w-full flex items-center p-4 rounded-2xl border-2 border-gray-100 hover:border-brand hover:bg-gray-50/50 transition-all group text-left"
              >
                <div className="h-12 w-12 rounded-full bg-gray-100 group-hover:bg-brand flex items-center justify-center mr-4 transition-colors">
                  <Plus className="w-6 h-6 text-gray-600 group-hover:text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Create Group</h3>
                  <p className="text-sm text-gray-500 font-medium">Start a new 12-month covenant</p>
                </div>
              </button>

              <button
                onClick={() => setMode('join')}
                className="w-full flex items-center p-4 rounded-2xl border-2 border-gray-100 hover:border-brand hover:bg-gray-50/50 transition-all group text-left"
              >
                <div className="h-12 w-12 rounded-full bg-gray-100 group-hover:bg-brand flex items-center justify-center mr-4 transition-colors">
                  <Users className="w-6 h-6 text-gray-600 group-hover:text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Join Group</h3>
                  <p className="text-sm text-gray-500 font-medium">Enter an invite code</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div className="animate-in duration-300">
            <button onClick={() => setMode('selection')} className="text-sm font-semibold text-gray-500 hover:text-black mb-6 flex items-center gap-1 transition-colors">
              ← Back
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Group</h2>
            
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 pl-1">Group Name</label>
                <input
                  {...createForm.register('name')}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none text-sm text-gray-900"
                  placeholder="The Millionaire Covenant"
                />
                {createForm.formState.errors.name && <p className="text-xs text-red-500 pl-1 font-medium">{createForm.formState.errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 pl-1">Start Date</label>
                  <input
                    type="date"
                    {...createForm.register('effectiveDate')}
                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none text-sm text-gray-900"
                  />
                  {createForm.formState.errors.effectiveDate && <p className="text-xs text-red-500 pl-1 font-medium">{createForm.formState.errors.effectiveDate.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 pl-1">End Date</label>
                  <input
                    type="date"
                    {...createForm.register('reviewDate')}
                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none text-sm text-gray-900"
                  />
                  {createForm.formState.errors.reviewDate && <p className="text-xs text-red-500 pl-1 font-medium">{createForm.formState.errors.reviewDate.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 pl-1">Commitment Fund ($)</label>
                <input
                  type="number"
                  {...createForm.register('commitmentFundAmount', { valueAsNumber: true })}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none text-sm text-gray-900"
                  placeholder="1000"
                />
                <p className="text-xs text-gray-500 pl-1 font-medium">The amount each member risks in total.</p>
                {createForm.formState.errors.commitmentFundAmount && <p className="text-xs text-red-500 pl-1 font-medium">{createForm.formState.errors.commitmentFundAmount.message}</p>}
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium text-center border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-brand hover:bg-brand-dark text-black font-bold py-4 px-4 rounded-full transition-all flex items-center justify-center gap-2 group disabled:opacity-70 shadow-sm"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Covenant'}
              </button>
            </form>
          </div>
        )}

        {mode === 'join' && (
          <div className="animate-in duration-300">
            <button onClick={() => setMode('selection')} className="text-sm font-semibold text-gray-500 hover:text-black mb-6 flex items-center gap-1 transition-colors">
              ← Back
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Join a Group</h2>
            
            <form onSubmit={joinForm.handleSubmit(onJoinSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 pl-1">Invite Code</label>
                <input
                  {...joinForm.register('inviteCode')}
                  className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 outline-none text-sm text-gray-900 uppercase tracking-widest text-center"
                  placeholder="XXXXXXXX"
                />
                {joinForm.formState.errors.inviteCode && <p className="text-xs text-red-500 pl-1 font-medium text-center">{joinForm.formState.errors.inviteCode.message}</p>}
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium text-center border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 bg-brand hover:bg-brand-dark text-black font-bold py-4 px-4 rounded-full transition-all flex items-center justify-center gap-2 group disabled:opacity-70 shadow-sm"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Join Covenant'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
