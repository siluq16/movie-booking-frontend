import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import StepBar from '../../components/cinema/StepBar'
import Button from '../../components/common/Button'
import { paymentService, bookingService } from '../../services/movieService'
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

const METHODS = [
  { id:'vnpay',       label:'VNPay',               icon:'🏦', desc:'Thanh toán qua cổng VNPay — chuyển hướng bảo mật', color:'#1a6bb5' },
  { id:'momo',        label:'Ví MoMo',             icon:'📱', desc:'Quét mã QR từ ứng dụng MoMo',                      color:'#ae2070' },
  { id:'zalopay',     label:'ZaloPay',              icon:'💙', desc:'Thanh toán qua ví ZaloPay',                        color:'#0068ff' },
  { id:'credit_card', label:'Thẻ tín dụng / ghi nợ',icon:'💳', desc:'Visa, Mastercard, JCB, Napas',                   color:'#52c97c' },
  { id:'cash',        label:'Tiền mặt tại quầy',   icon:'💵', desc:'Thanh toán trực tiếp khi nhận vé tại rạp',        color:'var(--text-sec)' },
]

export default function PaymentPage() {
  const { bookingId } = useParams()
  const { state }     = useLocation()
  const navigate      = useNavigate()

  const [dbBooking, setDbBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()

  const { movie, showtime, booking, selectedSeats, foodItems = [], foodTotal = 0 } = state || {}

  const [method, setMethod] = useState('vnpay')
  const [paying, setPaying] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const [promoCode, setPromo] = useState('')
  const [promoApplied, setPromoApplied] = useState(null)
  const [applyingPromo, setApplyingPromo] = useState(false)

  const ticketTotal = selectedSeats?.reduce((a, s) => a + (s.price||0), 0) || booking?.totalAmount || 0
  const food        = foodTotal || foodItems?.reduce((a, f) => a + (f.subtotal||0), 0) || 0
  
  // SỬA LỖI 1: Lấy số tiền giảm giá và tổng tiền từ Database
  const discountAmt = dbBooking?.discountAmount || 0;
  const finalAmount = dbBooking ? dbBooking.finalAmount : (ticketTotal + food);

  useEffect(() => {
    const vnp_SecureHash = searchParams.get('vnp_SecureHash')
    if (vnp_SecureHash) {
      verifyVnPayTransaction()
    }
  }, [searchParams])

  const fetchLatestBooking = async () => {
    try {
      const res = await bookingService.getById(bookingId)
      setDbBooking(res.data)
      if (res.data?.discountAmount > 0) {
          setPromoApplied({ code: 'ĐÃ ÁP DỤNG MÃ' })
      }
    } catch (err) {
      toast.error("Không thể đồng bộ dữ liệu đơn hàng")
    }
  }

  useEffect(() => {
    fetchLatestBooking().finally(() => setLoading(false))
  }, [bookingId])

  const verifyVnPayTransaction = async () => {
    setVerifying(true)
    try {
      const queryString = window.location.search 
      const res = await paymentService.verifyVnPayReturn(queryString)

      if (res.data?.isSuccess) {
        const vnp_TransactionNo = searchParams.get('vnp_TransactionNo')
        const vnp_Amount = searchParams.get('vnp_Amount')

        try {
          await paymentService.process({
            bookingId: bookingId,
            method: 'vnpay',
            amount: Number(vnp_Amount) / 100, 
            transactionId: vnp_TransactionNo,
          })
        } catch (e) {
          console.log("Xử lý trạng thái Database:", e.message)
        }

        toast.success('Thanh toán VNPay thành công!')
        
        navigate(`/booking/${bookingId}/success`)
      } else {
        toast.error('Giao dịch không thành công hoặc đã bị hủy.')
        navigate(`/booking/${bookingId}/payment`, { replace: true })
      }
    } catch (err) {
      toast.error('Lỗi xác thực thanh toán VNPay.')
      navigate(`/booking/${bookingId}/payment`, { replace: true })
    } finally {
      setVerifying(false)
    }
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) { toast.error('Vui lòng nhập mã khuyến mãi'); return }
    if (promoApplied) { toast('Mã này đã được áp dụng'); return }
    setApplyingPromo(true)
    try {
      await bookingService.applyPromo(bookingId, promoCode.trim())
      await fetchLatestBooking()
      setPromoApplied({ code: promoCode.trim().toUpperCase() })
      toast.success('Áp dụng mã thành công!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã không hợp lệ hoặc đã hết hạn')
    } finally {
      setApplyingPromo(false)
    }
  }

  const removePromo = async () => { 
    try {
      await bookingService.removePromo(bookingId) 
      await fetchLatestBooking() 
      setPromoApplied(null)
      setPromo('')
      toast.success('Đã gỡ mã giảm giá')
    } catch(err) {
      toast.error('Không thể gỡ mã giảm giá lúc này')
    }
  }

  const handlePay = async () => {
    setPaying(true)
    try {
      if (finalAmount === 0) {
        await paymentService.process({
          bookingId,
          method: 'voucher',
          amount: 0,
          transactionId: `FREE-${Date.now()}`,
        })
        
        toast.success('Áp dụng mã 100% và đặt vé thành công!')
        navigate(`/booking/${bookingId}/success`, {
          state: { movie, showtime, booking, selectedSeats, foodItems, finalAmount: 0, method: 'voucher' }
        })
        return; 
      }

      if (method === 'vnpay') {
        const res = await paymentService.createVnPayUrl(bookingId)
        if (res.data?.paymentUrl) {
          window.location.href = res.data.paymentUrl
          return
        }
        throw new Error('Không nhận được URL thanh toán')
      }

      if (method === 'momo' || method === 'zalopay') {
        setShowQR(true) 
        setPaying(false) 
        return; 
      }

      await paymentService.process({
        bookingId,
        method,
        amount: finalAmount,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(2,8).toUpperCase()}`,
      })

      toast.success('Thanh toán thành công!')
      navigate(`/booking/${bookingId}/success`, {
        state: { movie, showtime, booking, selectedSeats, foodItems, finalAmount, method }
      })
    } catch (err) {
      const msg = err.response?.data?.message || err.message || ''
      if (msg.toLowerCase().includes('booking') || msg.toLowerCase().includes('đơn')) {
        toast.error('Đơn hàng không hợp lệ hoặc đã hết hạn. Vui lòng đặt lại.')
        navigate('/')
      } else {
        toast.error(msg || 'Thanh toán thất bại. Vui lòng thử lại.')
      }
    } finally {
      if (method !== 'momo' && method !== 'zalopay') setPaying(false)
    }
  }

  const handleSimulateScanSuccess = async () => {
    setShowQR(false)
    setPaying(true)
    try {
      await paymentService.process({
        bookingId,
        method, 
        amount: finalAmount,
        transactionId: `SIMULATED-${method.toUpperCase()}-${Date.now()}`,
      })

      toast.success(`Thanh toán ${method === 'momo' ? 'MoMo' : 'ZaloPay'} thành công!`)
      navigate(`/booking/${bookingId}/success`)
    } catch (err) {
      toast.error('Có lỗi khi chốt đơn. Vui lòng thử lại.')
      setPaying(false)
    }
  }

  const selectedMethod = METHODS.find(m => m.id === method)

  if (verifying) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: 'var(--gold)' }}>Đang xác thực thanh toán...</h2>
        <p style={{ color: 'var(--text-sec)', marginTop: 10 }}>Vui lòng không tải lại trang lúc này.</p>
      </div>
    )
  }

  return (
    <>
      <StepBar current={2} />
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'40px 5% 80px', display:'grid', gridTemplateColumns:'1fr minmax(300px,360px)', gap:32, alignItems:'start' }}>

        {/* ── LEFT: Payment methods ── */}
        <div>
          <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:'var(--text-sec)', cursor:'pointer', fontSize:14, fontFamily:"'DM Sans',sans-serif", marginBottom:24, display:'flex', alignItems:'center', gap:6, padding:0, transition:'.2s' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text-sec)'}>
            ← Quay lại
          </button>

          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(22px,3vw,28px)', marginBottom:28 }}>Phương Thức Thanh Toán</h2>

          {finalAmount > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
              {METHODS.map(m => {
                const isSelected = method === m.id
                return (
                  <button key={m.id} onClick={() => setMethod(m.id)} style={{ background:isSelected?`${m.color}12`:'var(--bg-card)', border:`1px solid ${isSelected?m.color:'var(--border)'}`, borderRadius:10, padding:'16px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:16, textAlign:'left', fontFamily:"'DM Sans',sans-serif", transition:'.2s', width:'100%' }}>
                    <span style={{ fontSize:26, flexShrink:0 }}>{m.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:isSelected?600:400, color:isSelected?m.color:'var(--text-pri)', marginBottom:2 }}>{m.label}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{m.desc}</div>
                    </div>
                    <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${isSelected?m.color:'var(--border)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {isSelected && <div style={{ width:9, height:9, borderRadius:'50%', background:m.color }} />}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div style={{ background:'rgba(82,201,124,.1)', border:'1px dashed var(--green)', borderRadius:10, padding:24, textAlign:'center', color:'var(--green)', marginBottom:28 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🎁</div>
              <strong style={{ fontSize: 16 }}>Đơn hàng miễn phí!</strong><br/>
              <span style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 6, display: 'inline-block' }}>Bạn không cần chọn phương thức thanh toán.</span>
            </div>
          )}

          <div style={{ background:'rgba(82,201,124,.05)', border:'1px solid rgba(82,201,124,.2)', borderRadius:8, padding:'14px 16px', fontSize:13, color:'var(--text-sec)', display:'flex', gap:10, alignItems:'flex-start' }}>
            <span style={{ fontSize:18, flexShrink:0 }}>🔒</span>
            <span>Giao dịch được mã hóa <strong style={{ color:'var(--text-pri)' }}>SSL 256-bit</strong>. Chúng tôi không lưu thông tin thẻ của bạn.</span>
          </div>

          {method === 'vnpay' && finalAmount > 0 && (
            <div style={{ marginTop:12, background:'rgba(26,107,181,.06)', border:'1px solid rgba(26,107,181,.2)', borderRadius:8, padding:'12px 16px', fontSize:12, color:'var(--text-sec)' }}>
              🏦 Bạn sẽ được chuyển sang trang VNPay để hoàn tất thanh toán. Vui lòng không đóng trình duyệt trong quá trình giao dịch.
            </div>
          )}
        </div>

        {/* ── RIGHT: Order confirmation ── */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:24, position:'sticky', top:90 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, marginBottom:20 }}>Xác Nhận Đơn Hàng</h3>

          <div style={{ background:'var(--bg-card2)', borderRadius:8, padding:'14px 16px', marginBottom:16 }}>
            {[
              ['🎬 Phim',      movie?.title],
              ['⏰ Suất chiếu', showtime ? `${formatTime(showtime.startTime)} · ${formatDate(showtime.startTime)}` : '—'],
              ['📽️ Định dạng', showtime?.screenFormat],
              ['🏛️ Phòng',     showtime?.roomName || showtime?.cinemaName],
              ['🪑 Ghế',       selectedSeats?.map(s=>`${s.rowLabel}${s.seatNumber}`).join(', ')],
            ].map(([label, val]) => val && (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', fontSize:13, borderBottom:'1px solid var(--border)' }}>
                <span style={{ color:'var(--text-muted)', flexShrink:0, marginRight:8 }}>{label}</span>
                <span style={{ color:'var(--text-pri)', textAlign:'right' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* GIAO DIỆN MÃ KHUYẾN MÃI */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 8 }}>Mã khuyến mãi</div>
            {promoApplied ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(82,201,124,.08)', border: '1px solid rgba(82,201,124,.3)', borderRadius: 6 }}>
                {/* SỬA LỖI 3: Hiển thị đúng số tiền discountAmt từ Database */}
                <span style={{ fontSize: 12, color: 'var(--green)', flex: 1 }}>✓ {promoApplied.code} — Giảm {formatCurrency(discountAmt)}</span>
                <button onClick={removePromo} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={promoCode} onChange={e => setPromo(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                  placeholder="Nhập mã giảm giá..." maxLength={30}
                  style={{ flex: 1, background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text-pri)', fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: 'none' }}
                />
                <button onClick={handleApplyPromo} disabled={applyingPromo} style={{ background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '8px 12px', borderRadius: 6, cursor: applyingPromo ? 'not-allowed' : 'pointer', fontSize: 12 }}>
                  {applyingPromo ? '...' : 'Áp dụng'}
                </button>
              </div>
            )}
          </div>

          <div style={{ height:1, background:'var(--border)', margin:'12px 0' }} />

          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-sec)', padding:'5px 0' }}>
            <span>Vé phim ({selectedSeats?.length||0} ghế)</span>
            <span style={{ color:'var(--text-pri)' }}>{formatCurrency(ticketTotal)}</span>
          </div>
          {food > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-sec)', padding:'5px 0' }}>
              <span>Đồ ăn & thức uống</span>
              <span style={{ color:'var(--text-pri)' }}>{formatCurrency(food)}</span>
            </div>
          )}
          {discountAmt > 0 && (
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--green)', padding:'5px 0' }}>
              <span>Giảm giá</span>
              <span>−{formatCurrency(discountAmt)}</span>
            </div>
          )}

          <div style={{ height:1, background:'var(--border)', margin:'12px 0' }} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:22, fontWeight:500, color:'var(--gold)', padding:'8px 0 20px' }}>
            <span>Tổng cộng</span>
            <span>{formatCurrency(finalAmount)}</span>
          </div>

          <Button variant="primary" fullWidth size="lg" onClick={handlePay} loading={paying}>
            {paying ? '⏳ Đang xử lý...' : (finalAmount === 0 ? 'Xác Nhận Đặt Vé' : `${selectedMethod?.icon} Thanh Toán ${formatCurrency(finalAmount)}`)}
          </Button>

          <div style={{ textAlign:'center', fontSize:12, color:'var(--text-muted)', marginTop:12, lineHeight:1.5 }}>
            Nhấn "{finalAmount === 0 ? 'Xác Nhận Đặt Vé' : 'Thanh Toán'}" đồng nghĩa bạn đồng ý với{' '}
            <span style={{ color:'var(--gold)', cursor:'pointer' }}>Điều khoản dịch vụ</span>{' '}
            của CineMax.
          </div>
        </div>
      </div>
      {showQR && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(10,10,12,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn .2s ease' }}>
          <div style={{ background: 'var(--bg-card)', border: `1px solid ${method === 'momo' ? '#ae2070' : '#0068ff'}`, borderRadius: 16, padding: '32px 40px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: `0 20px 60px ${method === 'momo' ? 'rgba(174,32,112,0.15)' : 'rgba(0,104,255,0.15)'}`, position: 'relative' }}>
            
            <button onClick={() => setShowQR(false)} style={{ position: 'absolute', top: 16, right: 20, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 24, cursor: 'pointer' }}>×</button>
            
            <div style={{ fontSize: 40, marginBottom: 10 }}>{selectedMethod?.icon}</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: method === 'momo' ? '#ae2070' : '#0068ff', marginBottom: 6 }}>
              Thanh toán {selectedMethod?.label}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 24 }}>
              Mở ứng dụng {selectedMethod?.label} trên điện thoại để quét mã QR bên dưới.
            </p>

            <div style={{ background: '#fff', padding: 16, borderRadius: 12, display: 'inline-block', marginBottom: 24, border: '1px solid var(--border)' }}>
              <img 
                src={`https://img.vietqr.io/image/970436-1044914473-compact2.png?amount=${finalAmount}&addInfo=Thanh toan ve ${booking?.bookingCode || bookingId.substring(0,6)}&accountName=HOANG MANH QUAN`} 
                alt="QR Thanh Toán VietQR" 
                style={{ width: '100%', maxWidth: 280, height: 'auto', display: 'block', margin: '0 auto' }} 
              />
            </div>

            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--gold)', marginBottom: 24 }}>
              {formatCurrency(finalAmount)}
            </div>

            <Button variant="primary" fullWidth size="lg" onClick={handleSimulateScanSuccess} style={{ background: method === 'momo' ? '#ae2070' : '#0068ff', color: '#fff', border: 'none' }}>
              ✓ Giả lập quét thành công
            </Button>
          </div>
        </div>
      )}
    </>
  )
}