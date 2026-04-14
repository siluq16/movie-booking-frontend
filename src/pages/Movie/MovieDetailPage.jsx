import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Spinner from '../../components/common/Spinner'
import { movieService, showtimeService, reviewService, cinemaService } from '../../services/movieService'
import { formatDuration, formatDate, formatDateFull, formatTime } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// ── Trailer Modal ──────────────────────────────────────────────────────────────
function TrailerModal({ url, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const fn = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', fn) }
  }, [])

  const getEmbed = (raw) => {
    try {
      const u = new URL(raw)
      if (u.hostname.includes('youtube.com')) { const v = u.searchParams.get('v'); return v ? `https://www.youtube.com/embed/${v}?autoplay=1&rel=0` : null }
      if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}?autoplay=1&rel=0`
      if (u.hostname.includes('vimeo.com')) return `https://player.vimeo.com/video/${u.pathname.slice(1)}?autoplay=1`
      return raw
    } catch { return raw }
  }
  const embed = getEmbed(url)
  const overlayRef = useRef(null)

  return (
    <div ref={overlayRef} onClick={e => e.target === overlayRef.current && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn .2s' }}>
      <div style={{ width: '100%', maxWidth: 900, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: -44, right: 0, background: 'none', border: 'none', color: '#fff', fontSize: 32, cursor: 'pointer', opacity: .8, lineHeight: 1 }}>×</button>
        {embed
          ? <div style={{ aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
            <iframe src={embed} style={{ width: '100%', height: '100%', border: 'none' }} allow="autoplay; fullscreen" allowFullScreen title="Trailer" />
          </div>
          : <div style={{ aspectRatio: '16/9', background: '#111', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span style={{ fontSize: 48 }}>▶️</span>
            <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', fontSize: 14 }}>Mở trailer →</a>
          </div>
        }
      </div>
    </div>
  )
}

// ── Booking Modal — chọn thành phố → rạp → ngày → suất chiếu ──────────────────
function BookingModal({ movie, onClose }) {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const [cinemas, setCinemas] = useState([])
  const [cityFilter, setCityFilter] = useState('Hà Nội')
  const [selectedCinema, setSelC] = useState(null)
  const [selectedDate, setSelDate] = useState(0)
  const [showtimes, setShowtimes] = useState([])
  const [stLoading, setStL] = useState(false)
  const [loadingC, setLoadingC] = useState(true)

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i); return d
  })

  useEffect(() => {
    cinemaService.getAll()
      .then(r => setCinemas(Array.isArray(r.data) ? r.data.filter(c => c.isActive) : []))
      .catch(() => setCinemas([]))
      .finally(() => setLoadingC(false))
  }, [])

  useEffect(() => {
    if (cinemas.length > 0 && !selectedCinema) {

      const firstCinemaInCity = cinemas.find(c => c.city === cityFilter);

      if (firstCinemaInCity) {
        setSelC(firstCinemaInCity);
      }
    }
  }, [cinemas, cityFilter, selectedCinema]);

  useEffect(() => {
    if (!selectedCinema) { setShowtimes([]); return }
    setStL(true)

    const dt = dates[selectedDate]

    const adjustedDate = new Date(dt.getTime() - (dt.getTimezoneOffset() * 60000));

    showtimeService.search(adjustedDate, movie.id, selectedCinema.id)
      .then(r => setShowtimes(Array.isArray(r.data) ? r.data : []))
      .catch(() => setShowtimes([]))
      .finally(() => setStL(false))
  }, [selectedCinema, selectedDate])

  const cities = [...new Set(cinemas.map(c => c.city))]
  const filteredCinemas = cinemas.filter(c => c.city === cityFilter)
  const handleSelectShowtime = (st) => {
    if (!isLoggedIn) { toast.error('Bạn cần đăng nhập để đặt vé'); onClose(); navigate('/login'); return }
    onClose()
    navigate(`/booking/${st.showtimeId || st.id}/seats`, { state: { movie, showtime: st } })
  }

  const overlayRef = useRef(null)
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const FMT_COLOR = { IMAX_2D: '#1a6bb5', IMAX_3D: '#1a6bb5', '4DX': '#8B3A8B', '3D': '#2a7a4f', '2D': '#5a5850', Dolby: '#b54a1a' }

  return (
    <div ref={overlayRef} onClick={e => e.target === overlayRef.current && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', animation: 'fadeInUp .25s ease', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, marginBottom: 4 }}>Chọn Suất Chiếu</h3>
            <div style={{ fontSize: 13, color: 'var(--gold)' }}>{movie.title}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 24, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          {/* Step 1: City filter */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: .5, marginBottom: 10 }}>1. CHỌN THÀNH PHỐ</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {cities.map(city => (
                <button key={city} onClick={() => { setCityFilter(city); setSelC(null); setShowtimes([]) }}
                  style={{ padding: '6px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", border: `1px solid ${cityFilter === city ? 'var(--gold)' : 'var(--border)'}`, background: cityFilter === city ? 'rgba(201,168,76,.12)' : 'var(--bg-card2)', color: cityFilter === city ? 'var(--gold)' : 'var(--text-sec)', transition: '.15s' }}>
                  {city === 'all' ? '🌐 Tất cả' : city}
                  <span style={{ opacity: .6, fontSize: 11, marginLeft: 5 }}>({city === 'all' ? cinemas.length : cinemas.filter(c => c.city === city).length})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Cinema */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: .5, marginBottom: 10 }}>2. CHỌN RẠP CHIẾU</div>
            {loadingC ? <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-muted)', fontSize: 13 }}>Đang tải rạp...</div>
              : filteredCinemas.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>Không có rạp nào tại thành phố này</div>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filteredCinemas.map(c => (
                      <button key={c.id} onClick={() => { setSelC(c); setSelDate(0); setShowtimes([]) }}
                        style={{ background: selectedCinema?.id === c.id ? 'rgba(201,168,76,.08)' : 'var(--bg-card2)', border: `1px solid ${selectedCinema?.id === c.id ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 8, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: '.15s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 14, color: selectedCinema?.id === c.id ? 'var(--gold)' : 'var(--text-pri)', fontWeight: selectedCinema?.id === c.id ? 500 : 400 }}>🏛️ {c.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>📍 {c.district ? `${c.district}, ` : ''}{c.city}</div>
                          </div>
                          {selectedCinema?.id === c.id && <span style={{ fontSize: 16, color: 'var(--gold)' }}>✓</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
          </div>

          {/* Step 3: Date — chỉ hiện khi đã chọn rạp */}
          {selectedCinema && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: .5, marginBottom: 10 }}>3. CHỌN NGÀY</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {dates.map((dt, i) => (
                  <button key={i} onClick={() => setSelDate(i)}
                    style={{ background: selectedDate === i ? 'rgba(201,168,76,.15)' : 'var(--bg-card2)', border: `1px solid ${selectedDate === i ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 6, padding: '9px 14px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", textAlign: 'center', minWidth: 66, transition: '.15s' }}>
                    <div style={{ fontSize: 10, color: selectedDate === i ? 'var(--gold)' : 'var(--text-muted)', marginBottom: 2 }}>{i === 0 ? 'Hôm nay' : dt.toLocaleDateString('vi-VN', { weekday: 'short' })}</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: selectedDate === i ? 'var(--gold)' : 'var(--text-pri)' }}>{dt.getDate()}/{dt.getMonth() + 1}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Showtimes */}
          {selectedCinema && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: .5, marginBottom: 10 }}>4. CHỌN SUẤT CHIẾU</div>
              {stLoading ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>⏳ Đang tải suất chiếu...</div>
              ) : showtimes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                  Chưa có suất chiếu vào ngày này tại rạp đã chọn
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {showtimes.map(st => {
                    const fc = FMT_COLOR[st.screenFormat] || '#5a5850'

                    const total = st.totalSeats || 0;
                    const taken = st.seatsTaken || 0;
                    const availableSeats = total - taken;
                    const full = total > 0 && availableSeats <= 0; // Chỉ hết chỗ khi số lượng <= 0

                    return (
                      <button key={st.id || st.showtimeId} onClick={() => !full && handleSelectShowtime(st)} disabled={full}
                        style={{ background: full ? 'var(--bg-deep)' : 'var(--bg-card2)', border: `1px solid ${full ? 'var(--border)' : fc + '55'}`, borderRadius: 8, padding: '12px 16px', cursor: full ? 'not-allowed' : 'pointer', textAlign: 'left', fontFamily: "'DM Sans',sans-serif", minWidth: 130, opacity: full ? .6 : 1, transition: '.2s' }}
                        onMouseEnter={e => { if (!full) { e.currentTarget.style.background = `${fc}15`; e.currentTarget.style.borderColor = fc } }}
                        onMouseLeave={e => { e.currentTarget.style.background = full ? 'var(--bg-deep)' : 'var(--bg-card2)'; e.currentTarget.style.borderColor = full ? 'var(--border)' : fc + '55' }}
                      >
                        <div style={{ fontSize: 18, fontWeight: 600, color: full ? 'var(--text-muted)' : 'var(--text-pri)', marginBottom: 6 }}>{formatTime(st.startTime)}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: fc, background: `${fc}18`, border: `1px solid ${fc}44`, padding: '1px 7px', borderRadius: 3, display: 'inline-block', marginBottom: 6 }}>{st.screenFormat}</div>

                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {full ? '🔴 Hết chỗ' : availableSeats <= 15 ? `🟡 Còn ${availableSeats} ghế` : `🟢 Còn ${availableSeats} ghế`}
                        </div>

                        {st.language && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{st.language?.toUpperCase()}{st.subtitleType && st.subtitleType !== 'none' ? ` / Sub ${st.subtitleType}` : ''}</div>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Write Review ──────────────────────────────────────────────────────────────
function WriteReview({ movieId, onSubmitted, initialReview, onCancel }) {
  const { isLoggedIn } = useAuth()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!isLoggedIn) { toast.error('Bạn cần đăng nhập để đánh giá'); return }
    if (!rating) { toast.error('Vui lòng chọn điểm đánh giá'); return }
    setLoading(true)
    try {
      if (initialReview) {
        await reviewService.update(initialReview.id, { rating, comment: comment.trim() || null })
        toast.success('Đã cập nhật đánh giá!')
      } else {
        await reviewService.create({ movieId, rating, comment: comment.trim() || null })
        toast.success('Cảm ơn bạn đã đánh giá!')
        setRating(0); setComment('')
      }
      onSubmitted?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra')
    } finally { setLoading(false) }
  }

  const disp = hover || rating
  return (
    <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 14 }}>
        {initialReview ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá của bạn'}
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Điểm: <span style={{ color: disp ? 'var(--gold)' : 'var(--text-muted)', fontWeight: 500 }}>{disp ? `${disp}/10` : 'Chưa chọn'}</span></div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
              style={{ width: 36, height: 36, borderRadius: 6, border: `1px solid ${n <= disp ? 'var(--gold)' : 'var(--border)'}`, background: n <= disp ? 'rgba(201,168,76,.15)' : 'var(--bg-card)', color: n <= disp ? 'var(--gold)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontWeight: n <= disp ? 600 : 400, fontFamily: "'DM Sans',sans-serif", transition: '.1s' }}>{n}</button>
          ))}
        </div>
      </div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Chia sẻ cảm nhận của bạn... (tuỳ chọn)" rows={3}
        style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: 'var(--text-pri)', fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none', resize: 'vertical', marginBottom: 12 }}
        onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleSubmit} disabled={loading || !isLoggedIn}
          style={{ background: 'var(--gold)', color: '#000', border: 'none', padding: '10px 24px', borderRadius: 4, fontSize: 14, fontWeight: 500, cursor: loading || !isLoggedIn ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", opacity: !isLoggedIn ? .5 : 1 }}>
          {loading ? '⏳ Đang xử lý...' : (initialReview ? 'Lưu thay đổi' : (isLoggedIn ? '⭐ Gửi đánh giá' : 'Đăng nhập để đánh giá'))}
        </button>

        {initialReview && (
          <button onClick={onCancel} style={{ background: 'transparent', color: 'var(--text-sec)', border: '1px solid var(--border)', padding: '10px 24px', borderRadius: 4, cursor: 'pointer' }}>
            Hủy
          </button>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '9px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
      <span style={{ color: 'var(--text-muted)', minWidth: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-pri)' }}>{value}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MovieDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuth()

  const [movie, setMovie] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [showTrailer, setTrailer] = useState(false)
  const [showBooking, setBooking] = useState(false)
  const [editingReview, setEditingReview] = useState(null)

  useEffect(() => {
    Promise.allSettled([movieService.getById(id), reviewService.getByMovie(id)])
      .then(([mRes, rRes]) => {
        if (mRes.status === 'fulfilled') setMovie(mRes.value.data)
        if (rRes.status === 'fulfilled') setReviews(Array.isArray(rRes.value.data) ? rRes.value.data : [])
      }).finally(() => setLoading(false))
  }, [id])

  const reloadReviews = () => {
    reviewService.getByMovie(id).then(r => setReviews(Array.isArray(r.data) ? r.data : [])).catch(() => { })
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><Spinner size="lg" /></div>
  if (!movie) return (
    <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
      <h2 style={{ marginBottom: 8 }}>Không tìm thấy phim</h2>
      <button onClick={() => navigate('/')} style={{ background: 'var(--gold)', color: '#000', border: 'none', padding: '10px 24px', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>Về trang chủ</button>
    </div>
  )

  // Phân loại đạo diễn vs diễn viên:
  // Ưu tiên roleLabel khớp exact với list DIR_ROLES, sau đó check contains keywords
  const DIR_ROLES_SET = new Set(['Đạo diễn', 'Đạo diễn phụ', 'Đồng đạo diễn', 'Đạo diễn hành động', 'Director', 'Co-Director'])
  const isDirectorRole = (c) => {
    if (!c.roleLabel) return false
    if (DIR_ROLES_SET.has(c.roleLabel)) return true
    const lc = c.roleLabel.toLowerCase()
    return lc.includes('đạo diễn') || lc.includes('director')
  }
  const directors = movie.crews?.filter(isDirectorRole) || []
  const cast = movie.crews?.filter(c => !isDirectorRole(c)) || []

  return (
    <>
      {showTrailer && movie.trailerUrl && <TrailerModal url={movie.trailerUrl} onClose={() => setTrailer(false)} />}
      {showBooking && <BookingModal movie={movie} onClose={() => setBooking(false)} />}

      {/* Banner */}
      <div style={{ position: 'relative', height: 400, overflow: 'hidden' }}>
        {movie.bannerUrl && <img src={movie.bannerUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .4 }} onError={e => e.target.style.display = 'none'} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(10,10,12,.2) 0%,rgba(10,10,12,1) 100%)' }} />
        {movie.trailerUrl && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={() => setTrailer(true)} style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(201,168,76,.9)', border: 'none', cursor: 'pointer', fontSize: 28, transition: '.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 0 0 12px rgba(201,168,76,.15)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>▶</button>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5% 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'clamp(190px,20%,240px) 1fr', gap: 40 }}>

          {/* Left */}
          <div style={{ marginTop: -130, zIndex: 10 }}>
            <div style={{ borderRadius: 10, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,.7)', border: '1px solid var(--border)', aspectRatio: '2/3', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>
              {movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} /> : '🎬'}
            </div>
            <div style={{ marginTop: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, color: 'var(--gold)', lineHeight: 1 }}>{movie.avgRating > 0 ? Number(movie.avgRating).toFixed(1) : '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>/ 10 điểm</div>
              {movie.reviewCount > 0 && <div style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 6 }}>{movie.reviewCount.toLocaleString()} đánh giá</div>}
            </div>
            {movie.trailerUrl && (
              <button onClick={() => setTrailer(true)} style={{ marginTop: 12, width: '100%', background: 'transparent', border: '1px solid var(--border-gold)', color: 'var(--gold)', padding: '10px 0', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: '.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>▶ Xem Trailer</button>
            )}
          </div>

          {/* Right */}
          <div style={{ paddingTop: 16 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-sec)', cursor: 'pointer', fontSize: 14, fontFamily: "'DM Sans',sans-serif", marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, padding: 0, transition: '.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-sec)'}>← Quay lại</button>

            <span style={{ display: 'inline-block', fontSize: 10, padding: '3px 10px', borderRadius: 2, marginBottom: 12, fontWeight: 600, letterSpacing: .5, ...(movie.status === 'now_showing' ? { background: 'rgba(82,201,124,.15)', color: 'var(--green)', border: '1px solid rgba(82,201,124,.3)' } : { background: 'rgba(201,168,76,.1)', color: 'var(--gold)', border: '1px solid var(--border-gold)' }) }}>
              {movie.status === 'now_showing' ? '● ĐANG CHIẾU' : '▶ SẮP CHIẾU'}
            </span>

            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(24px,4vw,40px)', lineHeight: 1.15, marginBottom: 6 }}>{movie.title}</h1>
            {movie.originalTitle && movie.originalTitle !== movie.title && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14, marginBottom: 14 }}>{movie.originalTitle}</div>}

            {movie.genres?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {movie.genres.map(g => <span key={g} style={{ background: 'rgba(201,168,76,.1)', border: '1px solid var(--border-gold)', color: 'var(--gold)', fontSize: 12, padding: '4px 12px', borderRadius: 2 }}>{g}</span>)}
              </div>
            )}

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
              {movie.status === 'now_showing' && (
                <button onClick={() => setBooking(true)}
                  style={{ background: 'var(--gold)', color: '#000', border: 'none', padding: '13px 32px', borderRadius: 4, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: '.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-light)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}>
                  🎬 Đặt Vé
                </button>
              )}
              {movie.trailerUrl && (
                <button onClick={() => setTrailer(true)}
                  style={{ background: 'transparent', color: 'var(--text-pri)', border: '1px solid rgba(255,255,255,.2)', padding: '13px 24px', borderRadius: 4, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 8, transition: '.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)'; e.currentTarget.style.color = 'var(--text-pri)' }}>
                  ▶ Xem Trailer
                </button>
              )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
              {[['info', 'Thông tin'], ['cast', 'Diễn viên'], ['reviews', `Đánh giá (${reviews.length})`]].map(([v, l]) => (
                <button key={v} onClick={() => setActiveTab(v)} style={{ background: 'none', border: 'none', color: activeTab === v ? 'var(--gold)' : 'var(--text-sec)', fontSize: 13, padding: '10px 18px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", borderBottom: `2px solid ${activeTab === v ? 'var(--gold)' : 'transparent'}`, marginBottom: -1, transition: '.15s', whiteSpace: 'nowrap' }}>{l}</button>
              ))}
            </div>

            {/* {activeTab==='info'&&(
              <div style={{ animation:'fadeIn .3s ease' }}>
                {movie.description&&<p style={{ color:'var(--text-sec)', fontSize:15, lineHeight:1.85, marginBottom:28 }}>{movie.description}</p>}
                <div style={{ borderRadius:8, overflow:'hidden', border:'1px solid var(--border)' }}>
                  <InfoRow label="⏱ Thời lượng"    value={formatDuration(movie.durationMinutes)} />
                  {movie.releaseDate&&<InfoRow label="📅 Khởi chiếu"  value={formatDateFull(movie.releaseDate)} />}
                  {movie.endDate&&<InfoRow label="📅 Kết thúc"    value={formatDateFull(movie.endDate)} />}
                  <InfoRow label="🌍 Quốc gia"      value={movie.country||'—'} />
                  <InfoRow label="🗣 Ngôn ngữ"       value={{vi:'Tiếng Việt',en:'Tiếng Anh',ko:'Tiếng Hàn',ja:'Tiếng Nhật'}[movie.language]||movie.language} />
                  <InfoRow label="🔞 Giới hạn tuổi" value={movie.ageRating>0?`T${movie.ageRating}+`:'P - Mọi lứa tuổi'} />
                </div>
              </div>
            )} */}

            {activeTab === 'info' && (
              <div style={{ animation: 'fadeIn .3s ease' }}>
                {movie.description && <p style={{ color: 'var(--text-sec)', fontSize: 12, lineHeight: 1.6, marginBottom: 32 }}>{movie.description}</p>}

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 16
                }}>
                  {[
                    { label: "⏱ Thời lượng", value: formatDuration(movie.durationMinutes) },
                    { label: "📅 Khởi chiếu", value: formatDateFull(movie.releaseDate) },
                    { label: "🌍 Quốc gia", value: movie.country || '—' },
                    { label: "🗣 Ngôn ngữ", value: { vi: 'Tiếng Việt', en: 'Tiếng Anh', ko: 'Tiếng Hàn', ja: 'Tiếng Nhật' }[movie.language] || movie.language },
                    { label: "🔞 Độ tuổi", value: movie.ageRating > 0 ? `T${movie.ageRating}+` : 'P' }
                  ].map((item, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      padding: '10px',
                      borderRadius: 12,
                      textAlign: 'center'
                    }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>{item.label}</div>
                      <div style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'cast' && (
              <div style={{ animation: 'fadeIn .3s ease' }}>
                {!movie.crews?.length ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🎭</div>Chưa có thông tin diễn viên
                  </div>
                ) : (
                  <>
                    {directors.length > 0 && (
                      <div style={{ marginBottom: 28 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1.5, marginBottom: 14, fontWeight: 600 }}>ĐẠO DIỄN</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                          {directors.map((c, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg-card2)', border: '1px solid var(--border-gold)', borderRadius: 10, padding: '14px 18px', minWidth: 200, transition: '.2s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,.08)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card2)'}>
                              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(201,168,76,.15)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                                {c.photoUrl ? <img src={c.photoUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} /> : '🎬'}
                              </div>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{c.name}</div>
                                <div style={{ fontSize: 12, color: 'var(--gold)' }}>{c.roleLabel || 'Đạo diễn'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {cast.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1.5, marginBottom: 14, fontWeight: 600 }}>DIỄN VIÊN</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12 }}>
                          {cast.map((c, i) => (
                            <div key={i} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, transition: '.2s' }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-gold)'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.05))', border: '1px solid rgba(201,168,76,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                {c.photoUrl ? <img src={c.photoUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} /> : '🎬'}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{c.name}</div>
                                {c.characterName && <div style={{ fontSize: 11, color: 'var(--gold)', marginBottom: 3 }}>"{c.characterName}"</div>}
                                {c.roleLabel && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.roleLabel}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {directors.length === 0 && cast.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>🎭</div>Chưa phân loại được vai trò
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* {activeTab === 'reviews' && (
              <div style={{ animation: 'fadeIn .3s ease' }}>
                <WriteReview movieId={id} onSubmitted={reloadReviews} />
                {reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}><div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>Chưa có đánh giá nào. Hãy là người đầu tiên!</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reviews.map(r => (
                      <div key={r.id} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{r.userName?.[0]?.toUpperCase()}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14, fontWeight: 500 }}>{r.userName}</span>
                              {r.isVerified && <span style={{ fontSize: 10, background: 'rgba(82,201,124,.15)', color: 'var(--green)', border: '1px solid rgba(82,201,124,.3)', padding: '1px 7px', borderRadius: 2 }}>✓ Đã mua vé</span>}
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{r.createdAt ? formatDate(r.createdAt) : ''}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(201,168,76,.1)', border: '1px solid var(--border-gold)', borderRadius: 4, padding: '4px 10px', flexShrink: 0 }}>
                            <span style={{ color: 'var(--gold)', fontSize: 14 }}>★</span>
                            <span style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 600 }}>{r.rating}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>/10</span>
                          </div>
                        </div>
                        {r.comment && <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7, margin: 0 }}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )} */}
            {activeTab === 'reviews' && (
              <div style={{ animation: 'fadeIn .3s ease' }}>
                {(() => {
                  const myReview = reviews.find(r => r.userId === user?.id);

                  if (editingReview) {
                    return (
                      <WriteReview
                        movieId={id}
                        initialReview={myReview}
                        onSubmitted={() => { setEditingReview(null); reloadReviews(); }}
                        onCancel={() => setEditingReview(null)}
                      />
                    );
                  }

                  // Nếu đã có đánh giá nhưng không edit -> Hiển thị review của mình
                  if (myReview) {
                    const handleDelete = async () => {
                      if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
                      try {
                        await reviewService.delete(myReview.id);
                        toast.success("Đã xóa đánh giá");
                        reloadReviews();
                      } catch (err) {
                        toast.error("Không thể xóa đánh giá lúc này");
                      }
                    };

                    return (
                      <div style={{ background: 'rgba(201,168,76,0.05)', border: '1px dashed var(--gold)', borderRadius: 10, padding: 20, marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 13, color: 'var(--gold)', marginBottom: 15, fontWeight: 500 }}>
                              ✨ Bạn đã đánh giá phim này
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>★ {myReview.rating}/10</span>
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— {formatDate(myReview.updatedAt || myReview.createdAt)}</span>
                            </div>
                            <p style={{ fontSize: 14, color: 'var(--text-pri)', margin: 0, fontStyle: 'italic' }}>
                              "{myReview.comment || 'Bạn không để lại bình luận.'}"
                            </p>
                          </div>

                          {/* Cụm nút Sửa / Xóa */}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => setEditingReview(myReview)} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border-gold)', color: 'var(--gold)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                              Sửa
                            </button>
                            <button onClick={handleDelete} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--red)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return <WriteReview movieId={id} onSubmitted={reloadReviews} />;
                })()}

                {reviews.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
                    Chưa có đánh giá nào. Hãy là người đầu tiên!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reviews.map(r => {
                      const isMine = r.userId === user?.id;

                      return (
                        <div key={r.id} style={{
                          background: 'var(--bg-card2)',
                          border: isMine ? '1px solid var(--gold)' : '1px solid var(--border)',
                          borderRadius: 8,
                          padding: '16px 18px',
                          position: 'relative'
                        }}>
                          {isMine && <span style={{ position: 'absolute', top: 10, right: 18, fontSize: 10, color: 'var(--gold)', fontWeight: 600 }}>ĐÁNH GIÁ CỦA BẠN</span>}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                              {r.userName?.[0]?.toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 14, fontWeight: 500 }}>{r.userName}</span>
                                {r.isVerified && <span style={{ fontSize: 10, background: 'rgba(82,201,124,.15)', color: 'var(--green)', border: '1px solid rgba(82,201,124,.3)', padding: '1px 7px', borderRadius: 2 }}>✓ Đã mua vé</span>}
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                  {r.updatedAt ? formatDate(r.updatedAt) : (r.createdAt ? formatDate(r.createdAt) : '')}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(201,168,76,.1)', border: '1px solid var(--border-gold)', borderRadius: 4, padding: '4px 10px', flexShrink: 0 }}>
                              <span style={{ color: 'var(--gold)', fontSize: 14 }}>★</span>
                              <span style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 600 }}>{r.rating}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>/10</span>
                            </div>
                          </div>
                          {r.comment && <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7, margin: 0 }}>{r.comment}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
