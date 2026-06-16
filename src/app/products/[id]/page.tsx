import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import OwnerActions from './OwnerActions'
import ProductImages from './ProductImages'
import LikeButton from '@/components/LikeButton'

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

function getCategoryEmoji(category: string) {
  const map: Record<string, string> = {
    '디지털/가전': '📱', '의류/패션': '👗', '도서/음반': '📚',
    '스포츠/레저': '⚽', '가구/인테리어': '🪑', '생활/주방': '🍳',
    '게임/취미': '🎮', '기타': '📦',
  }
  return map[category] ?? '📦'
}

const STATUS_LABEL: Record<string, string> = {
  available: '판매중',
  reserved: '예약중',
  sold: '판매완료',
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  available: { background: '#E8F5E9', color: '#2E7D32' },
  reserved: { background: '#FFF3E0', color: '#E65100' },
  sold: { background: '#EEEEEE', color: '#757575' },
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, profiles(id, nickname, location, bio)')
    .eq('id', id)
    .single()

  if (!product) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === product.user_id

  // 현재 사용자의 좋아요 여부 확인
  const isLiked = user
    ? !!(await supabase.from('likes').select('id').eq('user_id', user.id).eq('product_id', id).maybeSingle()).data
    : false

  const { data: otherProducts } = await supabase
    .from('products')
    .select('id, title, price, category, status, image_urls')
    .eq('user_id', product.user_id)
    .neq('id', id)
    .limit(3)

  const seller = product.profiles as { id: string; nickname: string; location: string | null; bio: string | null } | null
  const imageUrls: string[] = product.image_urls ?? []

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--goguma-cream)' }}>
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#F0E0C8] shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/products" className="p-1.5 rounded-lg hover:bg-[#FDF6EC] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--goguma-brown)' }}>
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <span className="font-bold" style={{ color: 'var(--goguma-brown)' }}>상품 정보</span>
          <div className="w-8" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full">

        {/* 이미지 영역 */}
        {imageUrls.length > 0 ? (
          <ProductImages urls={imageUrls} />
        ) : (
          <div
            className="w-full flex items-center justify-center"
            style={{ height: 280, background: 'var(--goguma-warm)' }}
          >
            <span style={{ fontSize: 80 }}>{getCategoryEmoji(product.category)}</span>
          </div>
        )}

        <div className="px-4 pb-32">

          {/* 판매자 정보 */}
          <div className="py-4 flex items-center gap-3 border-b border-[#F0E0C8]">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #C4611A, #7B4F8C)' }}
            >
              {seller?.nickname?.[0] ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--goguma-brown)' }}>
                {seller?.nickname ?? '알 수 없음'}
              </p>
              {seller?.location && (
                <p className="text-xs mt-0.5" style={{ color: '#B09080' }}>{seller.location}</p>
              )}
            </div>
          </div>

          {/* 상품 정보 */}
          <div className="py-5 border-b border-[#F0E0C8]">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={STATUS_STYLE[product.status]}
              >
                {STATUS_LABEL[product.status]}
              </span>
              <span className="text-xs" style={{ color: '#B09080' }}>{product.category}</span>
            </div>

            <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--goguma-text)' }}>
              {product.title}
            </h1>

            <p className="text-xs mb-4" style={{ color: '#B09080' }}>
              {product.location && `${product.location} · `}
              {timeAgo(product.created_at)}
            </p>

            <p className="text-2xl font-bold" style={{ color: 'var(--goguma-brown)' }}>
              {product.price.toLocaleString('ko-KR')}원
            </p>

            {product.description && (
              <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#5A4030' }}>
                {product.description}
              </p>
            )}
          </div>

          {/* 판매자의 다른 상품 */}
          {otherProducts && otherProducts.length > 0 && (
            <div className="py-5">
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--goguma-brown)' }}>
                {seller?.nickname}님의 다른 상품
              </p>
              <div className="flex flex-col gap-2">
                {otherProducts.map((p) => {
                  const thumb = (p.image_urls as string[] | null)?.[0]
                  return (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-[#F0E0C8] bg-white hover:shadow-sm transition-shadow"
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={p.title}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <span className="text-2xl">{getCategoryEmoji(p.category)}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--goguma-text)' }}>{p.title}</p>
                        <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--goguma-brown)' }}>
                          {p.price.toLocaleString('ko-KR')}원
                        </p>
                      </div>
                      {p.status !== 'available' && (
                        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={STATUS_STYLE[p.status]}>
                          {STATUS_LABEL[p.status]}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F0E0C8] px-4 py-3 z-40">
        <div className="max-w-2xl mx-auto">
          {isOwner ? (
            <OwnerActions productId={id} />
          ) : (
            <div className="flex items-center gap-3">
              {/* 좋아요 버튼 */}
              <LikeButton
                productId={id}
                initialCount={product.like_count ?? 0}
                initialLiked={isLiked}
                size="md"
              />
              <div className="flex-1">
                <p className="text-xs" style={{ color: '#B09080' }}>가격</p>
                <p className="text-lg font-bold" style={{ color: 'var(--goguma-brown)' }}>
                  {product.price.toLocaleString('ko-KR')}원
                </p>
              </div>
              <button
                className="flex-1 py-3 rounded-xl text-white font-semibold goguma-gradient opacity-50 cursor-not-allowed"
                disabled
              >
                채팅하기 (준비 중)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
