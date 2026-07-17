'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { LogIn, ArrowRight, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (res?.error) {
        throw new Error('Invalid email or password')
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
      <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
        
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 mb-5 flex items-center justify-center relative">
            <Image src="/logo.png" alt="Obi Agu Logo" fill className="object-contain" priority />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-2 text-center font-medium">
            Log in to track your progress and commitments.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 pl-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all outline-none text-sm placeholder:text-gray-400 text-gray-900"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-xs text-red-500 pl-1 font-medium">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 pl-1">Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-4 py-3.5 rounded-2xl bg-gray-50/50 border border-gray-200 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-all outline-none text-sm placeholder:text-gray-400 text-gray-900"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-red-500 pl-1 font-medium">{errors.password.message}</p>}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-600 text-sm font-medium text-center border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-4 bg-brand hover:bg-brand-dark text-black font-bold py-4 px-4 rounded-full transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-black hover:underline transition-all">
            Join the Covenant
          </Link>
        </div>
      </div>
    </div>
  )
}
