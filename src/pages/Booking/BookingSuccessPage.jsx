import { useEffect, useState, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { bookingService } from '../../services/movieService' // Gọi API bookingService
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters'
import Button from '../../components/common/Button'
import toast from 'react-hot-toast'

const METHOD_LABEL = {
  vnpay:'VNPay', momo:'Ví MoMo', zalopay:'ZaloPay',
  credit_card:'Thẻ tín dụng', cash:'Tiền mặt tại quầy',
}

export default function BookingSuccessPage() {
  const { bookingId } = useParams()
  const { state }     = useLocation()
  const navigate      = useNavigate()
  const triggered     = useRef(false)

  const hasValidState = state && state.movie;
  const [bookingData, setBookingData] = useState(hasValidState ? state : null)
  const [loading, setLoading] = useState(!hasValidState)

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!triggered.current) { triggered.current = true }

    // Nếu không có state hợp lệ thì GỌI API LẤY MỚI NHẤT
    if (!hasValidState && bookingId) {
      fetchBookingDetails()
    }
  }, [bookingId, state])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      const res = await bookingService.getById(bookingId) 
      
      if (res.data) {
        const b = res.data
        setBookingData({
          booking: b,
          showtime: b.showtime || {
            startTime: b.startTime,
            screenFormat: b.screenFormat || '2D', // Tùy backend của bạn
            roomName: b.roomName,
            cinemaName: b.cinemaName
          },
          movie: b.showtime?.movie || {
            title: b.movieTitle
          },
          selectedSeats: b.seats || b.bookingSeats?.map(bs => ({
            rowLabel: bs.seat?.rowLabel || bs.rowLabel,
            seatNumber: bs.seat?.seatNumber || bs.seatNumber,
            price: bs.price
          })) || [],
          foodItems: b.foodItems || b.foodOrders?.flatMap(fo => fo.foodOrderItems?.map(foi => ({
            name: foi.foodItem?.name || foi.foodName,
            quantity: foi.quantity,
            subtotal: (foi.quantity * foi.unitPrice) || foi.subTotal
          }))) || [],
          finalAmount: b.finalAmount,
          method: b.payment?.method || b.paymentMethod || 'vnpay' 
        })
      }
    } catch (err) {
      toast.error('Không thể tải chi tiết vé. Vui lòng kiểm tra trong Lịch sử.')
      navigate('/') 
    } finally {
      setLoading(false)
    }
  }
  // --- TRÍCH XUẤT DỮ LIỆU ĐỂ RENDER ---
  const { movie, showtime, booking, selectedSeats, foodItems = [], finalAmount, method } = bookingData || {}

  const bookingCode = booking?.bookingCode || '—'
  const ticketTotal = selectedSeats?.reduce((a, s) => a + (s.price||0), 0) || 0
  const foodTotal   = booking?.foodTotal || booking?.foodAmount || foodItems?.reduce((a, f) => a + (f.subtotal || f.subTotal || 0), 0) || 0
  const discountAmt = booking?.discountAmount || 0

  // Màn hình Loading mượt mà trong lúc gọi API
  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid var(--border-gold)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: 16, color: 'var(--text-sec)', fontFamily: "'DM Sans', sans-serif" }}>Đang tải thông tin vé...</p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'80vh', padding:'60px 5%', background:'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,.06) 0%, transparent 60%)' }}>
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-gold)', borderRadius:16, padding:'48px 40px', maxWidth:500, width:'100%', textAlign:'center', animation:'fadeInUp .5s ease', boxShadow:'0 24px 64px rgba(201,168,76,.08)' }}>

        <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,rgba(82,201,124,.2),rgba(82,201,124,.1))', border:'2px solid var(--green)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:36, boxShadow:'0 0 0 8px rgba(82,201,124,.06)' }}>
          ✓
        </div>

        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, marginBottom:8 }}>Đặt Vé Thành Công!</h2>
        <p style={{ color:'var(--text-sec)', fontSize:14, marginBottom:28 }}>Xuất trình mã vé dưới đây tại quầy nhận vé</p>

        <div style={{ 
          background:'rgba(201,168,76,.08)', 
          border:'1px dashed var(--border-gold)', 
          borderRadius:10, 
          padding:'24px', 
          marginBottom:28, 
          position:'relative', 
          overflow:'hidden',
          display: 'flex',          
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 16                   // Khoảng cách giữa QR và Text
        }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(201,168,76,.04) 0%, transparent 60%)', pointerEvents:'none' }} />
          <div style={{ background: '#fff', padding: 0, borderRadius: 8, zIndex: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <img 
              src={`https://quickchart.io/qr?text=${bookingCode}&size=220`} 
              alt="Mã QR Vé" 
              style={{ display: 'block', width: 220, height: 220 }}
            />
          </div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:38, color:'var(--gold)', letterSpacing:8, zIndex: 1, fontWeight: 600 }}>
            {bookingCode}
          </div>
        </div>

        <div style={{ background:'var(--bg-card2)', borderRadius:10, padding:'16px 20px', marginBottom:20, textAlign:'left' }}>
          {[
            ['🎬 Phim',        movie?.title],
            ['⏰ Suất chiếu',  showtime?.startTime ? `${formatTime(showtime.startTime)} · ${formatDate(showtime.startTime)}` : '—'],
            ['📽️ Định dạng',  showtime?.screenFormat],
            ['🏛️ Phòng chiếu', showtime?.roomName || showtime?.cinemaName],
            ['🪑 Ghế',         selectedSeats?.map(s=>`${s.rowLabel}${s.seatNumber}`).join(', ')],
            ...(foodItems?.length > 0 ? [['🍿 Đồ ăn', foodItems.map(f => `${f.name || f.foodName} × ${f.quantity}`).join(', ')]] : []),
            ...(method ? [['💳 Thanh toán', METHOD_LABEL[method]||method]] : []),
          ].map(([label, val]) => val && (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', fontSize:13, borderBottom:'1px solid var(--border)' }}>
              <span style={{ color:'var(--text-muted)', flexShrink:0, marginRight:8 }}>{label}</span>
              <span style={{ color:'var(--text-pri)', fontWeight:500, textAlign:'right', maxWidth:'60%' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Price summary */}
        {(ticketTotal > 0 || foodTotal > 0 || finalAmount > 0) && (
          <div style={{ marginBottom:20, textAlign:'left' }}>
            {ticketTotal > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-sec)', padding:'3px 0' }}>
                <span>Vé phim</span><span style={{ color:'var(--text-pri)' }}>{formatCurrency(ticketTotal)}</span>
              </div>
            )}
            {foodTotal > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-sec)', padding:'3px 0' }}>
                <span>Đồ ăn</span><span style={{ color:'var(--text-pri)' }}>{formatCurrency(foodTotal)}</span>
              </div>
            )}
            {discountAmt > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--green)', padding:'3px 0' }}>
                <span>Giảm giá khuyến mãi</span>
                <span>−{formatCurrency(discountAmt)}</span>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:500, color:'var(--gold)', padding:'8px 0 0', borderTop:'1px solid var(--border)', marginTop:6 }}>
              <span>Tổng đã thanh toán</span>
              <span>{formatCurrency(finalAmount || ticketTotal + foodTotal)}</span>
            </div>
          </div>
        )}

        {/* Notice */}
        <div style={{ background:'rgba(201,168,76,.06)', border:'1px solid var(--border-gold)', borderRadius:8, padding:'12px 14px', marginBottom:24, fontSize:13, color:'var(--text-sec)', lineHeight:1.6 }}>
          📧 Vé đã được gửi tới email của bạn.<br />
          ⏰ Vui lòng đến trước <strong style={{ color:'var(--gold)' }}>15 phút</strong> để nhận vé và đồ ăn.
        </div>

        {/* CTA buttons */}
        <div style={{ display:'flex', gap:10, flexDirection:'column' }}>
          <Button variant="primary" fullWidth size="lg" onClick={() => navigate('/')}>
            🎬 Về trang chủ
          </Button>
          <Button variant="ghost" fullWidth size="md" onClick={() => navigate('/profile', { state: { tab: 'history' } })}>
            📋 Xem lịch sử vé của tôi
          </Button>
        </div>
      </div>
    </div>
  )
}