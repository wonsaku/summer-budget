import Header from '@/components/Header'
import ProductCard, { type Product } from '@/components/ProductCard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const CATEGORIES = ['전체', '디지털/가전', '의류/패션', '도서/음반', '스포츠/레저', '가구/인테리어', '생활/주방', '게임/취미', '기타']

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'price_asc', label: '낮은 가격순' },
  { value: 'price_desc', label: '높은 가격순' },
]

type SearchParams = {
  category?: string
  sort?: string
  q?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { category, sort = 'latest', q } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('products')
    .select('id, title, price, category, location, status, created_at, image_urls, like_count, profiles(nickname)')
    .limit(60)

  if (category && category !== '전체') {
    query = query.eq('category', category)
  }

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  if (sort === 'price_asc') {
    query = query.order('price', { ascending: true })
  } else if (sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: products } = await query

  // 현재 사용자가 좋아요한 상품 ID 목록
  const likedIds = new Set<string>()
  if (user) {
    const { data: userLikes } = await supabase
      .from('likes')
      .select('product_id')
      .eq('user_id', user.id)
    userLikes?.forEach((l) => likedIds.add(l.product_id))
  }

  function buildUrl(params: Partial<SearchParams>) {
    const merged = { category, sort, q, ...params }
    const entries = Object.entries(merged).filter(([, v]) => v && v !== '전체' && v !== 'latest')
    if (entries.length === 0) return '/products'
    return '/products?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')
  }

  const activeCategory = category || '전체'
  const activeSort = sort || 'latest'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5">

        {/* 검색창 */}
        <form action="/products" method="GET" className="mb-4">
          {category && <input type="hidden" name="category" value={category} />}
          {sort && sort !== 'latest' && <input type="hidden" name="sort" value={sort} />}
          <div className="relative">
            <input
              type="text"
              name="q"
              defaultValue={q}
              className="goguma-input pr-12"
              placeholder="어떤 물건을 찾고 계세요?"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors hover:bg-[#FDF6EC]"
              aria-label="검색"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--goguma-orange)' }}>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </button>
          </div>
        </form>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={buildUrl({ category: cat, q })}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors"
              style={
                activeCategory === cat
                  ? { background: 'var(--goguma-orange)', color: 'white', borderColor: 'var(--goguma-orange)' }
                  : { background: 'white', color: 'var(--goguma-brown)', borderColor: '#E8D4B8' }
              }
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* 결과 수 + 정렬 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm" style={{ color: '#B09080' }}>
            {q && <span>'{q}' 검색 결과 · </span>}
            총 <span className="font-semibold" style={{ color: 'var(--goguma-brown)' }}>{products?.length ?? 0}</span>개
          </p>
          <div className="flex gap-1">
            {SORT_OPTIONS.map((opt) => (
              <Link
                key={opt.value}
                href={buildUrl({ sort: opt.value })}
                className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                style={
                  activeSort === opt.value
                    ? { background: 'var(--goguma-brown)', color: 'white', borderColor: 'var(--goguma-brown)' }
                    : { background: 'white', color: 'var(--goguma-brown)', borderColor: '#E8D4B8' }
                }
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 상품 목록 */}
        {products && products.length > 0 ? (
          <div className="flex flex-col gap-3 fade-in">
            {(products as unknown as Product[]).map((product) => (
              <ProductCard key={product.id} product={product} isLiked={likedIds.has(product.id)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center fade-in">
            <div className="text-5xl mb-4 float-animation">🍠</div>
            <p className="font-semibold text-lg mb-1" style={{ color: 'var(--goguma-brown)' }}>
              {q ? `'${q}'에 대한 결과가 없어요` : '등록된 상품이 없어요'}
            </p>
            <p className="text-sm mb-6" style={{ color: '#B09080' }}>
              {q ? '다른 검색어로 시도해보세요' : '첫 번째 판매글을 올려보세요!'}
            </p>
            {!q && (
              <Link
                href="/sell"
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-white goguma-gradient"
              >
                판매글 작성하기
              </Link>
            )}
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-sm" style={{ color: '#B09080', borderTop: '1px solid #F0E0C8' }}>
        © 2026 고구마마켓 — 따뜻한 중고거래의 시작
      </footer>
    </div>
  )
}
