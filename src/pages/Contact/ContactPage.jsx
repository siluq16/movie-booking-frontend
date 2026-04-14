import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import toast from 'react-hot-toast'
import { cinemaService } from '../../services/movieService' 

const FAQS = [
  { q: 'Hướng dẫn đặt vé trực tuyến như thế nào?', a: 'Bước 1: Đăng nhập tài khoản. Bước 2: Chọn phim, rạp và suất chiếu. Bước 3: Chọn ghế. Bước 4: Chọn combo bắp nước. Bước 5: Thanh toán và nhận mã vé qua email/ứng dụng.' },
  { q: 'Chính sách đổi hoặc hoàn vé ra sao?', a: 'Vé đã mua thành công không được đổi hoặc hoàn tiền dưới mọi hình thức. Trong trường hợp rạp gặp sự cố kỹ thuật hủy suất chiếu, chúng tôi sẽ hoàn tiền 100% hoặc đổi vé suất khác cho bạn.' },
  { q: 'Thẻ hội viên tích điểm như thế nào?', a: 'Mỗi 10.000đ chi tiêu = 1 điểm. 1.000 điểm = 1 vé xem phim 2D miễn phí. Điểm có giá trị trong 12 tháng kể từ ngày tích.' },
  { q: 'Đặt vé cho trẻ em dưới 3 tuổi thế nào?', a: 'Trẻ em dưới 3 tuổi được vào cùng phụ huynh miễn phí nếu không ngồi ghế riêng. Từ 3 tuổi trở lên cần mua vé thông thường.' },
  { q: 'Tôi có thể đặt bao nhiêu ghế mỗi lần?', a: 'Mỗi tài khoản có thể đặt tối đa 8 ghế cho một suất chiếu. Để đặt số lượng lớn hơn vui lòng liên hệ hotline.' },
]

