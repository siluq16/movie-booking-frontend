import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../../services/movieService'
import { useAuth } from '../../context/AuthContext'
import { formatDate, formatTime } from '../../utils/formatters'

const TYPE_ICON = {
  booking_confirmed: '🎟️', booking_cancelled: '❌',
  payment_success: '💳', showtime_reminder: '⏰',
  promotion: '🎁', system: '🔔',
}
const TYPE_COLOR = {
  booking_confirmed: 'var(--green)', booking_cancelled: 'var(--red)',
  payment_success: '#4a9fd0', showtime_reminder: 'var(--gold)',
  promotion: '#c070c0', system: 'var(--text-sec)',
}

export default function NotificationBell() {
  const { isLoggedIn }  = useAuth()
  const navigate        = useNavigate()
  const [count, setCount]   = useState(0)
  const [preview, setPreview] = useState([])
  const [open, setOpen]     = useState(false)
  const [loading, setLoading] = useState(false)
  const dropRef = useRef(null)

  // Load unread count on mount and every 60s
  useEffect(() => {
    if (!isLoggedIn) return
    const fetchCount = () => {
      notificationService.getUnreadCount()
        .then(r => setCount(r.data?.unreadCount || 0))
        .catch(() => {})
    }
    fetchCount()
    const t = setInterval(fetchCount, 60000)
    return () => clearInterval(t)
  }, [isLoggedIn])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = async () => {
    if (!isLoggedIn) { navigate('/login'); return }
    const next = !open
    setOpen(next)
    if (next && preview.length === 0) {
      setLoading(true)
      notificationService.getAll()
        .then(r => setPreview(Array.isArray(r.data) ? r.data.slice(0, 5) : []))
        .catch(() => setPreview([]))
        .finally(() => setLoading(false))
    }
  }

  const markRead = async (id, e) => {
    e.stopPropagation()
    try {
      await notificationService.markRead(id)
      setPreview(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
      setCount(c => Math.max(0, c - 1))
    } catch {}
  }

  if (!isLoggedIn) return null

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button onClick={handleOpen} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, transition: '.15s', color: open ? 'var(--gold)' : 'var(--text-sec)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card2)'; e.currentTarget.style.color = 'var(--gold)' }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text-sec)' } }}
      >
        {/* Bell icon SVG */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {/* Unread badge */}
        {count > 0 && (
          <div style={{ position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '1px solid var(--bg-deep)' }}>
            {count > 99 ? '99+' : count}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.4)', zIndex: 200, overflow: 'hidden', animation: 'fadeInUp .2s ease' }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-pri)' }}>Thông báo</span>
              {count > 0 && <span style={{ marginLeft: 8, fontSize: 11, background: 'rgba(224,82,82,.15)', color: 'var(--red)', padding: '1px 7px', borderRadius: 10 }}>{count} chưa đọc</span>}
            </div>
            <button onClick={() => { navigate('/notifications'); setOpen(false) }}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              Xem tất cả →
            </button>
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--gold)', animation: 'spin .7s linear infinite' }} />
              </div>
            ) : preview.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                Chưa có thông báo nào
              </div>
            ) : (
              preview.map(n => (
                <div key={n.id}
                  onClick={() => { navigate('/notifications'); setOpen(false) }}
                  style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.isRead ? 'transparent' : 'rgba(201,168,76,.04)', transition: '.15s', display: 'flex', gap: 10, alignItems: 'flex-start' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(201,168,76,.04)'}
                >
                  {/* Icon */}
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${TYPE_COLOR[n.type] || 'var(--text-sec)'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                    {TYPE_ICON[n.type] || '🔔'}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600, color: 'var(--text-pri)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-sec)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                      {n.body}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {n.createdAt ? formatDate(n.createdAt) : ''}
                    </div>
                  </div>

                  {/* Unread dot + mark read btn */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: '50%', background: TYPE_COLOR[n.type] || 'var(--gold)' }} />}
                    {!n.isRead && (
                      <button onClick={(e) => markRead(n.id, e)} title="Đánh dấu đã đọc"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>
                        ✓
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <button onClick={() => { navigate('/notifications'); setOpen(false) }}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", width: '100%', padding: '4px 0' }}>
              Xem tất cả thông báo →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
