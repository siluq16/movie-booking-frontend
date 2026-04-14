import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MovieCard from '../../components/cinema/MovieCard'
import Spinner from '../../components/common/Spinner'
import { movieService } from '../../services/movieService'
import { formatDuration } from '../../utils/formatters'

export default function HomePage() {
  const navigate = useNavigate()
  const [movies, setMovies]   = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('now_showing')
  const [heroIdx, setHeroIdx] = useState(0)

  useEffect(() => {
    movieService.getAll()
      .then(r => setMovies(Array.isArray(r.data) ? r.data : []))
      .catch(() => setMovies([]))
      .finally(() => setLoading(false))
  }, [])

  const featured    = movies.filter(m => m.isFeatured)
  const hero        = featured[heroIdx] || movies[0]
  const filtered    = movies.filter(m => activeTab === 'all' || m.status === activeTab)

  useEffect(() => {
    if (featured.length < 2) return
    const t = setInterval(() => setHeroIdx(i => (i + 1) % featured.length), 5500)
    return () => clearInterval(t)
  }, [featured.length])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <Spinner size="lg" />
    </div>
  )

  return (
    <>
      {/* ── CSS CHỈ GIỮ LẠI HIỆU ỨNG LƯỚT CHUỘT (HOVER) VÀ ẨN POSTER TRÊN MOBILE ── */}
      <style>{`
        .hover-float {
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
        }
        .hover-float:hover {
          transform: translateY(-12px);
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }
        .btn-hover {
          transition: all 0.3s ease;
        }
        .btn-hover:hover {
          transform: translateY(-4px) scale(1.03);
        }
        .poster-3d {
          transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
          transform: perspective(1000px) rotateY(-12deg) rotateX(4deg) scale(0.95);
        }
        .poster-3d:hover {
          transform: perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1);
        }
        @media (max-width: 900px) {
          .hero-poster-container { display: none !important; }
        }
      `}</style>

      {/* ── HERO SECTION ── */}
      <section style={{ position: 'relative', height: '85vh', minHeight: 650, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Hình nền mờ */}
        {hero?.bannerUrl && (
          <div key={hero.id} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${hero.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: .3, transition: 'background-image 0.8s ease' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,10,12,1) 0%, rgba(10,10,12,0.8) 45%, rgba(10,10,12,0.2) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 150, background: 'linear-gradient(to top, var(--bg-dark), transparent)' }} />

        {/* Nội dung Hero */}
        {hero && (
          <div style={{ position: 'relative', zIndex: 10, width: '100%', margin: '0 auto', padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 40 }} key={hero.id + '-content'}>
            
            {/* CỘT TRÁI: THÔNG TIN PHIM */}
            <div style={{ flex: 1, maxWidth: 720 }}>
              <div style={{ display: 'inline-block', background: hero.status === 'now_showing' ? 'var(--gold)' : '#4a9fd0', color: '#000', fontSize: 11, fontWeight: 700, letterSpacing: 2, padding: '6px 14px', borderRadius: 4, marginBottom: 20 }}>
                {hero.status === 'now_showing' ? '● ĐANG CHIẾU' : '▶ SẮP CHIẾU'}
              </div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(40px,5vw,68px)', lineHeight: 1.1, marginBottom: 12, color: 'var(--text-pri)', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                {hero.title}
              </h1>
              {hero.originalTitle && hero.originalTitle !== hero.title && (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 16, marginBottom: 16 }}>{hero.originalTitle}</div>
              )}
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 24, alignItems: 'center' }}>
                {hero.avgRating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(201,168,76,.15)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(201,168,76,.3)' }}>
                    <span style={{ color: 'var(--gold)', fontSize: 16 }}>★</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14 }}>{Number(hero.avgRating).toFixed(1)}</span>
                  </div>
                )}
                <span style={{ color: 'var(--text-sec)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>⏱ {formatDuration(hero.durationMinutes)}</span>
                {hero.ageRating > 0 && <span style={{ color: '#fff', fontSize: 13, background: 'var(--red)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>T{hero.ageRating}</span>}
                {hero.genres?.[0] && <span style={{ color: 'var(--text-sec)', fontSize: 14 }}>{hero.genres.join(' • ')}</span>}
              </div>

              {hero.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: 15, lineHeight: 1.6, marginBottom: 32, maxWidth: 560, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {hero.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: 16 }}>
                <button onClick={() => navigate(`/movies/${hero.id}`)}
                  className="btn-hover"
                  style={{ background: 'var(--gold)', color: '#000', border: 'none', padding: '16px 36px', fontSize: 15, fontWeight: 600, borderRadius: 30, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 8px 20px rgba(201,168,76,.3)' }}
                >
                  🎬 Mua Vé Ngay
                </button>
                <button onClick={() => navigate(`/movies/${hero.id}`)}
                  className="btn-hover"
                  style={{ background: 'rgba(255,255,255,.05)', color: 'var(--text-pri)', border: '1px solid rgba(255,255,255,.2)', padding: '16px 36px', fontSize: 15, borderRadius: 30, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", backdropFilter: 'blur(10px)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}
                >
                  Xem Chi Tiết
                </button>
              </div>
            </div>

            {/* CỘT PHẢI: POSTER NỔI KHỐI 3D */}
            <div className="hero-poster-container" style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', width: '30%', maxWidth: 360, minWidth: 280 }}>
              <img 
                src={hero.posterUrl || hero.bannerUrl} 
                alt={hero.title} 
                className="poster-3d"
                style={{ 
                  width: '100%', 
                  borderRadius: 16, 
                  boxShadow: '0 30px 60px rgba(0,0,0,0.8), -20px 0 40px rgba(0,0,0,0.5)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  objectFit: 'cover',
                  aspectRatio: '2/3'
                }} 
                onClick={() => navigate(`/movies/${hero.id}`)}
              />
            </div>

          </div>
        )}

        {/* Hero Indicators */}
        {featured.length > 1 && (
          <div style={{ position: 'absolute', bottom: 40, right: '6%', display: 'flex', gap: 10, zIndex: 10 }}>
            {featured.map((_, i) => (
              <div key={i} onClick={() => setHeroIdx(i)} style={{ width: i === heroIdx ? 32 : 8, height: 8, borderRadius: 4, background: i === heroIdx ? 'var(--gold)' : 'rgba(255,255,255,.3)', cursor: 'pointer', transition: 'all .4s ease' }} />
            ))}
          </div>
        )}
      </section>

      {/* ── MOVIE LIST ── */}
      <section style={{ padding: '60px 5% 100px', background: 'var(--bg-dark)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,4vw,36px)', margin: 0 }}>
              Phim <span style={{ color: 'var(--gold)' }}>Chiếu Rạp</span>
            </h2>

            {/* Modern Pill Tabs */}
            <div style={{ display: 'flex', background: 'var(--bg-card)', padding: 6, borderRadius: 30, border: '1px solid var(--border)' }}>
              {[['now_showing', 'Đang Chiếu'], ['coming_soon', 'Sắp Chiếu']].map(([v, l]) => (
                <button key={v} onClick={() => setActiveTab(v)} 
                  style={{ 
                    background: activeTab === v ? 'var(--gold)' : 'transparent', 
                    border: 'none', 
                    color: activeTab === v ? '#000' : 'var(--text-sec)', 
                    fontSize: 14, fontWeight: activeTab === v ? 600 : 400, 
                    padding: '10px 24px', borderRadius: 24, cursor: 'pointer', 
                    fontFamily: "'DM Sans',sans-serif", transition: '.3s' 
                  }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 16, border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
              <div style={{ fontSize: 16 }}>Chưa có phim nào trong danh mục này</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '32px 24px' }}>
              {filtered.map((m) => (
                <div key={m.id} className="hover-float">
                  <MovieCard movie={m} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── PROMOTION BANNER ── */}
      <section style={{ padding: '0 5% 40px', background: 'var(--bg-dark)' }}>
        <div className="hover-float" style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', overflow: 'hidden', borderRadius: 20, border: '1px solid rgba(82,201,124,.3)', boxShadow: '0 20px 40px rgba(0,0,0,.4)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(82,201,124,.15) 0%, rgba(10,10,12,1) 100%)', zIndex: 0 }} />
          
          <div style={{ position: 'relative', zIndex: 1, padding: '56px 6%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32 }}>
            <div>
              <div style={{ display: 'inline-block', background: 'rgba(82,201,124,.2)', border: '1px solid rgba(82,201,124,.4)', color: '#52c97c', fontSize: 12, fontWeight: 700, letterSpacing: 2, padding: '6px 12px', borderRadius: 4, marginBottom: 16 }}>
                KHUYẾN MÃI HOT 🎁
              </div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,4vw,40px)', marginBottom: 16, color: 'var(--text-pri)', lineHeight: 1.2 }}>
                Bùng nổ ưu đãi<br />Giảm giá cực sốc
              </h2>
              <p style={{ color: 'var(--text-sec)', fontSize: 16, maxWidth: 500, lineHeight: 1.6 }}>Khám phá ngay các chương trình khuyến mãi hấp dẫn, combo bắp nước siêu tiết kiệm và hàng ngàn voucher đang chờ đón bạn tại CineMax.</p>
            </div>
            
            <button onClick={() => navigate('/promotions')} 
              className="btn-hover"
              style={{ background: '#52c97c', color: '#000', border: 'none', padding: '18px 48px', fontSize: 16, fontWeight: 600, borderRadius: 30, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap', boxShadow: '0 10px 20px rgba(82,201,124,.2)' }}
            >
              Xem Khuyến Mãi →
            </button>
          </div>
        </div>
      </section>

      {/* ── MEMBERSHIP BANNER ── */}
      <section style={{ padding: '0 5% 100px', background: 'var(--bg-dark)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', overflow: 'hidden', borderRadius: 20, border: '1px solid rgba(201,168,76,.3)', boxShadow: '0 20px 40px rgba(0,0,0,.5)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(201,168,76,.1) 0%, rgba(10,10,12,1) 100%)', zIndex: 0 }} />
          
          <div style={{ position: 'relative', zIndex: 1, padding: '56px 6%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-block', background: 'rgba(201,168,76,.15)', border: '1px solid rgba(201,168,76,.3)', color: 'var(--gold)', fontSize: 12, fontWeight: 700, letterSpacing: 2, padding: '6px 12px', borderRadius: 4, marginBottom: 16 }}>
                ƯU ĐÃI HỘI VIÊN 👑
              </div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,4vw,40px)', marginBottom: 16, color: 'var(--text-pri)', lineHeight: 1.2 }}>
                Tích điểm, đổi vé<br />mỗi lần mua
              </h2>
              <p style={{ color: 'var(--text-sec)', fontSize: 16, maxWidth: 600, lineHeight: 1.6 }}>Tham gia hệ thống thành viên CineMax để nhận ưu đãi độc quyền, quà tặng sinh nhật và trải nghiệm phòng chờ VIP dành riêng cho các hạng thẻ Vàng, Bạch Kim và Kim Cương.</p>
            </div>
            
            <div style={{ fontSize: 60, opacity: 0.8, filter: 'drop-shadow(0 0 20px rgba(201,168,76,.4))' }}>
              💎
            </div>
          </div>
        </div>
      </section>
    </>
  )
}