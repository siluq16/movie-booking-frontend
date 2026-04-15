import { useState, useEffect, useMemo } from 'react'
import api from '../../services/api' // Khôi phục import api
import Spinner from '../../components/common/Spinner'

const MOCK = [
  { id: '1', code: 'SUMMER25', title: 'Khuyến mãi Hè 2025', description: 'Giảm 25% cho tất cả suất chiếu buổi sáng từ 9h–12h. Áp dụng cho mọi thể loại ghế.', discountType: 'percentage', discountValue: 25, maxDiscountAmount: 50000, minOrderValue: 100000, validFrom: '2025-06-01T00:00:00', validTo: '2025-08-31T23:59:59', isActive: true, usedCount: 842, maxUses: 2000 },
  { id: '2', code: 'NEWUSER50', title: 'Chào thành viên mới', description: 'Giảm ngay 50.000đ cho lần đặt vé đầu tiên. Không giới hạn số ghế, áp dụng cho tất cả suất chiếu.', discountType: 'fixed_amount', discountValue: 50000, minOrderValue: 150000, validFrom: '2025-01-01T00:00:00', validTo: '2025-12-31T23:59:59', isActive: true, usedCount: 1203, maxUses: null },
  { id: '3', code: 'IMAX30', title: 'Ưu đãi IMAX Premium', description: 'Giảm 30% khi đặt vé xem phim ở phòng IMAX. Áp dụng từ thứ 2 đến thứ 5 hàng tuần.', discountType: 'percentage', discountValue: 30, maxDiscountAmount: 80000, minOrderValue: 200000, validFrom: '2025-04-01T00:00:00', validTo: '2025-09-30T23:59:59', isActive: true, usedCount: 347, maxUses: 1000 },
  { id: '4', code: 'COUPLE2', title: 'Combo Cặp Đôi', description: 'Mua 2 vé bất kỳ tặng 1 combo bắp nước trị giá 110.000đ. Áp dụng cuối tuần.', discountType: 'fixed_amount', discountValue: 110000, minOrderValue: 300000, validFrom: '2025-03-01T00:00:00', validTo: '2025-06-30T23:59:59', isActive: true, usedCount: 500, maxUses: 500 },
]

function countdown(validTo) {
  const diff = new Date(validTo) - Date.now()
  if (diff <= 0) return 'Đã hết hạn'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  return d > 0 ? `Còn ${d} ngày` : `Còn ${h} giờ`
}

function usePct(used, max) {
  if (!max) return null
  return Math.min(100, Math.round((used / max) * 100))
}

