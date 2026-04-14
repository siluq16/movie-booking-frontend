import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { membershipService, bookingService, userService } from '../../services/movieService'
import Spinner from '../../components/common/Spinner'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters'
import { isStrongPassword } from '../../utils/validators'
import toast from 'react-hot-toast'

const TIERS = {
  silver: { label: 'Bạc', icon: '🥈', color: '#C0C0C0', bg: 'rgba(192,192,192,.08)', nextTier: 'gold', nextPts: 500, perks: ['Tích điểm x1', 'Xem trailer độc quyền', 'Ưu tiên đặt vé'] },
  gold: { label: 'Vàng', icon: '🥇', color: '#C9A84C', bg: 'rgba(201,168,76,.08)', nextTier: 'platinum', nextPts: 2000, perks: ['Tích điểm x1.5', 'Giảm 10% mọi đơn', 'Quà sinh nhật', 'Ghế VIP ưu tiên'] },
  platinum: { label: 'Bạch kim', icon: '💎', color: '#E5E4E2', bg: 'rgba(229,228,226,.06)', nextTier: 'diamond', nextPts: 5000, perks: ['Tích điểm x2', 'Vé miễn phí hàng tháng', 'Phòng VIP', 'Hỗ trợ 24/7'] },
  diamond: { label: 'Kim cương', icon: '💠', color: '#b9f2ff', bg: 'rgba(185,242,255,.05)', nextTier: null, nextPts: null, perks: ['Tích điểm x3', 'Vé IMAX x2/tháng', 'Phòng riêng', 'Concierge cá nhân', 'Quà độc quyền hàng quý'] },
}

const BOOKING_STATUS = {
  confirmed: { bg: 'rgba(82,201,124,.12)', color: 'var(--green)', label: 'Đã xác nhận' },
  pending: { bg: 'rgba(201,168,76,.1)', color: 'var(--gold)', label: 'Chờ thanh toán' },
  cancelled: { bg: 'rgba(224,82,82,.1)', color: 'var(--red)', label: 'Đã hủy' },
  expired: { bg: 'rgba(90,88,80,.15)', color: 'var(--text-muted)', label: 'Hết hạn' },
  refunded: { bg: 'rgba(74,159,208,.1)', color: '#4a9fd0', label: 'Đã hoàn tiền' },
}

const TABS = [
  { key: 'info', icon: '👤', label: 'Thông tin' },
  { key: 'history', icon: '🎟️', label: 'Lịch sử vé' },
  { key: 'tier', icon: '🏆', label: 'Hạng thành viên' },
  { key: 'password', icon: '🔒', label: 'Đổi mật khẩu' },
]

