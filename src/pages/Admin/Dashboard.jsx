import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  movieService, cinemaService, userService,
  bookingService, revenueService,
} from '../../services/movieService'
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters'
import Spinner from '../../components/common/Spinner'

// ── Mini bar chart ────────────────────────────────────────────────────────────
function MiniBar({ data, color = 'var(--gold)' }) {
  const [hovered, setHovered] = useState(null) 
  
  const max = Math.max(...data.map(d => d.value || 0), 1)
  
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 48 }}>
      {data.map((d, i) => {
        const val = d.value || 0;
        return (
          <div 
            key={i} 
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', position: 'relative' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {hovered === i && (
              <div style={{
                position: 'absolute', bottom: '100%', marginBottom: 4,
                background: 'var(--bg-deep)', border: '1px solid var(--border)',
                color: 'var(--gold)', padding: '2px 8px', borderRadius: 4,
                fontSize: 10, whiteSpace: 'nowrap', zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)', animation: 'fadeInUp 0.15s ease'
              }}>
                {formatCurrency(val)} {/* Sử dụng formatCurrency tại đây */}
              </div>
            )}

            <div style={{ 
              width: '100%', 
              height: Math.max(2, Math.round((val / max) * 44)) + 'px', 
              background: color, 
              opacity: (i === data.length - 1 || hovered === i) ? 1 : 0.4, 
              borderRadius: '2px 2px 0 0', 
              transition: '.2s',
              cursor: 'pointer' 
            }} />
          </div>
        )
      })}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color, onClick, trend }) {
  return (
    <div onClick={onClick} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px', cursor: onClick ? 'pointer' : 'default', transition: '.2s' }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = 'var(--border-gold)' }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>{label}</span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, color: color || 'var(--text-pri)', marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ fontSize: 12, color: trend >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 4 }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% so với tháng trước
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats]       = useState(null)
  const [recentBookings, setRB] = useState([])
  const [loading, setLoading]   = useState(true)
  const [weeklyData, setWeeklyData] = useState([])

  useEffect(() => {
    Promise.allSettled([
      movieService.getAll(),
      cinemaService.getAll(),
      userService.getAll(),
      bookingService.getAll(),
      revenueService.getCinemaRevenue(),
      revenueService.getWeeklyRevenue(), 
    ]).then(([mv, ci, us, bk, rv, wk]) => {
      const movies   = mv.status === 'fulfilled' ? (mv.value.data || []) : []
      const cinemas  = ci.status === 'fulfilled' ? (ci.value.data || []) : []
      const users    = us.status === 'fulfilled' ? (us.value.data || []) : []
      const bookings = bk.status === 'fulfilled' ? (bk.value.data || []) : []
      const revenue  = rv.status === 'fulfilled' ? (rv.value.data || []) : []

      const totalRevenue = revenue.reduce((a, r) => a + (r.totalRevenue || 0), 0)
      const weekly = wk.status === 'fulfilled' ? (wk.value.data || []) : []
      setWeeklyData(weekly)

      setStats({
        movies:       movies.length,
        nowShowing:   movies.filter(m => m.status === 'now_showing').length,
        comingSoon:   movies.filter(m => m.status === 'coming_soon').length,
        cinemas:      cinemas.length,
        users:        users.length,
        customers:    users.filter(u => u.role === 'customer').length,
        bookings:     bookings.length,
        confirmed:    bookings.filter(b => b.status === 'confirmed').length,
        pending:      bookings.filter(b => b.status === 'pending').length,
        totalRevenue,
      })
      // 10 đơn gần nhất
      setRB(bookings.slice(0, 10))
    }).finally(() => setLoading(false))
  }, [])

  
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <Spinner size="lg" />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, marginBottom: 4 }}>
          Tổng quan <span style={{ color: 'var(--gold)' }}>Hệ thống</span>
        </h1>
        <p style={{ color: 'var(--text-sec)', fontSize: 14 }}>
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Main stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Tổng doanh thu" value={formatCurrency(stats?.totalRevenue || 0)} icon="💰" color="var(--gold)"
          sub="Từ các đơn đã xác nhận" onClick={() => navigate('/admin/revenue')} />
        <StatCard label="Đơn hàng" value={stats?.bookings || 0} icon="🎟️" color="var(--text-pri)"
          sub={`${stats?.confirmed || 0} xác nhận · ${stats?.pending || 0} chờ TT`} onClick={() => navigate('/admin/orders')} />
        <StatCard label="Người dùng" value={stats?.users || 0} icon="👥" color="#4a9fd0"
          sub={`${stats?.customers || 0} khách hàng`} onClick={() => navigate('/admin/users')} />
        <StatCard label="Phim" value={stats?.movies || 0} icon="🎬" color="var(--green)"
          sub={`${stats?.nowShowing || 0} đang chiếu · ${stats?.comingSoon || 0} sắp chiếu`} onClick={() => navigate('/admin/movies')} />
        <StatCard label="Rạp chiếu" value={stats?.cinemas || 0} icon="🏛️" color="#c070c0"
          onClick={() => navigate('/admin/cinemas')} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 24 }}>
        {/* Recent orders table */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18 }}>Đơn hàng gần đây</h3>
            <button onClick={() => navigate('/admin/orders')} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              Xem tất cả →
            </button>
          </div>
          {recentBookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <div>Chưa có đơn hàng nào</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card2)' }}>
                  {['Mã vé', 'Khách hàng', 'Phim', 'Tổng tiền', 'Trạng thái'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', letterSpacing: .5, fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBookings.map(b => {
                  const STATUS = {
                    confirmed: { color: 'var(--green)',     label: 'Xác nhận' },
                    pending:   { color: 'var(--gold)',      label: 'Chờ TT' },
                    cancelled: { color: 'var(--red)',       label: 'Đã hủy' },
                    expired:   { color: 'var(--text-muted)',label: 'Hết hạn' },
                  }
                  const ss = STATUS[b.status] || STATUS.expired
                  return (
                    <tr key={b.id} style={{ borderTop: '1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, color: 'var(--gold)', letterSpacing: 1 }}>{b.bookingCode}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-sec)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.userName || '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.movieTitle || '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--gold)', fontWeight: 500 }}>{formatCurrency(b.finalAmount)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 11, color: ss.color }}>{ss.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Booking trend */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 16 }}>Doanh thu 7 ngày qua</div>
            
            {/* 1. Đổi weekData thành weeklyData (state chứa dữ liệu thật) */}
            <MiniBar data={weeklyData.length > 0 ? weeklyData : [{value: 0}]} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
              {/* 2. Map dữ liệu thật để hiển thị thứ (T2, T3...) */}
              {weeklyData.map((d, i) => (
                <span key={i}>{d.day}</span>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 14 }}>Thao tác nhanh</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['/admin/movies',    '🎬', 'Thêm phim mới'],
                ['/admin/showtimes', '🕐', 'Tạo suất chiếu'],
                ['/admin/promotions','🎁', 'Tạo mã khuyến mãi'],
                ['/admin/pricing',   '💲', 'Cài giá vé'],
              ].map(([path, icon, label]) => (
                <button key={path} onClick={() => navigate(path)} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: 'var(--text-sec)', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: 10, transition: '.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.color = 'var(--gold)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sec)' }}
                >
                  <span style={{ fontSize: 16 }}>{icon}</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* System status */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 14 }}>Trạng thái hệ thống</div>
            {[
              ['API Backend',   true,  'Đang hoạt động'],
              ['Database',      true,  'Kết nối tốt'],
              ['VNPay Gateway', true,  'Sandbox mode'],
              ['Email Service', false, 'Kiểm tra cấu hình'],
            ].map(([name, ok, desc]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-pri)' }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? 'var(--green)' : 'var(--red)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: movies table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18 }}>Phim đang chiếu</h3>
          <button onClick={() => navigate('/admin/movies')} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            Quản lý phim →
          </button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            ['Tổng số phim', stats?.movies || 0, 'var(--text-pri)'],
            ['Đang chiếu', stats?.nowShowing || 0, 'var(--green)'],
            ['Sắp chiếu',  stats?.comingSoon || 0, 'var(--gold)'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: c }}>{v}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
