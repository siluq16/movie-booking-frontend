import { useState, useEffect } from 'react'
import { notificationService } from '../../services/movieService'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'

const TYPE_INFO = {
  booking_confirmed: { icon:'🎟️', color:'var(--green)',    label:'Đặt vé thành công' },
  booking_cancelled: { icon:'❌',  color:'var(--red)',      label:'Vé bị hủy' },
  payment_success:   { icon:'💰',  color:'var(--gold)',     label:'Thanh toán thành công' },
  showtime_reminder: { icon:'⏰',  color:'#4a9fd0',        label:'Nhắc lịch chiếu' },
  promotion:         { icon:'🎁',  color:'#a07ad0',        label:'Khuyến mãi' },
  system:            { icon:'📢',  color:'var(--text-sec)', label:'Hệ thống' },
}

function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff/60000)
  if (m < 1)  return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m/60)
  if (h < 24) return `${h} giờ trước`
  const day = Math.floor(h/24)
  if (day < 30) return `${day} ngày trước`
  return new Date(d).toLocaleDateString('vi-VN')
}

export default function NotificationsPage() {
  const [notifications, setNoti] = useState([])
  const [loading, setLoading]    = useState(true)
  const [filter, setFilter]      = useState('all')
  const [marking, setMarking]    = useState(false)

  // THÊM STATE CHO PHÂN TRANG
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5 // Có thể tăng lên 7 hoặc 10 tùy ý bạn

  const load = () => {
    setLoading(true)
    notificationService.getAll()
      .then(r => setNoti(Array.isArray(r.data) ? r.data : []))
      .catch(() => setNoti([]))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  // Reset về trang 1 mỗi khi đổi tab filter
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id)
      setNoti(p => p.map(n => n.id===id ? { ...n, isRead:true } : n))
    } catch {}
  }

  const markAll = async () => {
    setMarking(true)
    try {
      await notificationService.markAllRead()
      setNoti(p => p.map(n => ({ ...n, isRead:true })))
      toast.success('Đã đánh dấu đọc tất cả')
    } catch { toast.error('Có lỗi xảy ra') }
    finally { setMarking(false) }
  }

  const unread = notifications.filter(n => !n.isRead).length

  // 1. Sắp xếp thông báo mới nhất lên đầu
  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // 2. Lọc theo trạng thái (tất cả / chưa đọc / đã đọc)
  const filtered = sortedNotifications.filter(n => filter==='all'?true:filter==='unread'?!n.isRead:n.isRead)

  // 3. Tính toán phân trang
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentNotifications = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  return (
    <div style={{ maxWidth:720, margin:'0 auto', padding:'48px 5% 80px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:30, marginBottom:6 }}>Thông <span style={{ color:'var(--gold)' }}>Báo</span></h1>
          {unread > 0 && <div style={{ fontSize:14, color:'var(--text-sec)' }}>Có <span style={{ color:'var(--gold)', fontWeight:500 }}>{unread}</span> thông báo chưa đọc</div>}
        </div>
        {unread > 0 && (
          <button onClick={markAll} disabled={marking} style={{ background:'rgba(201,168,76,.1)', border:'1px solid var(--border-gold)', color:'var(--gold)', borderRadius:6, padding:'8px 18px', cursor:marking?'not-allowed':'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif", opacity:marking?.6:1 }}>
            {marking ? '⏳ Đang xử lý...' : '✓ Đánh dấu đọc tất cả'}
          </button>
        )}
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['all','Tất cả',notifications.length],['unread','Chưa đọc',unread],['read','Đã đọc',notifications.length-unread]].map(([v,l,c]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ background:'none', border:'none', color:filter===v?'var(--gold)':'var(--text-sec)', fontSize:14, padding:'10px 20px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", borderBottom:`2px solid ${filter===v?'var(--gold)':'transparent'}`, marginBottom:-1 }}>
            {l} <span style={{ fontSize:11, opacity:.6 }}>({c})</span>
          </button>
        ))}
      </div>

      {loading ? <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size="lg" /></div>
        : filtered.length===0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-muted)' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🔔</div>
          <div style={{ fontSize:16, color:'var(--text-sec)', marginBottom:8 }}>{filter==='unread'?'Không có thông báo chưa đọc':'Chưa có thông báo nào'}</div>
          <div style={{ fontSize:13 }}>Thông báo về vé, khuyến mãi sẽ xuất hiện tại đây</div>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {/* Render danh sách đã cắt theo trang */}
            {currentNotifications.map(n => {
              const t = TYPE_INFO[n.type] || TYPE_INFO.system
              return (
                <div key={n.id} onClick={() => !n.isRead && markRead(n.id)} style={{ background:n.isRead?'var(--bg-card)':'var(--bg-card2)', border:`1px solid ${n.isRead?'var(--border)':'rgba(201,168,76,.25)'}`, borderRadius:10, padding:'16px 18px', cursor:n.isRead?'default':'pointer', transition:'.2s', position:'relative', overflow:'hidden' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-gold)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=n.isRead?'var(--border)':'rgba(201,168,76,.25)'}
                >
                  {!n.isRead && <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'var(--gold)', borderRadius:'3px 0 0 3px' }} />}
                  <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                    <div style={{ width:42, height:42, borderRadius:10, background:`${t.color}18`, border:`1px solid ${t.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{t.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                        <span style={{ fontSize:10, color:t.color, background:`${t.color}18`, border:`1px solid ${t.color}33`, padding:'2px 8px', borderRadius:2, fontWeight:600 }}>{t.label}</span>
                        <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:'auto' }}>{timeAgo(n.createdAt)}</span>
                        {!n.isRead && <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--gold)', flexShrink:0 }} />}
                      </div>
                      <div style={{ fontSize:14, fontWeight:n.isRead?400:600, color:n.isRead?'var(--text-sec)':'var(--text-pri)', marginBottom:4 }}>{n.title}</div>
                      <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>{n.body}</div>
                      {!n.isRead && <div style={{ fontSize:11, color:'var(--gold)', marginTop:8, opacity:.7 }}>Nhấn để đánh dấu đã đọc</div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* GIAO DIỆN NÚT PHÂN TRANG */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 28 }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-pri)', padding: '6px 14px', borderRadius: 6, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: '.2s' }}
              >
                ← Mới hơn
              </button>
              
              <div style={{ fontSize: 14, color: 'var(--text-sec)' }}>
                Trang <strong style={{ color: 'var(--gold)' }}>{currentPage}</strong> / {totalPages}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-pri)', padding: '6px 14px', borderRadius: 6, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: '.2s' }}
              >
                Cũ hơn →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}