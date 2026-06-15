import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// app/api/auth/callback/route.ts (or wherever this file is)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('exchangeCodeForSession failed:', error)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}