import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import StepBar from '../../components/cinema/StepBar'
import Spinner from '../../components/common/Spinner'
import Button from '../../components/common/Button'
import { showtimeService, bookingService } from '../../services/movieService'
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// Seat style theo loại — khớp với backend SeatType
const SEAT_CONFIG = {
  standard: { bg:'var(--bg-card2)',          border:'rgba(120,120,120,.5)', color:'var(--text-sec)', label:'Thường' },
  vip:      { bg:'rgba(201,168,76,.12)',      border:'rgba(201,168,76,.55)', color:'#c9a84c',         label:'VIP' },
  couple:   { bg:'rgba(130,100,200,.12)',     border:'rgba(130,100,200,.55)',color:'#a07ad0',         label:'Couple' },
  recliner: { bg:'rgba(30,180,120,.12)',      border:'rgba(30,180,120,.55)', color:'#52c97c',         label:'Recliner' },
  sweetbox: { bg:'rgba(200,60,120,.12)',      border:'rgba(200,60,120,.55)', color:'#e06090',         label:'Sweetbox' },
}

// Normalise seat object từ API: backend trả seatId, frontend dùng id
function normalizeSeat(raw) {
  return {
    id:         raw.seatId   ?? raw.id,      // API dùng seatId
    seatType:   raw.seatType ?? 'standard',
    rowLabel:   raw.rowLabel,
    seatNumber: raw.seatNumber,
    price:      raw.price    ?? 0,
    isBooked:   raw.isBooked ?? false,       // true nếu đã bị đặt
    xPosition:  raw.xPosition,
    yPosition:  raw.yPosition,
  }
}

