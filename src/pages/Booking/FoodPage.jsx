import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import StepBar from '../../components/cinema/StepBar'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import { foodService, bookingService } from '../../services/movieService'
import { formatCurrency, formatTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function FoodPage() {
  const { bookingId } = useParams()
  const { state }     = useLocation()
  const navigate      = useNavigate()

  const { movie, showtime, booking, selectedSeats } = state || {}

  const [categories, setCategories] = useState([])
  const [items, setItems]           = useState([])
  const [qty, setQty]               = useState({})
  const [activeCategory, setActiveCat] = useState('all')
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    Promise.allSettled([foodService.getCategories(), foodService.getItems()])
      .then(([cRes, iRes]) => {
        const cats  = cRes.status==='fulfilled' ? (Array.isArray(cRes.value.data)?cRes.value.data:[]) : []
        const foods = iRes.status==='fulfilled' ? (Array.isArray(iRes.value.data)?iRes.value.data:[]) : []
        setCategories(cats)
        setItems(foods.filter(f => f.isAvailable))
      })
      .finally(() => setLoading(false))
  }, [])

  const updateQty = (id, delta) =>
    setQty(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }))

  const displayedItems = activeCategory === 'all'
    ? items
    : items.filter(f => String(f.categoryId) === activeCategory)

  const orderItems   = items.filter(f => (qty[f.id]||0) > 0)
  const ticketTotal  = selectedSeats?.reduce((a, s) => a + (s.price||0), 0) || booking?.totalAmount || 0
  const foodTotal    = orderItems.reduce((a, f) => a + (qty[f.id]||0) * f.basePrice, 0)
  const grandTotal   = ticketTotal + foodTotal

  const handleContinue = async () => {
    setSaving(true)
    try {
      if (orderItems.length > 0) {
        await bookingService.addFood(bookingId, orderItems.map(f => ({ foodItemId: f.id, quantity: qty[f.id] })))
      }
      navigate(`/booking/${bookingId}/payment`, {
        state: {
          movie, showtime, booking, selectedSeats,
          foodItems: orderItems.map(f => ({ ...f, quantity: qty[f.id], subtotal: qty[f.id] * f.basePrice })),
          foodTotal,
          grandTotal,
        }
      })
    } catch {
      navigate(`/booking/${bookingId}/payment`, {
        state: { movie, showtime, booking, selectedSeats, foodItems: [], foodTotal: 0, grandTotal: ticketTotal }
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSkip = () => navigate(`/booking/${bookingId}/payment`, {
    state: { movie, showtime, booking, selectedSeats, foodItems: [], foodTotal: 0, grandTotal: ticketTotal }
  })

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'70vh' }}><Spinner size="lg" /></div>
  )

  return (
    <>
      <StepBar current={1} />
      <div style={{ maxWidth:1300, margin:'0 auto', padding:'40px 5% 80px', display:'grid', gridTemplateColumns:'1fr minmax(300px,360px)', gap:32, alignItems:'start' }}>

        {/* ── LEFT: Food list ── */}
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(22px,3vw,28px)', marginBottom:6 }}>Đồ Ăn & Thức Uống</h2>
          <p style={{ color:'var(--text-sec)', fontSize:14, marginBottom:24 }}>Nâng tầm trải nghiệm rạp chiếu phim của bạn</p>

          {/* Category tabs */}
          {categories.length > 0 && (
            <div style={{ display:'flex', gap:8, marginBottom:28, flexWrap:'wrap' }}>
              <button onClick={() => setActiveCat('all')}
                style={{ padding:'7px 16px', borderRadius:20, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", border:`1px solid ${activeCategory==='all'?'var(--gold)':'var(--border)'}`, background:activeCategory==='all'?'rgba(201,168,76,.1)':'var(--bg-card)', color:activeCategory==='all'?'var(--gold)':'var(--text-sec)', transition:'.15s' }}>
                Tất cả <span style={{ opacity:.6 }}>({items.length})</span>
              </button>
              {categories.map(c => (
                <button key={c.id} onClick={() => setActiveCat(String(c.id))}
                  style={{ padding:'7px 16px', borderRadius:20, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", border:`1px solid ${activeCategory===String(c.id)?'var(--gold)':'var(--border)'}`, background:activeCategory===String(c.id)?'rgba(201,168,76,.1)':'var(--bg-card)', color:activeCategory===String(c.id)?'var(--gold)':'var(--text-sec)', transition:'.15s' }}>
                  {c.name} <span style={{ opacity:.6 }}>({items.filter(f=>f.categoryId===c.id).length})</span>
                </button>
              ))}
            </div>
          )}

          {displayedItems.length === 0 ? (
            <div style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🍽️</div>
              <div>Chưa có món ăn nào trong danh mục này</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))', gap:14 }}>
              {displayedItems.map(f => {
                const q = qty[f.id] || 0
                return (
                  <div key={f.id} style={{ background:'var(--bg-card)', border:`1px solid ${q>0?'var(--border-gold)':'var(--border)'}`, borderRadius:10, overflow:'hidden', transition:'.2s' }}
                    onMouseEnter={e => { if (!q) e.currentTarget.style.borderColor='var(--border-gold)' }}
                    onMouseLeave={e => { if (!q) e.currentTarget.style.borderColor='var(--border)' }}
                  >
                    {/* Image/Emoji area */}
                    <div style={{ height:90, background:'var(--bg-card2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:42, position:'relative' }}>
                      {f.imageUrl?.startsWith('http')
                        ? <img src={f.imageUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => e.target.style.display='none'} />
                        : f.imageUrl || '🍽️'
                      }
                      {f.isCombo && (
                        <div style={{ position:'absolute', top:6, right:6, fontSize:9, background:'var(--gold)', color:'#000', padding:'2px 6px', borderRadius:2, fontWeight:700 }}>COMBO</div>
                      )}
                      {q > 0 && (
                        <div style={{ position:'absolute', top:6, left:6, width:22, height:22, borderRadius:'50%', background:'var(--gold)', color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{q}</div>
                      )}
                    </div>

                    <div style={{ padding:'12px 12px 14px' }}>
                      <div style={{ fontSize:13, fontWeight:500, marginBottom:3, color:'var(--text-pri)', lineHeight:1.3 }}>{f.name}</div>
                      {f.description && <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6, lineHeight:1.4 }}>{f.description.slice(0,50)}{f.description.length>50?'...':''}</div>}
                      {f.calories && <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:6 }}>{f.calories} kcal</div>}
                      <div style={{ fontSize:14, color:'var(--gold)', fontWeight:500, marginBottom:10 }}>{formatCurrency(f.basePrice)}</div>

                      {/* Qty controls */}
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <button onClick={() => updateQty(f.id, -1)} disabled={!q}
                          style={{ width:28, height:28, borderRadius:6, background:q?'var(--bg-card2)':'var(--bg-deep)', border:`1px solid ${q?'var(--border)':'var(--border)'}`, color:q?'var(--text-pri)':'var(--text-muted)', cursor:q?'pointer':'default', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', transition:'.15s' }}
                          onMouseEnter={e => { if (q) { e.currentTarget.style.borderColor='var(--gold)'; e.currentTarget.style.color='var(--gold)' } }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color=q?'var(--text-pri)':'var(--text-muted)' }}>−</button>
                        <span style={{ minWidth:20, textAlign:'center', fontSize:14, fontWeight:q?500:400, color:q?'var(--gold)':'var(--text-muted)' }}>{q}</span>
                        <button onClick={() => updateQty(f.id, 1)}
                          style={{ width:28, height:28, borderRadius:6, background:'var(--bg-card2)', border:'1px solid var(--border)', color:'var(--text-pri)', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', transition:'.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold)'; e.currentTarget.style.color='var(--gold)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-pri)' }}>+</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── RIGHT: Order summary ── */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:24, position:'sticky', top:90 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, marginBottom:20 }}>Đơn Hàng</h3>

          {/* Movie/showtime info */}
          <div style={{ background:'var(--bg-card2)', borderRadius:8, padding:'12px 14px', marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>{movie?.title || '—'}</div>
            {showtime && <div style={{ fontSize:12, color:'var(--text-muted)' }}>{formatTime(showtime.startTime)} · {showtime.screenFormat} · {showtime.roomName}</div>}
          </div>

          {/* Seats */}
          {selectedSeats?.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:.5, marginBottom:8 }}>VÉ XEM PHIM</div>
              {selectedSeats.map(s => (
                <div key={s.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-sec)', padding:'4px 0' }}>
                  <span>Ghế {s.rowLabel}{s.seatNumber} <span style={{ fontSize:11, color:'var(--text-muted)' }}>({s.seatType})</span></span>
                  <span style={{ color:'var(--text-pri)' }}>{formatCurrency(s.price)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Food items */}
          {orderItems.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:.5, marginBottom:8 }}>ĐỒ ĂN & THỨC UỐNG</div>
              {orderItems.map(f => (
                <div key={f.id} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-sec)', padding:'4px 0' }}>
                  <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginRight:8 }}>{f.name} ×{qty[f.id]}</span>
                  <span style={{ color:'var(--text-pri)', flexShrink:0 }}>{formatCurrency(qty[f.id]*f.basePrice)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ height:1, background:'var(--border)', marginBottom:14 }} />

          {/* Totals */}
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-sec)', padding:'4px 0' }}>
            <span>Vé phim ({selectedSeats?.length||0} ghế)</span>
            <span style={{ color:'var(--text-pri)' }}>{formatCurrency(ticketTotal)}</span>
          </div>
          {foodTotal > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-sec)', padding:'4px 0' }}>
              <span>Đồ ăn</span>
              <span style={{ color:'var(--text-pri)' }}>{formatCurrency(foodTotal)}</span>
            </div>
          )}
          <div style={{ height:1, background:'var(--border)', margin:'10px 0' }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:20, fontWeight:500, color:'var(--gold)', padding:'8px 0 18px' }}>
            <span>Tổng</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>

          <Button variant="primary" fullWidth size="lg" onClick={handleContinue} loading={saving}>
            Thanh toán →
          </Button>
          <button onClick={handleSkip} style={{ width:'100%', marginTop:10, background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif", padding:'8px 0', transition:'.15s' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--text-sec)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
          >Bỏ qua, chỉ mua vé</button>
        </div>
      </div>
    </>
  )
}
