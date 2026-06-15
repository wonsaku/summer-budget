'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export default function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#F0E0C8] shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1.5 font-bold text-lg whitespace-nowrap" style={{ color: 'var(--goguma-orange)' }}>
            <span className="text-xl">🍠</span>
            <span>고구마마켓</span>
          </Link>
          <Link href="/products" className="text-sm font-medium hover:underline whitespace-nowrap" style={{ color: 'var(--goguma-brown)' }}>
            중고거래
          </Link>
        </div>

        <nav className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <Link
                href="/sell"
                className="px-3 py-1.5 rounded-full text-sm font-semibold text-white goguma-gradient transition-opacity hover:opacity-90 whitespace-nowrap"
              >
                + 판매하기
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-full text-sm font-medium border border-[#E8D4B8] hover:bg-[#FDF6EC] transition-colors whitespace-nowrap"
                style={{ color: 'var(--goguma-brown)' }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-full text-sm font-medium border border-[#E8D4B8] hover:bg-[#FDF6EC] transition-colors whitespace-nowrap"
                style={{ color: 'var(--goguma-brown)' }}
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1.5 rounded-full text-sm font-medium text-white transition-colors goguma-gradient whitespace-nowrap"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