function SeatBtn({ seat, isSelected, onClick }) {
  const { isBooked, seatType } = seat
  const isCouple = seatType === 'couple'
  const cfg = SEAT_CONFIG[seatType] || SEAT_CONFIG.standard

  let bg     = cfg.bg
  let border = cfg.border
  let txtCol = cfg.color

  if (isBooked) {
    bg = 'rgba(35,18,18,.9)'; border = 'rgba(70,35,35,.6)'; txtCol = 'var(--text-muted)'
  } else if (isSelected) {
    bg = 'var(--gold)'; border = '#e8c86e'; txtCol = '#000'
  }

  return (
    <div
      onClick={() => !isBooked && onClick(seat)}
      title={`${seat.rowLabel}${seat.seatNumber} · ${cfg.label} · ${formatCurrency(seat.price)}`}
      style={{
        width: isCouple ? 54 : 28, height: 24,
        borderRadius: '4px 4px 2px 2px',
        background: bg, border: `1px solid ${border}`,
        cursor: isBooked ? 'not-allowed' : 'pointer',
        opacity: isBooked ? .4 : 1,
        transition: 'transform .1s, box-shadow .1s',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: txtCol, fontWeight: 700, userSelect: 'none',
      }}
      onMouseEnter={e => {
        if (!isBooked && !isSelected) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,.35)'
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      {isSelected ? '✓' : ''}
    </div>
  )
}

export default function SeatSelectionPage() {
  const { showtimeId } = useParams()
  const { state }      = useLocation()
  const navigate       = useNavigate()
  const { user }       = useAuth()

  const movie    = state?.movie
  const showtime = state?.showtime

  const [seats, setSeats]         = useState([])
  const [selected, setSelected]   = useState([])  // array of normalized seat objects
  const [loading, setLoading]     = useState(true)
  const [booking, setBooking]     = useState(false)
  const [showtimeInfo, setSTI]    = useState(showtime)

  useEffect(() => {
    const initSeatMap = async () => {
      try {
        setLoading(true);
        if (user?.id) {
            try {
                await bookingService.clearPending(showtimeId);
            } catch (e) { console.log("Lỗi khi dọn giỏ hàng:", e); }
        }

        // 2. SAU ĐÓ MỚI FETCH SƠ ĐỒ GHẾ MỚI NHẤT
        const res = await showtimeService.getSeats(showtimeId);
        const raw = Array.isArray(res.data) ? res.data : [];
        setSeats(raw.map(normalizeSeat));
      } catch (err) {
        setSeats([]);
      } finally {
        setLoading(false);
      }
    };

    initSeatMap();

    if (!showtime) {
      showtimeService.getById(showtimeId)
        .then(res => setSTI(res.data))
        .catch(() => {})
    }
  }, [showtimeId, user?.id]); // Thêm user?.id vào dependency array

  const toggleSeat = (seat) => {
    if (!seat.id && seat.id !== 0) return  // guard: id chưa có
    setSelected(prev => {
      const exists = prev.some(s => s.id === seat.id)
      return exists ? prev.filter(s => s.id !== seat.id) : [...prev, seat]
    })
  }

  const rows       = [...new Set(seats.map(s => s.rowLabel))].sort()
  const totalPrice = selected.reduce((a, s) => a + (s.price || 0), 0)

  const byType = selected.reduce((acc, s) => {
    const k = s.seatType || 'standard'
    if (!acc[k]) acc[k] = []
    acc[k].push(s)
    return acc
  }, {})

  const handleContinue = async () => {
    if (selected.length === 0) { toast.error('Vui lòng chọn ít nhất 1 ghế'); return }
    if (!user?.id) { toast.error('Vui lòng đăng nhập để tiếp tục'); navigate('/login'); return }
    setBooking(true)
    try {
      const res = await bookingService.create({
        userId:     user.id,
        showtimeId,
        seatIds:    selected.map(s => s.id),
      })
      navigate(`/booking/${res.data.id}/food`, {
        state: { movie, showtime: showtimeInfo || showtime, booking: res.data, selectedSeats: selected }
      })
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (msg.toLowerCase().includes('ghế') || msg.toLowerCase().includes('seat')) {
        toast.error('Một số ghế vừa bị người khác đặt. Vui lòng chọn lại.')
        setSelected([])
        showtimeService.getSeats(showtimeId)
          .then(r => setSeats((Array.isArray(r.data)?r.data:[]).map(normalizeSeat)))
          .catch(()=>{})
      } else {
        toast.error(msg || 'Không thể đặt ghế, vui lòng thử lại')
      }
    } finally {
      setBooking(false)
    }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'70vh' }}>
      <Spinner size="lg" />
    </div>
  )

  const st = showtimeInfo || showtime

  return (
    <>
      <StepBar current={0} />
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 5% 80px' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(22px,3vw,30px)', marginBottom:8 }}>
            {movie?.title || 'Chọn Ghế Ngồi'}
          </h2>
          {st && (
            <div style={{ color:'var(--text-sec)', fontSize:14, display:'flex', justifyContent:'center', gap:20, flexWrap:'wrap' }}>
              {st.startTime && <span>⏰ {formatTime(st.startTime)}</span>}
              {st.screenFormat && <span>📽️ {st.screenFormat}</span>}
              {st.roomName && <span>🏛️ {st.roomName}</span>}
              {st.cinemaName && <span>📍 {st.cinemaName}</span>}
            </div>
          )}
        </div>

        {/* Screen */}
        <div style={{ textAlign:'center', marginBottom:40, padding:'0 10%' }}>
          <div style={{ height:4, background:'linear-gradient(to right,transparent,var(--gold),transparent)', borderRadius:4, marginBottom:8 }} />
          <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:3 }}>MÀN HÌNH</div>
        </div>

        {seats.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 20px', color:'var(--text-muted)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🪑</div>
            <div style={{ fontSize:15, color:'var(--text-sec)' }}>Chưa có sơ đồ ghế cho suất chiếu này</div>
          </div>
        ) : (
          <>
            {/* Seat grid */}
            <div style={{ overflowX:'auto', paddingBottom:8 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:7, alignItems:'center', minWidth:'fit-content', margin:'0 auto' }}>
                {rows.map(row => (
                  <div key={row} style={{ display:'flex', gap:5, alignItems:'center' }}>
                    <span style={{ width:22, textAlign:'right', fontSize:12, color:'var(--text-muted)', flexShrink:0, fontWeight:500 }}>{row}</span>
                    <div style={{ display:'flex', gap:5 }}>
                      {seats
                        .filter(s => s.rowLabel === row)
                        .sort((a,b) => a.seatNumber - b.seatNumber)
                        .map(seat => (
                          <SeatBtn
                            key={seat.id ?? `${row}-${seat.seatNumber}`}
                            seat={seat}
                            isSelected={selected.some(s => s.id === seat.id)}
                            onClick={toggleSeat}
                          />
                        ))}
                    </div>
                    <span style={{ width:22, fontSize:12, color:'var(--text-muted)', flexShrink:0 }}>{row}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:16, marginTop:28, marginBottom:12 }}>
              {Object.entries(SEAT_CONFIG).map(([type, cfg]) => (
                <div key={type} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'var(--text-sec)' }}>
                  <div style={{ width:22, height:18, borderRadius:'3px 3px 2px 2px', background:cfg.bg, border:`1px solid ${cfg.border}` }} />
                  {cfg.label}
                </div>
              ))}
              <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'var(--text-sec)' }}>
                <div style={{ width:22, height:18, borderRadius:'3px 3px 2px 2px', background:'rgba(35,18,18,.9)', border:'1px solid rgba(70,35,35,.6)', opacity:.5 }} />
                Đã đặt
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'var(--text-sec)' }}>
                <div style={{ width:22, height:18, borderRadius:'3px 3px 2px 2px', background:'var(--gold)', border:'1px solid #e8c86e' }} />
                Đang chọn
              </div>
            </div>

            {/* Price reference */}
            <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:20, marginBottom:36, fontSize:13, color:'var(--text-sec)' }}>
              {Object.entries(
                seats.reduce((acc, s) => {
                  if (!acc[s.seatType] && s.price) acc[s.seatType] = s.price
                  return acc
                }, {})
              ).map(([type, price]) => (
                <span key={type}>{SEAT_CONFIG[type]?.label||type}: <span style={{ color:'var(--gold)', fontWeight:500 }}>{formatCurrency(price)}</span></span>
              ))}
            </div>
          </>
        )}

        {/* Summary panel */}
        {selected.length > 0 && (
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-gold)', borderRadius:10, padding:'22px 24px', maxWidth:500, margin:'0 auto', animation:'fadeInUp .25s ease' }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, marginBottom:16 }}>
              Đã chọn <span style={{ color:'var(--gold)' }}>{selected.length}</span> ghế
            </div>

            {Object.entries(byType).map(([type, seatList]) => {
              const priceEach = seatList[0]?.price || 0
              const cfg = SEAT_CONFIG[type] || SEAT_CONFIG.standard
              return (
                <div key={type} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:14, borderBottom:'1px solid var(--border)', alignItems:'flex-start' }}>
                  <div>
                    <span style={{ color: cfg.color, fontWeight:500 }}>{cfg.label}</span>
                    <span style={{ color:'var(--text-muted)', fontSize:12, marginLeft:6 }}>
                      ({seatList.map(s => `${s.rowLabel}${s.seatNumber}`).join(', ')})
                    </span>
                  </div>
                  <span style={{ color:'var(--text-pri)', flexShrink:0, marginLeft:12 }}>
                    {seatList.length > 1 && <span style={{ color:'var(--text-muted)', fontSize:12, marginRight:4 }}>{seatList.length}×</span>}
                    {formatCurrency(priceEach * seatList.length)}
                  </span>
                </div>
              )
            })}

            <div style={{ display:'flex', justifyContent:'space-between', padding:'14px 0 0', fontSize:20, fontWeight:500, color:'var(--gold)' }}>
              <span>Tổng</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16, marginTop:4 }}>
              ⏳ Ghế được giữ trong <strong style={{ color:'var(--gold)' }}>10 phút</strong> sau khi đặt
            </div>

            <Button variant="primary" fullWidth size="lg" onClick={handleContinue} loading={booking}>
              Tiếp tục — Chọn đồ ăn →
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
