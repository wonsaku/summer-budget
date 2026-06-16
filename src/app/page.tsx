import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProductCard, { type Product } from '@/components/ProductCard'

const FEATURES = [
  {
    emoji: '🤝',
    title: '안전한 거래',
    desc: '이웃 간의 신뢰를 바탕으로 안심하고 거래할 수 있어요.',
  },
  {
    emoji: '📍',
    title: '우리 동네',
    desc: '가까운 이웃과 직거래로 배송비 걱정 없이 편리하게!',
  },
  {
    emoji: '♻️',
    title: '가치 있는 나눔',
    desc: '쓰지 않는 물건에 새 생명을 불어넣어 환경도 지켜요.',
  },
]

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: recentProducts }, { count: totalCount }] = await Promise.all([
    supabase
      .from('products')
      .select('id, title, price, category, location, status, created_at, image_urls, like_count, comment_count, profiles(nickname)')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true }),
  ])

  const likedIds = new Set<string>()
  if (user && recentProducts) {
    const ids = recentProducts.map((p) => p.id)
    const { data: userLikes } = await supabase
      .from('likes')
      .select('product_id')
      .eq('user_id', user.id)
      .in('product_id', ids)
    userLikes?.forEach((l) => likedIds.add(l.product_id))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden goguma-gradient py-20 px-4 text-center text-white">
        {/* 배경 원형 장식 */}
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full opacity-10" style={{ background: 'white' }} />

        <div className="relative max-w-xl mx-auto">
          <div className="text-7xl mb-6 float-animation inline-block">🍠</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
            우리 동네 따뜻한<br />중고거래
          </h1>
          <p className="text-base sm:text-lg opacity-85 mb-8">
            고구마마켓에서 이웃과 안전하게 거래하세요
          </p>

          {/* 통계 */}
          {totalCount !== null && totalCount > 0 && (
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-5 py-2 mb-8 text-sm font-medium backdrop-blur-sm">
              <span>🛍️</span>
              <span>지금 <strong>{totalCount.toLocaleString()}</strong>개의 상품이 거래 중!</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="px-8 py-3 bg-white rounded-full font-bold text-base transition-transform hover:scale-105 shadow-md"
              style={{ color: 'var(--goguma-orange)' }}
            >
              중고거래 보기
            </Link>
            <Link
              href="/sell"
              className="px-8 py-3 border-2 border-white rounded-full font-bold text-base text-white transition-transform hover:scale-105 hover:bg-white/10"
            >
              + 판매하기
            </Link>
          </div>
        </div>
      </section>

      {/* ── 최근 등록 상품 ── */}
      {recentProducts && recentProducts.length > 0 && (
        <section className="py-12 px-4" style={{ background: 'var(--goguma-cream)' }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: 'var(--goguma-brown)' }}>
                최근 등록된 상품
              </h2>
              <Link
                href="/products"
                className="text-sm font-medium flex items-center gap-1 hover:underline"
                style={{ color: 'var(--goguma-orange)' }}
              >
                전체 보기
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {(recentProducts as unknown as Product[]).map((product) => (
                <ProductCard key={product.id} product={product} isLiked={likedIds.has(product.id)} />
              ))}
            </div>
            <div className="mt-5 text-center">
              <Link
                href="/products"
                className="inline-block px-8 py-2.5 rounded-full font-semibold border-2 text-sm transition-colors hover:bg-white"
                style={{ color: 'var(--goguma-brown)', borderColor: '#E8D4B8' }}
              >
                상품 더 보기
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 특징 ── */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-xl font-bold mb-8" style={{ color: 'var(--goguma-brown)' }}>
            왜 고구마마켓인가요?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="goguma-card p-6 text-center">
                <div className="text-4xl mb-3">{f.emoji}</div>
                <h3 className="font-bold text-base mb-2" style={{ color: 'var(--goguma-brown)' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#9A7860' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 px-4 text-center" style={{ background: 'var(--goguma-warm)' }}>
        <div className="max-w-sm mx-auto">
          <div className="text-4xl mb-3">🍠</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--goguma-brown)' }}>
            지금 바로 시작해보세요
          </h2>
          <p className="text-sm mb-6" style={{ color: '#9A7860' }}>
            가입하고 이웃과 따뜻한 거래를 시작하세요
          </p>
          <Link
            href="/signup"
            className="inline-block px-10 py-3 rounded-full font-bold text-white goguma-gradient transition-opacity hover:opacity-90 shadow-md"
          >
            무료 회원가입
          </Link>
        </div>
      </section>

      <footer className="py-6 text-center text-sm" style={{ color: '#B09080', borderTop: '1px solid #F0E0C8' }}>
        © 2026 고구마마켓 — 따뜻한 중고거래의 시작
      </footer>
    </div>
  )
}