function UserInfoTab({ user, card, setTab, reloadUser }) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    fullName: '', phone: '', gender: '', dateOfBirth: '', avatarUrl: ''
  })

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleOpenEdit = () => {
    setForm({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      gender: user?.gender || 'Khác',
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '', 
      avatarUrl: user?.avatarUrl || ''
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await userService.updateProfile(user.id, {
        ...form,
        dateOfBirth: form.dateOfBirth || null
      })
      toast.success("Cập nhật thành công!")
      setIsEditing(false)
      
      if (reloadUser) await reloadUser()

    } catch (err) {
      toast.error("Lỗi khi cập nhật")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, animation: 'fadeIn .3s ease' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: .5 }}>THÔNG TIN TÀI KHOẢN</div>
          {!isEditing ? (
            <button onClick={handleOpenEdit} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>✏️ Chỉnh sửa</button>
          ) : (
            <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>✕ Hủy</button>
          )}
        </div>

        {!isEditing ? (
          <div>
            {user?.avatarUrl && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <img src={user.avatarUrl} alt="Avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }} />
              </div>
            )}
            {[['👤 Họ tên', user?.fullName], ['📧 Email', user?.email], ['📞 SĐT', user?.phone], ['⚧ Giới tính', user?.gender], ['🎂 Ngày sinh', user?.dateOfBirth], ['🛡️ Vai trò', user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'staff' ? 'Nhân viên' : 'Khách hàng'], ['✅ Xác thực', user?.isVerified ? 'Đã xác thực' : 'Chưa xác thực']].map(([l, v]) => v && (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', fontSize: 14, borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ color: 'var(--text-pri)', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Họ tên *" value={form.fullName} onChange={set('fullName')} />
            <Input label="Link ảnh đại diện (URL)" value={form.avatarUrl} onChange={set('avatarUrl')} placeholder="https://example.com/photo.jpg" />

            {form.avatarUrl && (
              <div style={{ textAlign: 'center' }}>
                <img src={form.avatarUrl} alt="Preview" style={{ width: 50, height: 50, borderRadius: '50%', opacity: 0.7 }} />
              </div>
            )}
            <Input label="Số điện thoại" value={form.phone} onChange={set('phone')} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Giới tính</label>
                <select value={form.gender} onChange={set('gender')} style={{ width: '100%', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: 'var(--text-pri)' }}>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <Input label="Ngày sinh" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>💡 Email không thể thay đổi để bảo mật tài khoản.</div>

            <Button variant="primary" fullWidth size="md" onClick={handleSave} loading={loading}>
              Lưu thay đổi
            </Button>
          </div>
        )}
      </div>

      {card && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: .5, marginBottom: 16 }}>THẺ HỘI VIÊN</div>
          <MemberCard card={card} />
          <Button variant="outline" fullWidth size="md" onClick={() => setTab('tier')} style={{ marginTop: 12 }}>
            Xem quyền lợi →
          </Button>
        </div>
      )}
    </div>
  )
}
// ── Membership Card ────────────────────────────────────────────────────────────
function MemberCard({ card }) {
  if (!card) return null
  const t = TIERS[card.tier] || TIERS.silver
  const current = (card.totalPoints ?? 0) - (card.usedPoints ?? 0)
  const progress = t.nextPts ? Math.min(100, Math.round(((card.totalPoints ?? 0) / t.nextPts) * 100)) : 100

  return (
    <div style={{ borderRadius: 14, padding: 26, background: `linear-gradient(135deg, var(--bg-card2), var(--bg-card))`, border: `1px solid ${t.color}44`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -32, right: -32, width: 120, height: 120, borderRadius: '50%', background: `${t.color}08`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: t.color, marginBottom: 6 }}>CINEMAX MEMBERSHIP</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 26 }}>{t.icon}</span>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: t.color }}>{t.label}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 3 }}>SỐ THẺ</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, color: t.color, letterSpacing: 2 }}>{card.cardNumber}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
        {[['ĐIỂM KHẢ DỤNG', current?.toLocaleString(), t.color],
        ['TỔNG TÍCH LŨY', (card.totalPoints ?? 0)?.toLocaleString(), 'var(--text-pri)'],
        ['ĐÃ DÙNG', (card.usedPoints ?? 0)?.toLocaleString(), 'var(--text-muted)']
        ].map(([l, v, c]) => (
          <div key={l}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4 }}>{l}</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {t.nextTier ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
            <span>Tiến độ lên hạng {TIERS[t.nextTier]?.label} {TIERS[t.nextTier]?.icon}</span>
            <span>{(card.totalPoints ?? 0)?.toLocaleString()} / {t.nextPts?.toLocaleString()} điểm</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,.07)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(to right,${t.color}88,${t.color})`, borderRadius: 3, transition: 'width 1s' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
            Cần thêm <span style={{ color: t.color }}>{Math.max(0, t.nextPts - (card.totalPoints ?? 0))?.toLocaleString()}</span> điểm
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', fontSize: 12, color: t.color }}>👑 Hạng cao nhất</div>
      )}
    </div>
  )
}

// ── Booking History ────────────────────────────────────────────────────────────
function BookingHistory({ userId }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5 // Số lượng vé hiển thị trên 1 trang (bạn có thể đổi thành 10)

  useEffect(() => {
    userService.getBookings(userId)
      .then(r => setBookings(Array.isArray(r.data) ? r.data : []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const sortedBookings = [...bookings].sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  const filtered = sortedBookings.filter(b => filter === 'all' || b.status === filter)

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentBookings = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['all', 'Tất cả'], ['confirmed', 'Đã xác nhận'], ['pending', 'Chờ TT'], ['cancelled', 'Đã hủy']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{ padding: '6px 14px', borderRadius: 16, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", border: `1px solid ${filter === v ? 'var(--gold)' : 'var(--border)'}`, background: filter === v ? 'rgba(201,168,76,.1)' : 'transparent', color: filter === v ? 'var(--gold)' : 'var(--text-sec)', transition: '.15s' }}>
            {l} <span style={{ opacity: .6 }}>({bookings.filter(b => v === 'all' || b.status === v).length})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎟️</div>
          <div style={{ fontSize: 15, color: 'var(--text-sec)', marginBottom: 6 }}>Chưa có vé nào</div>
          <div style={{ fontSize: 13 }}>Đặt vé xem phim để lịch sử xuất hiện tại đây</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {currentBookings.map(b => {
              const ss = BOOKING_STATUS[b.status] || BOOKING_STATUS.expired
              return (
                <div key={b.id} style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', transition: '.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-gold)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ height: 2, background: ss.color, opacity: .5 }} />
                  <div style={{ padding: '16px 20px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: 'var(--gold)', letterSpacing: 1 }}>{b.bookingCode}</span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, background: ss.bg, color: ss.color, fontWeight: 500 }}>{ss.label}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-pri)', marginBottom: 4 }}>{b.movieTitle}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-sec)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {b.cinemaName && <span>📍 {b.cinemaName}</span>}
                        {b.roomName && <span>🎬 {b.roomName}</span>}
                        {b.screenFormat && <span style={{ color: 'var(--gold)', fontSize: 11 }}>{b.screenFormat}</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 110 }}>
                      <div style={{ fontSize: 20, fontWeight: 500, color: 'var(--text-pri)' }}>{b.startTime ? formatTime(b.startTime) : '—'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.startTime ? formatDate(b.startTime) : '—'}</div>
                      {b.seats?.length > 0 && (
                        <div style={{ fontSize: 12, color: 'var(--text-sec)', marginTop: 4 }}>
                          🪑 {b.seats.map(s => `${s.rowLabel}${s.seatNumber}`).join(', ')}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 100 }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: 'var(--gold)' }}>{formatCurrency(b.finalAmount)}</div>
                      {b.discountAmount > 0 && <div style={{ fontSize: 11, color: 'var(--green)' }}>−{formatCurrency(b.discountAmount)}</div>}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{b.createdAt ? formatDate(b.createdAt) : ''}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 28 }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-pri)', padding: '6px 14px', borderRadius: 6, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: '.2s' }}
              >
                ← Trang trước
              </button>
              
              <div style={{ fontSize: 14, color: 'var(--text-sec)' }}>
                Trang <strong style={{ color: 'var(--gold)' }}>{currentPage}</strong> / {totalPages}
              </div>

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-pri)', padding: '6px 14px', borderRadius: 6, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: '.2s' }}
              >
                Trang sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Tier Info ─────────────────────────────────────────────────────────────────
function TierInfo({ card }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}><MemberCard card={card} /></div>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, marginBottom: 20 }}>Quyền lợi theo hạng</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16, marginBottom: 24 }}>
        {Object.entries(TIERS).map(([key, t]) => {
          const isCur = card?.tier === key
          return (
            <div key={key} style={{ background: isCur ? t.bg : 'var(--bg-card2)', border: `1px solid ${isCur ? t.color + '44' : 'var(--border)'}`, borderRadius: 10, padding: 20, position: 'relative' }}>
              {isCur && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, background: t.color, color: '#000', padding: '2px 8px', borderRadius: 2, fontWeight: 700 }}>HẠNG CỦA BẠN</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 24 }}>{t.icon}</span>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: t.color }}>{t.label}</div>
                  {t.nextPts && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Từ {t.nextPts?.toLocaleString()} điểm</div>}
                </div>
              </div>
              {t.perks.map(p => (
                <div key={p} style={{ display: 'flex', gap: 8, fontSize: 13, color: isCur ? 'var(--text-pri)' : 'var(--text-sec)', marginBottom: 6 }}>
                  <span style={{ color: t.color, flexShrink: 0 }}>✓</span><span>{p}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
      <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid var(--border-gold)', borderRadius: 8, padding: '14px 18px', fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.7 }}>
        💡 <strong style={{ color: 'var(--gold)' }}>Cách tích điểm:</strong> Mỗi 10.000đ = 1 điểm (vé phim và đồ ăn). Hạng được xét lại mỗi 12 tháng.
      </div>
    </div>
  )
}

// ── Change Password ────────────────────────────────────────────────────────────
function ChangePassword({ userId }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.currentPassword) e.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    if (!isStrongPassword(form.newPassword)) e.newPassword = 'Mật khẩu mới phải từ 6 ký tự'
    if (form.newPassword === form.currentPassword) e.newPassword = 'Mật khẩu mới phải khác mật khẩu cũ'
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Mật khẩu xác nhận không khớp'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await userService.changePassword(userId, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      toast.success('Đổi mật khẩu thành công!')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setErrors({})
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mật khẩu hiện tại không đúng')
    } finally {
      setLoading(false)
    }
  }

  const pw = form.newPassword
  const strength = pw.length === 0 ? 0 : [pw.length >= 6, pw.length >= 10, /[A-Z]/.test(pw), /[!@#$%^&*]/.test(pw)].filter(Boolean).length

  return (
    <div style={{ maxWidth: 440 }}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, marginBottom: 20 }}>Đổi Mật Khẩu</h3>
      <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 10, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Input label="Mật khẩu hiện tại *" type="password" value={form.currentPassword} onChange={set('currentPassword')} error={errors.currentPassword} placeholder="••••••••" icon="🔑" />
        <div style={{ height: 1, background: 'var(--border)' }} />
        <Input label="Mật khẩu mới *" type="password" value={form.newPassword} onChange={set('newPassword')} error={errors.newPassword} placeholder="Tối thiểu 6 ký tự" icon="🔒" />
        <Input label="Xác nhận mật khẩu mới *" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} placeholder="Nhập lại mật khẩu" icon="🔒" />

        {pw.length > 0 && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Độ mạnh</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
              {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, transition: '.3s', background: i <= strength ? (strength <= 1 ? 'var(--red)' : strength <= 2 ? '#e07a42' : strength <= 3 ? 'var(--gold)' : 'var(--green)') : 'var(--border)' }} />)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {strength <= 1 ? 'Quá yếu' : strength <= 2 ? 'Trung bình' : strength <= 3 ? 'Tốt' : '✓ Rất mạnh'}
              {strength < 4 && ' · Thêm chữ hoa và ký tự đặc biệt'}
            </div>
          </div>
        )}

        <Button variant="primary" fullWidth size="lg" onClick={handleSubmit} loading={loading}>
          🔒 Cập nhật mật khẩu
        </Button>
      </div>
      <div style={{ marginTop: 14, background: 'rgba(74,159,208,.06)', border: '1px solid rgba(74,159,208,.2)', borderRadius: 8, padding: '11px 16px', fontSize: 13, color: 'var(--text-sec)' }}>
        🛡️ Mật khẩu được mã hóa BCrypt. Không bao giờ chia sẻ với bất kỳ ai.
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, logout, reloadUser } = useAuth()
  const [card, setCard] = useState(null)
  const [tab, setTab] = useState('info')

  useEffect(() => {
    membershipService.getMyCard()
      .then(r => setCard(r.data))
      .catch(() => { })

    if (reloadUser) {
      reloadUser();
    }
  }, [])

  const tier = TIERS[card?.tier] || TIERS.silver

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 5% 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36, flexWrap: 'wrap' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: user?.avatarUrl ? `url(${user.avatarUrl}) center/cover` : `linear-gradient(135deg,${tier.color}88,${tier.color})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 700, color: '#000', flexShrink: 0,
          boxShadow: `0 0 0 3px ${tier.color}33`,
          overflow: 'hidden'
        }}>
          {!user?.avatarUrl && user?.fullName?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(22px,3vw,30px)', marginBottom: 6 }}>{user?.fullName}</h1>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>{user?.role === 'admin' ? '⚙️ Quản trị viên' : '🎬 Hội viên CineMax'}</span>
            {card && (
              <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 10, background: tier.bg, color: tier.color, border: `1px solid ${tier.color}44`, fontWeight: 500 }}>
                {tier.icon} Hạng {tier.label}
              </span>
            )}
            {card && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{((card.totalPoints ?? 0) - (card.usedPoints ?? 0))?.toLocaleString()} điểm khả dụng</span>}
          </div>
        </div>
        <button onClick={logout} style={{ background: 'rgba(224,82,82,.08)', border: '1px solid rgba(224,82,82,.3)', color: 'var(--red)', borderRadius: 6, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
          🚪 Đăng xuất
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 32, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 14, padding: '12px 22px', whiteSpace: 'nowrap', color: tab === t.key ? 'var(--gold)' : 'var(--text-sec)', borderBottom: `2px solid ${tab === t.key ? 'var(--gold)' : 'transparent'}`, marginBottom: -1, transition: '.2s', display: 'flex', alignItems: 'center', gap: 7 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Thông tin */}
      {tab === 'info' && (
        <UserInfoTab user={user} card={card} setTab={setTab} reloadUser={reloadUser} />
      )}

      {tab === 'history' && (
        <div style={{ animation: 'fadeIn .3s ease' }}>
          <BookingHistory userId={user?.id} />
        </div>
      )}

      {tab === 'tier' && (
        <div style={{ animation: 'fadeIn .3s ease' }}>
          <TierInfo card={card} />
        </div>
      )}

      {tab === 'password' && (
        <div style={{ animation: 'fadeIn .3s ease' }}>
          <ChangePassword userId={user?.id} />
        </div>
      )}
    </div>
  )
}
