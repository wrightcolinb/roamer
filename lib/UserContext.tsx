'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/types'

interface UserContextValue {
  user: User | null
  loading: boolean
}

const UserContext = createContext<UserContextValue>({ user: null, loading: true })

export function useUser(): UserContextValue {
  return useContext(UserContext)
}

export function UserContextProvider({
  slug,
  children,
}: {
  slug: string
  children: ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchUser() {
      const { data } = await supabase
        .from('users')
        .select('id, slug, display_name')
        .eq('slug', slug)
        .single()
      if (!cancelled) {
        setUser(data ?? null)
        setLoading(false)
      }
    }
    fetchUser()
    return () => { cancelled = true }
  }, [slug])

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  )
}
