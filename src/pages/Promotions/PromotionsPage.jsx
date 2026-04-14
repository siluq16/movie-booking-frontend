import { useState, useEffect } from 'react'
import api from '../../services/api'
import Spinner from '../../components/common/Spinner'

const MOCK = [
  { id: '1', code: 'SUMMER25', title: 'Khuyến mãi Hè 2025', description: 'Giảm 25% cho tất cả suất chiếu buổi sáng từ 9h–12h. Áp dụng cho mọi thể loại ghế.', discountType: 'percentage', discountValue: 25, maxDiscountAmount: 50000, minOrderValue: 100000, validFrom: '2025-06-01T00:00:00', validTo: '2025-08-31T23:59:59', isActive: true, usedCount: 842, maxUses: 2000 },
  { id: '2', code: 'NEWUSER50', title: 'Chào thành viên mới', description: 'Giảm ngay 50.000đ cho lần đặt vé đầu tiên. Không giới hạn số ghế, áp dụng cho tất cả suất chiếu.', discountType: 'fixed_amount', discountValue: 50000, minOrderValue: 150000, validFrom: '2025-01-01T00:00:00', validTo: '2025-12-31T23:59:59', isActive: true, usedCount: 1203, maxUses: null },
  { id: '3', code: 'IMAX30', title: 'Ưu đãi IMAX Premium', description: 'Giảm 30% khi đặt vé xem phim ở phòng IMAX. Áp dụng từ thứ 2 đến thứ 5 hàng tuần.', discountType: 'percentage', discountValue: 30, maxDiscountAmount: 80000, minOrderValue: 200000, validFrom: '2025-04-01T00:00:00', validTo: '2025-09-30T23:59:59', isActive: true, usedCount: 347, maxUses: 1000 },
  { id: '4', code: 'COUPLE2', title: 'Combo Cặp Đôi', description: 'Mua 2 vé bất kỳ tặng 1 combo bắp nước trị giá 110.000đ. Áp dụng cuối tuần.', discountType: 'fixed_amount', discountValue: 110000, minOrderValue: 300000, validFrom: '2025-03-01T00:00:00', validTo: '2025-06-30T23:59:59', isActive: false, usedCount: 500, maxUses: 500 },
]

function countdown(validTo) {
  const diff = new Date(validTo) - Date.now()
  if (diff <= 0) return 'Đã hết hạn'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  if (d > 0) return `Còn ${d} ngày`
  return `Còn ${h} giờ`
}

function usePct(used, max) {
  if (!max) return null
  return Math.min(100, Math.round((used / max) * 100))
}

export default function PromotionsPage() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    api.get('/promotions')
      .then(r => setPromos(r.data.filter(p => p.isActive)))
      .catch(() => setPromos(MOCK.filter(p => p.isActive)))
      .finally(() => setLoading(false))
  }, [])

  const copy = (code) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const fmt = v => v?.toLocaleString('vi-VN') + 'đ'

  return (
    <>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, rgba(201,168,76,.08), transparent)', borderBottom: '1px solid var(--border)', padding: '60px 5% 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 3, marginBottom: 12 }}>ƯU ĐÃI & KHUYẾN MÃI</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,44px)', marginBottom: 10 }}>
              Deal Hot <span style={{ color: 'var(--gold)' }}>Hôm Nay</span>
            </h1>
            <p style={{ color: 'var(--text-sec)', fontSize: 15 }}>Sao chép mã và nhập khi thanh toán để nhận ưu đãi</p>
          </div>
          <div style={{ textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 10, padding: '16px 28px' }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: 'var(--gold)' }}>{promos.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>mã đang hoạt động</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 5% 80px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size="lg" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: 20 }}>
            {promos.map(p => {
              const pct = usePct(p.usedCount, p.maxUses)
              const isExpiringSoon = new Date(p.validTo) - Date.now() < 7 * 86400000
              return (
                <div key={p.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: '.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-gold)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {/* Top stripe */}
                  <div style={{ height: 3, background: 'linear-gradient(to right, var(--gold-dark), var(--gold), var(--gold-light))' }} />

                  <div style={{ padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                      <div>
                        {isExpiringSoon && (
                          <div style={{ fontSize: 10, background: 'rgba(224,82,82,.15)', color: 'var(--red)', border: '1px solid rgba(224,82,82,.3)', padding: '2px 8px', borderRadius: 2, display: 'inline-block', marginBottom: 8, letterSpacing: .5 }}>
                            🔥 SẮP HẾT HẠN
                          </div>
                        )}
                        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-pri)', marginBottom: 4 }}>{p.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6 }}>{p.description}</div>
                      </div>
                      {/* Discount badge */}
                      <div style={{ flexShrink: 0, textAlign: 'center', background: 'rgba(201,168,76,.1)', border: '1px solid var(--border-gold)', borderRadius: 8, padding: '10px 14px', minWidth: 80 }}>
                        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: 'var(--gold)', lineHeight: 1 }}>
                          {p.discountType === 'percentage' ? `${p.discountValue}%` : fmt(p.discountValue)}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>GIẢM</div>
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                      {p.minOrderValue > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Đơn tối thiểu: <span style={{ color: 'var(--text-sec)' }}>{fmt(p.minOrderValue)}</span></span>}
                      {p.maxDiscountAmount && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Giảm tối đa: <span style={{ color: 'var(--text-sec)' }}>{fmt(p.maxDiscountAmount)}</span></span>}
                      <span style={{ fontSize: 12, color: isExpiringSoon ? 'var(--red)' : 'var(--text-muted)' }}>{countdown(p.validTo)}</span>
                    </div>

                    {/* Usage bar */}
                    {pct !== null && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
                          <span>Đã dùng {p.usedCount?.toLocaleString()} / {p.maxUses?.toLocaleString()}</span>
                          <span>{pct}%</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--bg-card2)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: pct > 80 ? 'var(--red)' : 'var(--gold)', borderRadius: 2, transition: 'width .5s' }} />
                        </div>
                      </div>
                    )}

                    {/* Code + Copy */}
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ flex: 1, background: 'var(--bg-card2)', border: '1px dashed var(--border-gold)', borderRadius: 6, padding: '10px 14px', fontFamily: "'Playfair Display', serif", fontSize: 18, color: 'var(--gold)', letterSpacing: 3, textAlign: 'center' }}>
                        {p.code}
                      </div>
                      <button onClick={() => copy(p.code)} style={{ flexShrink: 0, background: copied === p.code ? 'var(--green)' : 'var(--gold)', color: '#000', border: 'none', padding: '10px 18px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", transition: '.2s', whiteSpace: 'nowrap' }}>
                        {copied === p.code ? '✓ Đã chép' : '📋 Sao chép'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info note */}
        <div style={{ marginTop: 48, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>ℹ️</span>
          <div style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.7 }}>
            Mã khuyến mãi được nhập ở bước chọn đồ ăn trong quá trình đặt vé. Mỗi mã chỉ được dùng một lần / tài khoản trừ khi có quy định khác. Chương trình có thể thay đổi mà không cần thông báo trước.
          </div>
        </div>
      </div>
    </>
  )
}
