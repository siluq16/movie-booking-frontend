import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/images/logo/logo.png'


const NAV = [
  { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/orders', icon: '🎟️', label: 'Đơn hàng' },
  { to: '/admin/revenue', icon: '💰', label: 'Doanh thu' },
  null,
  { to: '/admin/movies', icon: '🎬', label: 'Phim' },
  { to: '/admin/showtimes', icon: '🕐', label: 'Suất chiếu' },
  { to: '/admin/cinemas', icon: '🏛️', label: 'Rạp chiếu' },
  { to: '/admin/cinemas/detail', icon: '🗺️', label: 'Sơ đồ ghế' },
  null,
  { to: '/admin/promotions', icon: '🎁', label: 'Khuyến mãi' },
  { to: '/admin/pricing', icon: '💲', label: 'Giá vé' },
  { to: '/admin/food', icon: '🍿', label: 'Đồ ăn' },
  null,
  { to: '/admin/people', icon: '🎭', label: 'Người & Thể loại' },
  { to: '/admin/users', icon: '👥', label: 'Người dùng' },
]

// Breadcrumb map: path → { label, icon }
const CRUMBS = {
  '/admin': { icon: '📊', label: 'Dashboard' },
  '/admin/orders': { icon: '🎟️', label: 'Đơn hàng' },
  '/admin/revenue': { icon: '💰', label: 'Doanh thu' },
  '/admin/movies': { icon: '🎬', label: 'Quản lý Phim' },
  '/admin/showtimes': { icon: '🕐', label: 'Quản lý Suất chiếu' },
  '/admin/cinemas': { icon: '🏛️', label: 'Quản lý Rạp chiếu' },
  '/admin/cinemas/detail': { icon: '🗺️', label: 'Sơ đồ ghế' },
  '/admin/promotions': { icon: '🎁', label: 'Khuyến mãi' },
  '/admin/pricing': { icon: '💲', label: 'Giá vé' },
  '/admin/food': { icon: '🍿', label: 'Đồ ăn & Thức uống' },
  '/admin/people': { icon: '🎭', label: 'Người & Thể loại' },
  '/admin/users': { icon: '👥', label: 'Người dùng' },
}

function Breadcrumbs({ path }) {
  // Build crumb chain: Admin > Current Page
  const crumb = CRUMBS[path]
  if (!crumb || path === '/admin') return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
      <NavLink to="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none', transition: '.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        📊 Admin
      </NavLink>
      <span style={{ opacity: .5 }}>›</span>
      <span style={{ color: 'var(--text-sec)' }}>{crumb.icon} {crumb.label}</span>
    </div>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const currentCrumb = CRUMBS[pathname]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)' }}>

      {/* ── Sidebar ── */}
      <aside style={{ width: 230, flexShrink: 0, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0, overflowY: 'auto' }}>

        {/* Logo */}
        <div style={{ padding: '22px 18px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <img
              src={logo}
              alt="logo"
              style={{
                height: 28,
                objectFit: 'contain'
              }}
            />

            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20
              }}
            >
              <span style={{ color: 'var(--gold)' }}>CINE</span>
              <span style={{ color: 'var(--text-pri)' }}>MAX</span>
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1.5, marginTop: 3 }}>ADMIN PANEL</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV.map((item, i) =>
            !item ? (
              <div key={i} style={{ height: 1, background: 'var(--border)', margin: '6px 8px' }} />
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 11px', borderRadius: 6, marginBottom: 2,
                  textDecoration: 'none', fontSize: 13, transition: '.15s',
                  background: isActive ? 'rgba(201,168,76,.12)' : 'transparent',
                  color: isActive ? 'var(--gold)' : 'var(--text-sec)',
                  borderLeft: `2px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
                })}
                onMouseEnter={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
                onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        {/* User */}
        <div style={{ padding: '14px 10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 11px', marginBottom: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
              {user?.fullName?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, color: 'var(--text-pri)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Quản trị viên</div>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login') }}
            style={{ width: '100%', padding: '8px 11px', textAlign: 'left', background: 'none', border: '1px solid rgba(224,82,82,.3)', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: 'var(--red)', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 7, transition: '.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(224,82,82,.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ marginLeft: 230, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Header with breadcrumbs */}
        <header style={{ height: 58, background: 'var(--bg-dark)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 28px', position: 'sticky', top: 0, zIndex: 50, gap: 16, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Breadcrumbs */}
            {pathname === '/admin' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span style={{ fontSize: 16 }}>📊</span>
                <span style={{ fontFamily: "'Playfair Display',serif", color: 'var(--text-pri)' }}>Dashboard</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <NavLink to="/admin" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, transition: '.15s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <span style={{ fontSize: 14 }}>📊</span> Admin
                </NavLink>
                <span style={{ color: 'var(--border)', fontSize: 14 }}>›</span>
                {currentCrumb && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-sec)', fontWeight: 500, fontSize: 13 }}>
                    <span style={{ fontSize: 15 }}>{currentCrumb.icon}</span>
                    {currentCrumb.label}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: welcome + quick link to site */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Xin chào, <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{user?.fullName?.split(' ').pop()}</span>
            </span>
            <NavLink to="/" target="_blank" style={{ background: 'rgba(201,168,76,.08)', border: '1px solid var(--border-gold)', color: 'var(--gold)', padding: '5px 12px', borderRadius: 4, fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5, transition: '.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,168,76,.08)'}
            >
              🌐 Xem trang
            </NavLink>
          </div>
        </header>

        <main style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
