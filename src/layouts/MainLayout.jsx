import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { notificationService } from '../services/movieService'

// ── Notification Bell ─────────────────────────────────────────────────────────
function NotificationBell() {
  const navigate = useNavigate()
  const [unread, setUnread]       = useState(0)
  const [preview, setPreview]     = useState([])
  const [open, setOpen]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const panelRef                  = useRef(null)

  // Load unread count
  useEffect(() => {
    const fetch = () => {
      notificationService.getUnreadCount()
        .then(r => setUnread(r.data?.unreadCount ?? 0))
        .catch(() => {})
    }
    fetch()
    const t = setInterval(fetch, 60000) // poll mỗi 1 phút
    return () => clearInterval(t)
  }, [])

  // Load preview khi mở
  useEffect(() => {
    if (!open) return
    setLoading(true)
    notificationService.getAll()
      .then(r => setPreview(Array.isArray(r.data) ? r.data.slice(0, 5) : []))
      .catch(() => setPreview([]))
      .finally(() => setLoading(false))
  }, [open])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const TYPE_ICON = {
    booking_confirmed:'🎟️', booking_cancelled:'❌', payment_success:'💰',
    showtime_reminder:'⏰', promotion:'🎁', system:'📢',
  }

  function timeAgo(d) {
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff/60000)
    if (m < 1)  return 'Vừa xong'
    if (m < 60) return `${m} phút`
    const h = Math.floor(m/60)
    if (h < 24) return `${h} giờ`
    return `${Math.floor(h/24)} ngày`
  }

  const markRead = async (id, e) => {
    e.stopPropagation()
    try {
      await notificationService.markRead(id)
      setPreview(p => p.map(n => n.id===id ? { ...n, isRead:true } : n))
      setUnread(u => Math.max(0, u-1))
    } catch {}
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead()
      setUnread(0) 
      setPreview(prev => prev.map(n => ({ ...n, isRead: true }))) 
    } catch (error) {
      console.error("Lỗi khi đánh dấu đọc tất cả", error)
    }
  }

  return (
    <div ref={panelRef} style={{ position:'relative' }}>
      {/* Bell button */}
      <button onClick={() => setOpen(o => !o)} style={{ position:'relative', background:open?'rgba(201,168,76,.12)':'none', border:`1px solid ${open?'var(--border-gold)':'transparent'}`, borderRadius:8, width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'.2s', color:'var(--text-sec)' }}
        onMouseEnter={e => { e.currentTarget.style.background='rgba(201,168,76,.08)'; e.currentTarget.style.borderColor='var(--border-gold)'; e.currentTarget.style.color='var(--gold)' }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='var(--text-sec)' } }}
      >
        {/* Bell SVG */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>

        {/* Badge */}
        {unread > 0 && (
          <div style={{ position:'absolute', top:4, right:4, minWidth:16, height:16, background:'var(--red)', borderRadius:8, fontSize:9, fontWeight:700, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px', border:'2px solid var(--bg-dark)', lineHeight:1 }}>
            {unread > 99 ? '99+' : unread}
          </div>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:340, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, boxShadow:'0 12px 40px rgba(0,0,0,.5)', overflow:'hidden', zIndex:200, animation:'fadeInUp .15s ease' }}>
          {/* Panel header */}
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <span style={{ fontSize:14, fontWeight:500 }}>Thông báo</span>
              {unread > 0 && <span style={{ marginLeft:8, fontSize:11, background:'var(--gold)', color:'#000', padding:'1px 7px', borderRadius:8, fontWeight:600 }}>{unread}</span>}
            </div>
            <button onClick={handleMarkAllRead} style={{ background:'none', border:'none', color:'var(--gold)', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              Đọc tất cả →
            </button>
          </div>

          {/* List */}
          <div style={{ maxHeight:360, overflowY:'auto' }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:24, color:'var(--text-muted)', fontSize:13 }}>Đang tải...</div>
            ) : preview.length === 0 ? (
              <div style={{ textAlign:'center', padding:32, color:'var(--text-muted)' }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🔔</div>
                <div style={{ fontSize:13 }}>Chưa có thông báo nào</div>
              </div>
            ) : preview.map(n => (
              <div key={n.id} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', background:n.isRead?'':'rgba(201,168,76,.04)', display:'flex', gap:12, alignItems:'flex-start', cursor:'pointer', transition:'.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg-card2)'}
                onMouseLeave={e => e.currentTarget.style.background=n.isRead?'':'rgba(201,168,76,.04)'}
                onClick={() => { navigate('/notifications'); setOpen(false) }}
              >
                {!n.isRead && <div style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', width:6, height:6, borderRadius:'50%', background:'var(--gold)' }} />}
                <div style={{ fontSize:20, flexShrink:0 }}>{TYPE_ICON[n.type]||'📢'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:n.isRead?400:500, color:n.isRead?'var(--text-sec)':'var(--text-pri)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:2 }}>{n.title}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.body}</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                  <span style={{ fontSize:10, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{timeAgo(n.createdAt)}</span>
                  {!n.isRead && (
                    <button onClick={(e) => markRead(n.id, e)} style={{ background:'none', border:'none', color:'var(--gold)', fontSize:10, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", padding:0 }}>✓ Đọc</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', textAlign:'center' }}>
            <button onClick={() => { navigate('/notifications'); setOpen(false) }} style={{ background:'none', border:'none', color:'var(--gold)', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
              Xem tất cả thông báo →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(10,10,12,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid var(--border)' }}>
      <div style={{ maxWidth:1400, margin:'0 auto', padding:'0 5%', display:'flex', alignItems:'center', justifyContent:'space-between', height:68 }}>

        {/* Logo */}
        <Link to="/" style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:'var(--gold)', letterSpacing:2, textDecoration:'none' }}>
          CINE<span style={{ color:'var(--text-pri)' }}>MAX</span>
        </Link>

        {/* Nav */}
        <nav style={{ display:'flex', gap:32 }}>
          {[['/', 'Phim'], ['/cinemas', 'Rạp'], ['/promotions', 'Khuyến mãi'], ['/contact', 'Liên hệ']].map(([to, label]) => (
            <NavLink key={to} to={to} end={to==='/'}
              style={({ isActive }) => ({ color:isActive?'var(--gold)':'var(--text-sec)', textDecoration:'none', fontSize:14, letterSpacing:.3, transition:'.2s' })}
              onMouseEnter={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.color='var(--text-pri)' }}
              onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.color='var(--text-sec)' }}
            >{label}</NavLink>
          ))}
          {isAdmin && <NavLink to="/admin" style={{ color:'var(--gold)', textDecoration:'none', fontSize:14 }}>Quản trị</NavLink>}
        </nav>

        {/* Right area */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {isLoggedIn ? (
            <>
              {/* Notification bell */}
              <NotificationBell />

              {/* User menu */}
              <div ref={menuRef} style={{ position:'relative' }}>
                <button onClick={() => setMenuOpen(o => !o)} style={{ background:'rgba(201,168,76,.1)', border:'1px solid var(--border-gold)', borderRadius:30, padding:'4px 14px 4px 4px', cursor:'pointer', color:'var(--gold)', fontSize:13, fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:8, transition:'.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(201,168,76,.18)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(201,168,76,.1)'}
                >
                  <div style={{ width:28, height:28, borderRadius:'50%', background: user?.avatarUrl ? `url(${user.avatarUrl}) center/cover` : 'var(--gold)', color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0, border: '1px solid var(--border-gold)' }}>
                    {!user?.avatarUrl && (user?.fullName?.[0]?.toUpperCase() || 'U')}
                  </div>
                  <span style={{ fontWeight: 500, letterSpacing: 0.3 }}>{user?.fullName?.split(' ').pop()}</span>
                </button>

                {menuOpen && (
                  <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, minWidth:180, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,.4)', animation:'fadeInUp .15s ease' }}>
                    {[
                      ['/profile', '👤', 'Hồ sơ của tôi'],
                      ['/notifications', '🔔', 'Thông báo'],
                      ...(isAdmin ? [['/admin', '⚙️', 'Quản trị']] : []),
                    ].map(([to, icon, label]) => (
                      <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', fontSize:14, color:'var(--text-sec)', textDecoration:'none', borderBottom:'1px solid var(--border)', transition:'.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background='var(--bg-card2)'; e.currentTarget.style.color='var(--text-pri)' }}
                        onMouseLeave={e => { e.currentTarget.style.background=''; e.currentTarget.style.color='var(--text-sec)' }}
                      >
                        <span>{icon}</span>{label}
                      </Link>
                    ))}
                    <button onClick={() => { logout(); navigate('/'); setMenuOpen(false) }} style={{ width:'100%', padding:'12px 16px', textAlign:'left', background:'none', border:'none', cursor:'pointer', fontSize:14, color:'var(--red)', fontFamily:"'DM Sans',sans-serif", display:'flex', alignItems:'center', gap:10 }}>
                      🚪 Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => navigate('/login')} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-sec)', padding:'8px 18px', borderRadius:4, cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif", transition:'.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold)'; e.currentTarget.style.color='var(--gold)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-sec)' }}>
                Đăng nhập
              </button>
              <button onClick={() => navigate('/register')} style={{ background:'var(--gold)', border:'1px solid var(--gold)', color:'#000', padding:'8px 18px', borderRadius:4, cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  const footerLinks = [
    ['Khám phá', [
      { name: 'Phim đang chiếu', to: '/' },
      { name: 'Phim sắp chiếu', to: '/' },
      { name: 'Hệ thống rạp', to: '/cinemas' },
      { name: 'Khuyến mãi', to: '/promotions' }
    ]],
    ['Hỗ trợ', [
      { name: 'Hướng dẫn đặt vé', to: '/contact#faq' },
      { name: 'Chính sách hoàn vé', to: '/contact#faq' },
      { name: 'Liên hệ', to: '/contact' },
      { name: 'FAQ', to: '/contact#faq' }
    ]],
    ['Liên kết', [
      { name: 'Facebook', to: 'https://facebook.com', external: true },
      { name: 'Instagram', to: 'https://instagram.com', external: true },
      { name: 'YouTube', to: 'https://youtube.com', external: true },
      { name: 'App iOS / Android', to: '#', external: true }
    ]],
  ];

  return (
    <footer style={{ background:'var(--bg-card)', borderTop:'1px solid var(--border)', padding:'48px 5% 32px', marginTop:80 }}>
      <div style={{ maxWidth:1400, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:40, marginBottom:40 }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:'var(--gold)', marginBottom:12 }}>CINE<span style={{ color:'var(--text-pri)' }}>MAX</span></div>
            <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7 }}>Trải nghiệm điện ảnh đỉnh cao tại hệ thống rạp chiếu phim hiện đại nhất Việt Nam.</p>
          </div>
          
          {footerLinks.map(([title, items]) => (
            <div key={title}>
              <div style={{ fontSize:13, fontWeight:500, color:'var(--text-pri)', letterSpacing:1, marginBottom:16 }}>{title}</div>
              {items.map(item => (
                item.external ? (
                  <a key={item.name} href={item.to} target="_blank" rel="noreferrer" 
                    style={{ display:'block', fontSize:13, color:'var(--text-muted)', marginBottom:10, textDecoration:'none', transition:'.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color='var(--gold)'}
                    onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link key={item.name} to={item.to} 
                    style={{ display:'block', fontSize:13, color:'var(--text-muted)', marginBottom:10, textDecoration:'none', transition:'.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color='var(--gold)'}
                    onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:24, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <span style={{ fontSize:12, color:'var(--text-muted)' }}>© 2026 CineMax. Tất cả quyền được bảo lưu.</span>
          <span style={{ fontSize:12, color:'var(--text-muted)' }}>Hotline: 1900 1234</span>
        </div>
      </div>
    </footer>
  )
}

export default function MainLayout() {
  return (
    <>
      <Header />
      <main style={{ paddingTop:60, minHeight:'100vh' }}><Outlet /></main>
      <Footer />
    </>
  )
}
