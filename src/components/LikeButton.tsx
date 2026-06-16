'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  productId: string
  initialCount: number
  initialLiked: boolean
  size?: 'sm' | 'md'
}

export default function LikeButton({ productId, initialCount, initialLiked, size = 'sm' }: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (loading) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // 낙관적 업데이트 (클릭 즉시 UI 반영)
    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((c) => nextLiked ? c + 1 : Math.max(c - 1, 0))
    setLoading(true)

    try {
      if (liked) {
        await supabase.from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId)
      } else {
        await supabase.from('likes')
          .insert({ user_id: user.id, product_id: productId })
      }
    } catch {
      // 실패 시 원래 상태로 복원
      setLiked(liked)
      setCount((c) => liked ? c + 1 : Math.max(c - 1, 0))
    } finally {
      setLoading(false)
    }
  }

  if (size === 'md') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl border transition-all"
        style={
          liked
            ? { borderColor: '#FF6B6B', background: '#FFF0F0' }
            : { borderColor: '#E8D4B8', background: 'white' }
        }
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill={liked ? '#FF6B6B' : 'none'}
          stroke={liked ? '#FF6B6B' : '#B09080'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: 'all 0.15s' }}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span className="text-xs font-medium" style={{ color: liked ? '#FF6B6B' : '#B09080' }}>
          {count}
        </span>
      </button>
    )
  }

  // size === 'sm' (목록 카드용)
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all"
      style={{ background: 'transparent' }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={liked ? '#FF6B6B' : 'none'}
        stroke={liked ? '#FF6B6B' : '#C0A090'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'all 0.15s', flexShrink: 0 }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {count > 0 && (
        <span className="text-xs" style={{ color: liked ? '#FF6B6B' : '#C0A090' }}>
          {count}
        </span>
      )}
    </button>
  )
}
