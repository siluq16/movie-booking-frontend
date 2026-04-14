import { useState, useEffect } from 'react'
import { revenueService } from '../../services/movieService'
import Spinner from '../../components/common/Spinner'
import { formatCurrency } from '../../utils/formatters'

function BarChart({ data }) {
  const [hovered, setHovered] = useState(null)
  const max = Math.max(...data.map(d => d.revenue), 1)
  return (
    <div style={{ display:'flex', gap:5, alignItems:'flex-end', height:160 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          {hovered === i && (
            <div style={{ fontSize:10, color:'var(--gold)', whiteSpace:'nowrap', background:'var(--bg-card2)', padding:'2px 6px', borderRadius:3 }}>
              {formatCurrency(d.revenue)}
            </div>
          )}
          <div style={{ width:'100%', height: Math.max(4, Math.round((d.revenue/max)*140))+'px', background:hovered===i?'var(--gold-light)':'linear-gradient(to top,var(--gold-dark),var(--gold))', borderRadius:'3px 3px 0 0', cursor:'pointer', transition:'.2s', flexShrink:0 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
          <span style={{ fontSize:10, color:hovered===i?'var(--gold)':'var(--text-muted)' }}>{d.month}</span>
        </div>
      ))}
    </div>
  )
}

export default function Revenue() {
  const [data, setData] = useState([])
  const [monthlyData, setMonthlyData] = useState([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    // Gọi song song cả 2 API: Rạp và Tháng
    Promise.all([
      revenueService.getCinemaRevenue(),
      revenueService.getMonthlyRevenue(year)
    ])
      .then(([cinemaRes, monthlyRes]) => {
        setData(Array.isArray(cinemaRes.data) ? cinemaRes.data : [])
        setMonthlyData(Array.isArray(monthlyRes.data) ? monthlyRes.data : [])
      })
      .catch(() => {
        setData([])
        setMonthlyData([])
      })
      .finally(() => setLoading(false))
  }, [year]) // Tự động fetch lại khi đổi năm

  const total        = data.reduce((a, c) => a + (c.totalRevenue  || 0), 0)
  const totalTicket  = data.reduce((a, c) => a + (c.ticketRevenue || 0), 0)
  const totalFood    = data.reduce((a, c) => a + (c.foodRevenue   || 0), 0)
  const totalOrders  = data.reduce((a, c) => a + (c.totalBookings || 0), 0)

  // Tạo danh sách năm cho select box (từ 2024 đến năm hiện tại + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, margin: 0 }}>
          Báo Cáo <span style={{ color:'var(--gold)' }}>Doanh Thu</span>
        </h1>
        {/* Nút chọn năm */}
        <select 
          value={year} 
          onChange={(e) => setYear(Number(e.target.value))}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-pri)', padding: '8px 16px', borderRadius: 8, outline: 'none', cursor: 'pointer' }}
        >
          {years.map(y => (
            <option key={y} value={y}>Năm {y}</option>
          ))}
        </select>
      </div>

      {/* Các thẻ Stats giữ nguyên */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:16, marginBottom:32 }}>
        {[['Tổng doanh thu',formatCurrency(total),'💰','var(--gold)'],['Doanh thu vé',formatCurrency(totalTicket),'🎟️','var(--green)'],['Doanh thu F&B',formatCurrency(totalFood),'🍿','#4a9fd0'],['Tổng đơn hàng',totalOrders.toLocaleString(),'📋','#c070c0']].map(([l,v,i,c]) => (
          <div key={l} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'20px 22px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:13, color:'var(--text-sec)' }}>{l}</span>
              <span style={{ fontSize:22 }}>{i}</span>
            </div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:24, marginBottom:24 }}>
        {/* Monthly chart (Bây giờ dùng data thật) */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18 }}>Doanh thu theo tháng</h3>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>Năm {year}</span>
          </div>
          {loading ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>
          ) : (
            <BarChart data={monthlyData} />
          )}
        </div>

        {/* Breakdown giữ nguyên */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:24 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, marginBottom:20 }}>Cơ cấu doanh thu</h3>
          {total > 0 && [['Vé phim', totalTicket, 'var(--gold)'],['Đồ ăn & nước', totalFood, '#4a9fd0']].map(([l,v,c]) => {
            const pct = Math.round((v/total)*100)
            return (
              <div key={l} style={{ marginBottom:18 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                  <span style={{ color:'var(--text-sec)' }}>{l}</span>
                  <span style={{ color:c }}>{pct}% · {formatCurrency(v)}</span>
                </div>
                <div style={{ height:8, background:'var(--bg-card2)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background:c, borderRadius:4, transition:'width .8s' }} />
                </div>
              </div>
            )
          })}
          {total > 0 && totalOrders > 0 && (
            <div style={{ marginTop:24, background:'var(--bg-card2)', borderRadius:8, padding:16 }}>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>Trung bình / đơn hàng</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:'var(--gold)' }}>
                {formatCurrency(Math.round(total/totalOrders))}
              </div>
            </div>
          )}
          {total === 0 && (
            <div style={{ textAlign:'center', padding:32, color:'var(--text-muted)', fontSize:13 }}>
              Chưa có dữ liệu doanh thu
            </div>
          )}
        </div>
      </div>

      {/* Per-cinema table giữ nguyên */}
      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size="lg" /></div>
      ) : (
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
            <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18 }}>Doanh thu theo rạp</h3>
          </div>
          {data.length === 0 ? (
            <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
              Chưa có dữ liệu cho năm {year}.
            </div>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'var(--bg-card2)' }}>
                  {['Rạp','Thành phố','Doanh thu vé','Doanh thu F&B','Tổng','Số đơn','Tỉ trọng'].map(h => (
                    <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:11, color:'var(--text-muted)', letterSpacing:.5, fontWeight:500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(c => {
                  const pct = total > 0 ? Math.round((c.totalRevenue/total)*100) : 0
                  return (
                    <tr key={c.cinemaId} style={{ borderTop:'1px solid var(--border)' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg-card2)'}
                      onMouseLeave={e => e.currentTarget.style.background=''}
                    >
                      <td style={{ padding:'12px 16px', fontSize:14, fontWeight:500 }}>{c.cinemaName}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-sec)' }}>{c.city}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'var(--green)' }}>{formatCurrency(c.ticketRevenue||0)}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'#4a9fd0' }}>{formatCurrency(c.foodRevenue||0)}</td>
                      <td style={{ padding:'12px 16px', fontSize:14, fontWeight:500, color:'var(--gold)' }}>{formatCurrency(c.totalRevenue)}</td>
                      <td style={{ padding:'12px 16px', fontSize:13, color:'var(--text-sec)' }}>{c.totalBookings?.toLocaleString()}</td>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ flex:1, height:6, background:'var(--bg-card2)', borderRadius:3, overflow:'hidden', minWidth:60 }}>
                            <div style={{ height:'100%', width:`${pct}%`, background:'var(--gold)', borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:12, color:'var(--text-muted)', minWidth:28 }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}