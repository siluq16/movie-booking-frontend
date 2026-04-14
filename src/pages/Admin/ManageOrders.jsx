import { useState, useEffect } from 'react'
import { bookingService } from '../../services/movieService'
import Spinner from '../../components/common/Spinner'
import Modal from '../../components/common/Modal'
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters'

const STATUS_STYLE = {
  confirmed:{ bg:'rgba(82,201,124,.12)', color:'var(--green)',    label:'Đã xác nhận' },
  pending:  { bg:'rgba(201,168,76,.1)',  color:'var(--gold)',     label:'Chờ thanh toán' },
  cancelled:{ bg:'rgba(224,82,82,.1)',   color:'var(--red)',      label:'Đã hủy' },
  expired:  { bg:'rgba(90,88,80,.15)',   color:'var(--text-muted)',label:'Hết hạn' },
  refunded: { bg:'rgba(74,159,208,.1)',  color:'#4a9fd0',         label:'Đã hoàn tiền' },
}

export default function ManageOrders() {
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatus] = useState('all')
  const [detail, setDetail]     = useState(null)
  const [page, setPage]         = useState(1)
  const PAGE_SIZE = 10

  useEffect(() => {
    bookingService.getAll()
      .then(r => setOrders(Array.isArray(r.data) ? r.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders.filter(o => {
    const ms = statusFilter === 'all' || o.status === statusFilter
    const mq = !search || [o.bookingCode, o.userName, o.movieTitle].some(f => f?.toLowerCase().includes(search.toLowerCase()))
    return ms && mq
  })

  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const counts = { all: orders.length }
  Object.keys(STATUS_STYLE).forEach(k => { counts[k] = orders.filter(o => o.status === k).length })
  const confirmedRevenue = orders.filter(o => o.status === 'confirmed').reduce((a, o) => a + (o.finalAmount || 0), 0)

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26 }}>
          Quản lý <span style={{ color:'var(--gold)' }}>Đơn Hàng</span>
        </h1>
        <div style={{ fontSize:14, color:'var(--text-sec)' }}>
          Doanh thu xác nhận: <span style={{ color:'var(--gold)', fontWeight:500 }}>{formatCurrency(confirmedRevenue)}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:24 }}>
        {[['Tổng đơn',counts.all,'📋','var(--text-pri)'],['Xác nhận',counts.confirmed,'✅','var(--green)'],['Chờ TT',counts.pending,'⏳','var(--gold)'],['Đã hủy',counts.cancelled,'❌','var(--red)'],['Hoàn tiền',counts.refunded,'↩️','#4a9fd0']].map(([l,v,i,c]) => (
          <div key={l} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'14px 16px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', transition:'.15s' }}
            onClick={() => { setStatus(l==='Tổng đơn'?'all':l==='Xác nhận'?'confirmed':l==='Chờ TT'?'pending':l==='Đã hủy'?'cancelled':'refunded'); setPage(1) }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-gold)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
          >
            <span style={{ fontSize:20 }}>{i}</span>
            <div><div style={{ fontSize:22, fontWeight:500, color:c }}>{v ?? 0}</div><div style={{ fontSize:11, color:'var(--text-muted)' }}>{l}</div></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="🔍 Tìm mã vé, tên khách, tên phim..."
          style={{ background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 14px', color:'var(--text-pri)', fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", flex:1, minWidth:220 }}
          onFocus={e => e.target.style.borderColor='var(--gold)'}
          onBlur={e => e.target.style.borderColor='var(--border)'}
        />
        <div style={{ display:'flex', borderRadius:6, overflow:'hidden', border:'1px solid var(--border)' }}>
          {[['all','Tất cả'],['confirmed','Xác nhận'],['pending','Chờ TT'],['cancelled','Đã hủy'],['refunded','Hoàn tiền']].map(([v,l]) => (
            <button key={v} onClick={() => { setStatus(v); setPage(1) }} style={{ padding:'8px 12px', background:statusFilter===v?'var(--gold)':'var(--bg-card)', border:'none', borderLeft:v!=='all'?'1px solid var(--border)':'none', color:statusFilter===v?'#000':'var(--text-sec)', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap', fontWeight:statusFilter===v?500:400 }}>{l}</button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size="lg" /></div> : (
        <>
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', marginBottom:16 }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg-card2)' }}>
                  {['Mã vé','Khách hàng','Phim','Suất chiếu','Số tiền','Trạng thái',''].map(h => (
                    <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:11, color:'var(--text-muted)', letterSpacing:.5, fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map(o => {
                  const ss = STATUS_STYLE[o.status] || STATUS_STYLE.expired
                  return (
                    <tr key={o.id} style={{ borderTop:'1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg-card2)'}
                      onMouseLeave={e => e.currentTarget.style.background=''}
                    >
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, color:'var(--gold)', letterSpacing:1 }}>{o.bookingCode}</div>
                        <div style={{ fontSize:10, color:'var(--text-muted)' }}>{o.createdAt ? formatDate(o.createdAt) : '—'}</div>
                      </td>
                      <td style={{ padding:'11px 14px', fontSize:13, color:'var(--text-sec)' }}>{o.userName || '—'}</td>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ fontSize:13, fontWeight:500, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.movieTitle || '—'}</div>
                        {o.cinemaName && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{o.cinemaName}</div>}
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ fontSize:13 }}>{o.startTime ? formatTime(o.startTime) : '—'}</div>
                        {o.screenFormat && <div style={{ fontSize:10, color:'var(--text-muted)' }}>{o.screenFormat}</div>}
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <div style={{ fontSize:14, color:'var(--gold)', fontWeight:500 }}>{formatCurrency(o.finalAmount)}</div>
                        {o.discountAmount > 0 && <div style={{ fontSize:10, color:'var(--green)' }}>−{formatCurrency(o.discountAmount)}</div>}
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <span style={{ fontSize:11, padding:'3px 9px', borderRadius:2, background:ss.bg, color:ss.color }}>{ss.label}</span>
                      </td>
                      <td style={{ padding:'11px 14px' }}>
                        <button onClick={() => setDetail(o)} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-sec)', borderRadius:4, padding:'4px 10px', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif", transition:'.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold)'; e.currentTarget.style.color='var(--gold)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-sec)' }}>
                          Xem
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>Không tìm thấy đơn hàng</div>}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={{ padding:'6px 14px', borderRadius:4, border:'1px solid var(--border)', background:'var(--bg-card)', color:page===1?'var(--text-muted)':'var(--text-sec)', cursor:page===1?'not-allowed':'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>← Trước</button>
              {Array.from({length: Math.min(7, totalPages)}, (_, i) => {
                const pg = i + 1
                return <button key={pg} onClick={() => setPage(pg)} style={{ padding:'6px 12px', borderRadius:4, border:`1px solid ${page===pg?'var(--gold)':'var(--border)'}`, background:page===pg?'var(--gold)':'var(--bg-card)', color:page===pg?'#000':'var(--text-sec)', cursor:'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{pg}</button>
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} style={{ padding:'6px 14px', borderRadius:4, border:'1px solid var(--border)', background:'var(--bg-card)', color:page===totalPages?'var(--text-muted)':'var(--text-sec)', cursor:page===totalPages?'not-allowed':'pointer', fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Sau →</button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Chi tiết đơn hàng" maxWidth={460}>
        {detail && (() => {
          const ss = STATUS_STYLE[detail.status] || STATUS_STYLE.expired
          return (
            <div>
              <div style={{ textAlign:'center', marginBottom:20 }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, color:'var(--gold)', letterSpacing:4, marginBottom:8 }}>{detail.bookingCode}</div>
                <span style={{ fontSize:11, padding:'3px 10px', borderRadius:2, background:ss.bg, color:ss.color, fontWeight:500 }}>{ss.label}</span>
              </div>
              <div style={{ background:'var(--bg-card2)', borderRadius:8, padding:16, marginBottom:14 }}>
                {[['Khách hàng',detail.userName],['Phim',detail.movieTitle],['Rạp',detail.cinemaName],['Suất chiếu',detail.startTime?`${formatTime(detail.startTime)} · ${formatDate(detail.startTime)}`:'—'],['Định dạng',detail.screenFormat],['Ghế',detail.seats?.map(s=>`${s.rowLabel}${s.seatNumber}`).join(', ')],['Đặt lúc',detail.createdAt?`${formatTime(detail.createdAt)} ${formatDate(detail.createdAt)}`:'—']].map(([l,v]) => v && (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13, borderBottom:'1px solid var(--border)' }}>
                    <span style={{ color:'var(--text-muted)' }}>{l}</span>
                    <span style={{ color:'var(--text-pri)', maxWidth:'55%', textAlign:'right' }}>{v}</span>
                  </div>
                ))}
              </div>
              {[['Tiền vé',detail.ticketTotal],['Đồ ăn',detail.foodTotal],detail.discountAmount>0&&['Giảm giá',-detail.discountAmount]].filter(Boolean).map(([l,v]) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text-sec)', padding:'4px 0' }}>
                  <span>{l}</span><span style={{ color:v<0?'var(--green)':'var(--text-pri)' }}>{v<0?'−':''}{formatCurrency(Math.abs(v))}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:20, fontWeight:500, color:'var(--gold)', borderTop:'1px solid var(--border)', marginTop:8, paddingTop:12 }}>
                <span>Tổng cộng</span><span>{formatCurrency(detail.finalAmount)}</span>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
