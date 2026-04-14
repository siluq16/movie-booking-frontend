import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { userService, bookingService } from '../../services/movieService'
import Spinner from '../../components/common/Spinner'
import Modal from '../../components/common/Modal'
import { formatCurrency, formatDateFull, formatDate, formatTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

const ROLE_STYLE = {
  admin:    { bg:'rgba(201,168,76,.15)',  color:'var(--gold)',   label:'Admin' },
  staff:    { bg:'rgba(74,159,208,.12)', color:'#4a9fd0',       label:'Nhân viên' },
  customer: { bg:'rgba(82,201,124,.1)',  color:'var(--green)',   label:'Khách hàng' },
}
const BOOKING_STATUS = {
  confirmed:{ color:'var(--green)',    label:'Đã xác nhận' },
  pending:  { color:'var(--gold)',     label:'Chờ TT' },
  cancelled:{ color:'var(--red)',      label:'Đã hủy' },
  expired:  { color:'var(--text-muted)',label:'Hết hạn' },
}
const TIER_INFO = {
  silver:  { icon:'🥈', color:'#C0C0C0' },
  gold:    { icon:'🥇', color:'#C9A84C' },
  platinum:{ icon:'💎', color:'#E5E4E2' },
  diamond: { icon:'💠', color:'#b9f2ff' },
}

export default function ManageUsers() {
  const [users, setUsers]       = useState([])
  const { user: currentUser } = useAuth()
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRole]   = useState('all')
  const [detail, setDetail]     = useState(null)
  const [userBookings, setUB]   = useState([])
  const [bookingsLoading, setBL] = useState(false)

  useEffect(() => {
    userService.getAll()
      .then(r => setUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }, [])

  const openDetail = async (user) => {
    setDetail(user)
    setBL(true)
    try {
      const r = await userService.getBookings(user.id)
      setUB(Array.isArray(r.data) ? r.data : [])
    } catch {
      setUB([])
    } finally {
      setBL(false)
    }
  }

  const filtered = users.filter(u => {
    const mr = roleFilter === 'all' || u.role === roleFilter
    const ms = !search || [u.fullName, u.email, u.phone].some(f => f?.toLowerCase().includes(search.toLowerCase()))
    return mr && ms
  })

  const counts = { all: users.length, admin: 0, staff: 0, customer: 0 }
  users.forEach(u => { if (u.role in counts) counts[u.role]++ })

  const totalBookingRevenue = userBookings
    .filter(b => b.status === 'confirmed')
    .reduce((a, b) => a + (b.finalAmount || 0), 0)

const handleToggleLock = async (user) => {
    const action = user.isActive ? 'KHÓA' : 'MỞ KHÓA';
    if (!window.confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;
    
    try {
      await userService.toggleLock(user.id);
      toast.success(`${action} tài khoản thành công!`);
      // Cập nhật lại state local
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      setDetail({ ...user, isActive: !user.isActive });
    } catch (err) {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái.');
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm('Xác nhận thay đổi quyền hạn của tài khoản này?')) return;
    
    try {
      await userService.updateRole(userId, newRole);
      toast.success('Cập nhật quyền thành công!');
      // Cập nhật lại state local
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setDetail({ ...detail, role: newRole });
    } catch (err) {
      toast.error('Có lỗi xảy ra khi cập nhật quyền.');
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26 }}>
          Quản lý <span style={{ color:'var(--gold)' }}>Người Dùng</span>
        </h1>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm tên, email, SĐT..."
          style={{ background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 14px', color:'var(--text-pri)', fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", width:250 }}
          onFocus={e => e.target.style.borderColor='var(--gold)'}
          onBlur={e => e.target.style.borderColor='var(--border)'}
        />
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:24 }}>
        {[['Tổng cộng',counts.all,'👥','var(--text-pri)'],['Quản trị',counts.admin,'⚙️','var(--gold)'],['Nhân viên',counts.staff,'👔','#4a9fd0'],['Khách hàng',counts.customer,'🎬','var(--green)']].map(([l,v,i,c]) => (
          <div key={l} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'16px 18px', display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:24 }}>{i}</span>
            <div>
              <div style={{ fontSize:22, fontWeight:500, color:c }}>{v}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Role tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:20 }}>
        {[['all','Tất cả'],['admin','Admin'],['staff','Nhân viên'],['customer','Khách hàng']].map(([v,l]) => (
          <button key={v} onClick={() => setRole(v)} style={{ background:'none', border:'none', color:roleFilter===v?'var(--gold)':'var(--text-sec)', fontSize:13, padding:'9px 18px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", borderBottom:`2px solid ${roleFilter===v?'var(--gold)':'transparent'}`, marginBottom:-1 }}>
            {l} <span style={{ opacity:.6, fontSize:11 }}>({counts[v] ?? 0})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size="lg" /></div>
      ) : (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'var(--bg-card2)' }}>
                {['Người dùng','Liên hệ','Vai trò','Trạng thái','Ngày tạo',''].map(h => (
                  <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:11, color:'var(--text-muted)', letterSpacing:.5, fontWeight:500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const rs = ROLE_STYLE[u.role] || ROLE_STYLE.customer
                return (
                  <tr key={u.id} style={{ borderTop:'1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg-card2)'}
                    onMouseLeave={e => e.currentTarget.style.background=''}
                  >
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,#C9A84C88,#C9A84C)', color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, flexShrink:0 }}>
                          {u.fullName?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize:14, fontWeight:500 }}>{u.fullName}</div>
                          {!u.isVerified && <div style={{ fontSize:10, color:'var(--red)' }}>Chưa xác thực</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ fontSize:13, color:'var(--text-sec)' }}>{u.email}</div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>{u.phone}</div>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:11, padding:'3px 9px', borderRadius:2, background:rs.bg, color:rs.color, fontWeight:500 }}>{rs.label}</span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:11, padding:'3px 9px', borderRadius:2, ...(u.isActive?{background:'rgba(82,201,124,.12)',color:'var(--green)'}:{background:'rgba(90,88,80,.2)',color:'var(--text-muted)'}) }}>
                        {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px', fontSize:12, color:'var(--text-muted)' }}>
                      {u.createdAt ? formatDateFull(u.createdAt) : '—'}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <button onClick={() => openDetail(u)}
                        style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-sec)', borderRadius:4, padding:'5px 12px', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif", transition:'.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold)'; e.currentTarget.style.color='var(--gold)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-sec)' }}>
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>
              {search ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người dùng nào'}
            </div>
          )}
        </div>
      )}

      {/* User Detail Modal */}
      <Modal open={!!detail} onClose={() => { setDetail(null); setUB([]) }} title="Chi tiết người dùng" maxWidth={600}>
        {detail && (
          <div>
            {/* User info */}
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--gold)', color:'#000', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, flexShrink:0 }}>
                {detail.fullName?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, marginBottom:4 }}>{detail.fullName}</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:2, ...(ROLE_STYLE[detail.role]||{}) }}>
                    {ROLE_STYLE[detail.role]?.label || detail.role}
                  </span>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:2, ...(detail.isActive?{background:'rgba(82,201,124,.12)',color:'var(--green)'}:{background:'rgba(224,82,82,.12)',color:'var(--red)'}) }}>
                    {detail.isActive ? 'Đang hoạt động' : 'Bị khóa'}
                  </span>
                  {!detail.isVerified && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:2, background:'rgba(224,82,82,.1)', color:'var(--red)' }}>Chưa xác thực</span>}
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div style={{ background:'var(--bg-card2)', borderRadius:8, padding:16, marginBottom:16 }}>
              {[['📧 Email', detail.email],['📞 SĐT', detail.phone],['🎂 Ngày sinh', detail.dateOfBirth ? formatDateFull(detail.dateOfBirth) : '—'],['⚧ Giới tính', detail.gender || '—'],['📅 Ngày tạo', detail.createdAt ? formatDateFull(detail.createdAt) : '—'],['🔑 Lần đăng nhập cuối', detail.lastLoginAt ? `${formatTime(detail.lastLoginAt)} ${formatDate(detail.lastLoginAt)}` : '—']].map(([l,v]) => v && (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13, borderBottom:'1px solid var(--border)' }}>
                  <span style={{ color:'var(--text-muted)' }}>{l}</span>
                  <span style={{ color:'var(--text-pri)' }}>{v}</span>
                </div>
              ))}
            </div>

            {(() => {
              const isMe = detail.id === currentUser?.id; 

              return (
                <div style={{ background:'rgba(201,168,76,.05)', border:'1px solid var(--border-gold)', borderRadius:8, padding:16, marginBottom:20, display:'flex', gap:16, alignItems:'center', flexWrap:'wrap', opacity: isMe ? 0.6 : 1 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label style={{ fontSize: 12, color: 'var(--gold)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Thay đổi quyền hạn</label>
                      {isMe && <span style={{ fontSize: 11, color: 'var(--red)' }}>* Không thể tự sửa mình</span>}
                    </div>
                    <select 
                      value={detail.role} 
                      onChange={(e) => handleRoleChange(detail.id, e.target.value)}
                      disabled={isMe} // Khóa không cho chọn nếu là chính mình
                      style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-pri)', padding: '8px 12px', borderRadius: 4, outline: 'none', cursor: isMe ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}
                    >
                      <option value="customer">Khách hàng</option>
                      <option value="staff">Nhân viên (Staff)</option>
                      <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'flex-end' }}>
                    <button 
                      onClick={() => handleToggleLock(detail)}
                      disabled={isMe} // Khóa nút bấm nếu là chính mình
                      style={{ width: '100%', padding: '9px 16px', borderRadius: 4, cursor: isMe ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500, border: 'none', fontFamily: "'DM Sans',sans-serif", transition: '.2s', background: detail.isActive ? 'rgba(224,82,82,.15)' : 'rgba(82,201,124,.15)', color: detail.isActive ? 'var(--red)' : 'var(--green)' }}
                    >
                      {detail.isActive ? '🔒 Khóa tài khoản này' : '🔓 Mở khóa tài khoản'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Booking history */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ fontSize:14, fontWeight:500 }}>
                  Lịch sử đặt vé
                  {userBookings.length > 0 && <span style={{ color:'var(--text-muted)', fontSize:12, fontWeight:400, marginLeft:8 }}>({userBookings.length} đơn)</span>}
                </div>
                {totalBookingRevenue > 0 && (
                  <div style={{ fontSize:13, color:'var(--gold)' }}>
                    Tổng chi: {formatCurrency(totalBookingRevenue)}
                  </div>
                )}
              </div>

              {bookingsLoading ? (
                <div style={{ display:'flex', justifyContent:'center', padding:24 }}><Spinner /></div>
              ) : userBookings.length === 0 ? (
                <div style={{ textAlign:'center', padding:24, color:'var(--text-muted)', fontSize:13 }}>
                  Người dùng chưa có đơn đặt vé nào
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:280, overflowY:'auto' }}>
                  {userBookings.slice(0, 10).map(b => {
                    const ss = BOOKING_STATUS[b.status] || BOOKING_STATUS.expired
                    return (
                      <div key={b.id} style={{ background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:8, padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:13, color:'var(--gold)', letterSpacing:1 }}>{b.bookingCode}</span>
                            <span style={{ fontSize:10, color:ss.color }}>{ss.label}</span>
                          </div>
                          <div style={{ fontSize:12, color:'var(--text-sec)', maxWidth:260, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.movieTitle}</div>
                          {b.startTime && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{formatTime(b.startTime)} · {formatDate(b.startTime)}</div>}
                        </div>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:'var(--gold)', fontWeight:500, flexShrink:0 }}>
                          {formatCurrency(b.finalAmount)}
                        </div>
                      </div>
                    )
                  })}
                  {userBookings.length > 10 && (
                    <div style={{ textAlign:'center', fontSize:12, color:'var(--text-muted)', padding:8 }}>
                      ... và {userBookings.length - 10} đơn hàng khác
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
