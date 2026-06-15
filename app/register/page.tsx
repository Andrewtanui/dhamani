import { Suspense } from 'react'
import Link from 'next/link'
import { AuthForm } from '@/components/auth-form'
import { Skeleton } from '@/components/ui/skeleton'
import { SparklesIcon } from 'lucide-react'

function AuthFormSkeleton() {
  return (
    <div className="w-full max-w-md space-y-4 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-8 shadow-xl">
      <Skeleton className="mx-auto h-8 w-48" />
      <Skeleton className="mx-auto h-4 w-64" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-bg opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      
      <div className="relative z-10 w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          <div className="relative">
            <SparklesIcon className="h-6 w-6 text-primary" />
            <div className="absolute inset-0 bg-primary/20 blur-xl" />
          </div>
          <span className="gradient-text">Thamani</span>
        </Link>
        <Suspense fallback={<AuthFormSkeleton />}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>
    </div>
  )
}