const CITIES = ['Hà Nội', 'Hồ Chí Minh', 'Nghệ An', 'Tỉnh thành khác']

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  
  const [branches, setBranches] = useState([])
  const [loadingBranches, setLoadingBranches] = useState(true)
  const [selectedCity, setSelectedCity] = useState('Hà Nội') 

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const { hash } = useLocation()

  useEffect(() => {
    if (hash === '#faq') {
      const element = document.getElementById('faq')
      if (element) {
        setTimeout(() => {
          const yOffset = -80; 
          const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }, 100)
      }
    }
  }, [hash])

  useEffect(() => {
    const fetchCinemas = async () => {
      try {
        const res = await cinemaService.getAll()
        setBranches(Array.isArray(res.data) ? res.data : [])
      } catch (error) {
        console.error("Không thể lấy danh sách chi nhánh:", error)
      } finally {
        setLoadingBranches(false)
      }
    }
    fetchCinemas()
  }, [])

  const getCityCategory = (cinema) => {
    const addr = (cinema.address || '').toLowerCase()
    const city = (cinema.city || '').toLowerCase()
    
    if (city.includes('hà nội') || addr.includes('hà nội')) return 'Hà Nội'
    if (city.includes('hồ chí minh') || addr.includes('hồ chí minh') || addr.includes('hcm')) return 'Hồ Chí Minh'
    if (city.includes('nghệ an') || addr.includes('nghệ an')) return 'Nghệ An'
    return 'Tỉnh thành khác'
  }

  const displayedBranches = branches.filter(b => getCityCategory(b) === selectedCity)

  const handleSend = async () => {
    if (!form.name || !form.email || !form.message) { 
      toast.error('Vui lòng điền đủ thông tin ở các trường bắt buộc (*)')
      return 
    }
    
    setSending(true)
    
    await new Promise(r => setTimeout(r, 1500)) 
    
    toast.success('Gửi thành công! Chúng tôi sẽ phản hồi trong vòng 24 giờ.')
    setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    setSending(false)
  }

  return (
    <>
      {/* Hero */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', padding: '60px 5% 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 3, marginBottom: 12 }}>LIÊN HỆ & HỖ TRỢ</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,44px)', marginBottom: 10 }}>
            Chúng Tôi <span style={{ color: 'var(--gold)' }}>Lắng Nghe</span>
          </h1>
          <p style={{ color: 'var(--text-sec)', fontSize: 15, maxWidth: 500 }}>
            Có câu hỏi hoặc cần hỗ trợ? Đội ngũ của chúng tôi luôn sẵn sàng giúp đỡ bạn.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 5% 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 40, marginBottom: 60, alignItems: 'start' }}>

          {/* Left: Contact info */}
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 28 }}>Thông Tin Liên Hệ</h2>

            {/* Quick contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 36 }}>
              {[
                { icon: '📞', label: 'Hotline 24/7', value: '1900 1234', sub: 'Miễn phí, hỗ trợ ngay' },
                { icon: '✉️', label: 'Email', value: 'support@cinemax.vn', sub: 'Phản hồi trong 24h' },
                { icon: '💬', label: 'Live Chat', value: 'Trên ứng dụng', sub: 'Thứ 2 – CN, 8h – 22h' },
                { icon: '📍', label: 'Trụ sở chính', value: 'Hà Nội, Việt Nam', sub: '72 Tôn Thất Thuyết' },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: .5 }}>{item.label.toUpperCase()}</div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--gold)', marginBottom: 2 }}>{item.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.sub}</div>
                </div>
              ))}
            </div>

            {/* Branch list */}
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 16 }}>Danh sách rạp chiếu</h3>
            
            {/* Bộ lọc thành phố */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {CITIES.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  style={{
                    padding: '8px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    background: selectedCity === city ? 'var(--gold)' : 'var(--bg-card2)',
                    color: selectedCity === city ? '#000' : 'var(--text-sec)',
                    border: `1px solid ${selectedCity === city ? 'var(--gold)' : 'var(--border)'}`,
                    fontWeight: selectedCity === city ? 600 : 400,
                    transition: '.2s'
                  }}
                >
                  {city}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingBranches ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0' }}>Đang tải danh sách rạp...</div>
              ) : displayedBranches.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 14, padding: '20px 0' }}>
                  Chưa có chi nhánh nào tại <strong style={{ color: 'var(--text-pri)' }}>{selectedCity}</strong>.
                </div>
              ) : (
                displayedBranches.map(b => (
                  <div key={b.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start', transition: '.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-gold)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>🏛️</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: 'var(--text-pri)' }}>{b.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 4, lineHeight: 1.4 }}>📍 {b.address || 'Đang cập nhật địa chỉ'}</div>
                      {b.hotline && <div style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 2 }}>📞 Hotline: <span style={{ color: 'var(--gold)' }}>{b.hotline}</span></div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 24px', position: 'sticky', top: 90 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 24 }}>Gửi Tin Nhắn</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input label="Họ tên *" value={form.name} onChange={set('name')} placeholder="Nguyễn Văn A" />
              <Input label="Email *" type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" />
              <Input label="Số điện thoại" type="tel" value={form.phone} onChange={set('phone')} placeholder="0901234567" />
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Chủ đề</label>
                <select value={form.subject} onChange={set('subject')} style={{ width: '100%', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: 'var(--text-pri)', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}>
                  <option value="">-- Chọn chủ đề --</option>
                  {['Hỏi về đặt vé', 'Vấn đề thanh toán', 'Khiếu nại dịch vụ', 'Góp ý cải thiện', 'Hợp tác doanh nghiệp', 'Khác'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Nội dung *</label>
                <textarea value={form.message} onChange={set('message')} rows={5} placeholder="Mô tả vấn đề hoặc câu hỏi của bạn..."
                  style={{ width: '100%', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', color: 'var(--text-pri)', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', resize: 'vertical' }}
                  onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
              <Button variant="primary" fullWidth size="lg" onClick={handleSend} loading={sending}>
                📨 Gửi tin nhắn
              </Button>
            </div>
          </div>
        </div>

        <div id='faq'>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 24 }}>
            Câu Hỏi <span style={{ color: 'var(--gold)' }}>Thường Gặp</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: `1px solid ${openFaq === i ? 'var(--border-gold)' : 'var(--border)'}`, borderRadius: 8, overflow: 'hidden', transition: '.2s' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '18px 20px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, textAlign: 'left', fontFamily: "'DM Sans', sans-serif" }}>
                  <span style={{ fontSize: 15, color: openFaq === i ? 'var(--gold)' : 'var(--text-pri)', fontWeight: 500 }}>{faq.q}</span>
                  <span style={{ color: 'var(--gold)', fontSize: 18, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: '.2s', flexShrink: 0 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 18px', fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7, borderTop: '1px solid var(--border)', paddingTop: 14, animation: 'fadeIn .2s ease' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}