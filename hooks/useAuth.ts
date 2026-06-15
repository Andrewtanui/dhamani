'use client'

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import type { Database } from '@/types/supabase'
import { useEffect, useState, useCallback } from 'react'

type AuthState = {
  user: User | null
  profile: Profile | null
  loading: boolean
}

export function useAuth() {
  const supabase = createClient()
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  })

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return data as Profile | null
    },
    [supabase]
  )

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const profile = user ? await fetchProfile(user.id) : null
      setState({ user, profile, loading: false })
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null
      const profile = user ? await fetchProfile(user.id) : null
      setState({ user, profile, loading: false })
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { user: data.user, error }
    },
    [supabase]
  )

  const signUp = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      return { user: data.user, session: data.session, error }
    },
    [supabase]
  )

  const signInWithGoogle = useCallback(
    async (nextPath = '/') => {
      const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      })
      return { error }
    },
    [supabase]
  )

  const signInWithGitHub = useCallback(
    async (nextPath = '/') => {
      const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo },
      })
      return { error }
    },
    [supabase]
  )

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!state.user) throw new Error('No user logged in')

      // Update profile in database
      const { data, error } = await supabase
        .from('profiles')
        .update(updates as unknown as never)
        .eq('id', state.user.id)
        .select()
        .single()

      if (error) return { error }

      // Update local state
      setState(prev => ({
        ...prev,
        profile: data as Profile,
      }))

      return { data: data as Profile }
    },
    [supabase, state.user]
  )

  const uploadProfilePicture = useCallback(
    async (file: File) => {
      if (!state.user) throw new Error('No user logged in')

      // Upload file to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${state.user.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) return { error: uploadError }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with avatar URL
      const { data, error } = await updateProfile({ avatar_url: publicUrl })
      return { data, error }
    },
    [supabase, state.user, updateProfile]
  )

  return {
    ...state,
    isAuthenticated: !!state.user,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    updateProfile,
    uploadProfilePicture,
  }
}