export default function PromotionsPage() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  // KHÔI PHỤC LOGIC API CỦA BẠN
  useEffect(() => {
    setLoading(true)
    api.get('/promotions')
      .then(r => {
        // Lọc các promo đang active từ server
        setPromos(r.data.filter(p => p.isActive))
      })
      .catch(() => {
        // Fallback về MOCK nếu API lỗi hoặc đang dev backend
        setPromos(MOCK.filter(p => p.isActive))
      })
      .finally(() => setLoading(false))
  }, [])

  const copy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const fmt = v => v?.toLocaleString('vi-VN') + 'đ'

  // Logic lọc theo Tab
  const filteredPromos = useMemo(() => {
    if (activeTab === 'all') return promos
    return promos.filter(p => p.discountType === activeTab)
  }, [promos, activeTab])

  return (
    <>
      {/* Hero Section */}
      <div style={{ background: 'linear-gradient(135deg, rgba(201,168,76,.08), transparent)', borderBottom: '1px solid var(--border)', padding: '60px 5% 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 3, marginBottom: 12, fontWeight: 600, textTransform: 'uppercase' }}>Ưu đãi & Khuyến mãi</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 48px)', marginBottom: 12, lineHeight: 1.1 }}>
              Deal Hot <span style={{ color: 'var(--gold)' }}>Hôm Nay</span>
            </h1>
            <p style={{ color: 'var(--text-sec)', fontSize: 16, maxWidth: 500 }}>Sử dụng mã giảm giá để tận hưởng trải nghiệm điện ảnh đẳng cấp với chi phí tối ưu nhất.</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 12, padding: '16px 24px' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, color: 'var(--gold)', lineHeight: 1 }}>{promos.length}</div>
            <div style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.4 }}>Mã ưu đãi<br/>đang hoạt động</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 5% 80px' }}>
        
        {/* Tabs Filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, overflowX: 'auto', paddingBottom: 8 }}>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'percentage', label: 'Giảm theo %' },
            { id: 'fixed_amount', label: 'Giảm tiền mặt' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 24px', borderRadius: 30, border: '1px solid', cursor: 'pointer', fontSize: 14, fontWeight: 500, transition: 'all 0.2s', whiteSpace: 'nowrap',
                background: activeTab === tab.id ? 'var(--gold)' : 'transparent',
                borderColor: activeTab === tab.id ? 'var(--gold)' : 'var(--border)',
                color: activeTab === tab.id ? '#000' : 'var(--text-pri)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}><Spinner size="lg" /></div>
        ) : filteredPromos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-sec)', background: 'var(--bg-card)', borderRadius: 12, border: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
            <div>Hiện không có mã khuyến mãi nào trong mục này.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 24 }}>
            {filteredPromos.map(p => {
              const pct = usePct(p.usedCount, p.maxUses)
              const isExpiringSoon = new Date(p.validTo) - Date.now() < 7 * 86400000

              return (
                <div key={p.id} style={{ 
                  background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, 
                  display: 'flex', flexDirection: 'column', transition: '0.2s', position: 'relative', overflow: 'hidden'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--gold-light)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  {isExpiringSoon && (
                    <div style={{ position: 'absolute', top: 16, right: -28, background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 'bold', padding: '4px 32px', transform: 'rotate(45deg)', zIndex: 1 }}>
                      SẮP HẾT
                    </div>
                  )}

                  <div style={{ padding: 24, flex: 1 }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                      <div style={{ flexShrink: 0, background: 'rgba(201,168,76,.1)', borderRadius: 12, padding: '12px', minWidth: 70, textAlign: 'center', border: '1px solid rgba(201,168,76,.3)' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-sec)', marginBottom: 4 }}>GIẢM</div>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: 'var(--gold)', fontWeight: 'bold' }}>
                          {p.discountType === 'percentage' ? `${p.discountValue}%` : (p.discountValue / 1000) + 'K'}
                        </div>
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: 'var(--text-pri)' }}>{p.title}</h3>
                        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.5 }}>{p.description}</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16, background: 'var(--bg-card2)', padding: 12, borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Đơn tối thiểu</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{fmt(p.minOrderValue)}</div>
                      </div>
                      {p.maxDiscountAmount && (
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Giảm tối đa</div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{fmt(p.maxDiscountAmount)}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ borderTop: '2px dashed var(--border)', padding: 20, position: 'relative' }}>
                    {/* Hiệu ứng đục lỗ vé */}
                    <div style={{ position: 'absolute', top: -8, left: -8, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-body)', borderRight: '1px solid var(--border)' }} />
                    <div style={{ position: 'absolute', top: -8, right: -8, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-body)', borderLeft: '1px solid var(--border)' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        {pct !== null && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-sec)', marginBottom: 6 }}>
                              <span>Đã dùng {pct}%</span>
                              <span style={{ color: isExpiringSoon ? 'var(--red)' : 'inherit' }}>{countdown(p.validTo)}</span>
                            </div>
                            <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? 'var(--red)' : 'var(--gold)' }} />
                            </div>
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>MÃ: <span style={{ color: 'var(--text-pri)', fontWeight: 'bold' }}>{p.code}</span></div>
                      </div>

                      <button onClick={() => copy(p.code)} style={{ flexShrink: 0, height: 40, background: copied === p.code ? 'var(--green)' : 'var(--gold)', color: '#000', border: 'none', padding: '0 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                        {copied === p.code ? 'Đã lưu' : 'Lưu mã'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: 48, background: 'rgba(201,168,76,.05)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 16 }}>
          <span style={{ fontSize: 24 }}>💡</span>
          <div style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6 }}>
            Mã khuyến mãi được nhập ở bước thanh toán. Mỗi mã chỉ được dùng một lần cho một tài khoản. Chương trình có thể kết thúc sớm nếu hết lượt sử dụng.
          </div>
        </div>
      </div>
    </>
  )
}