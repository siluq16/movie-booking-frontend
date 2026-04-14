import { useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { authService } from '../../services/authService'
import { isValidEmail } from '../../utils/validators'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setError('Email không hợp lệ')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authService.forgotPassword({ email })
      setIsSent(true)
      toast.success('Đã gửi email khôi phục!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gửi email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', padding: '40px 5%' }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeInUp .4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--gold)', marginBottom: 8 }}>
            CINE<span style={{ color: 'var(--text-pri)' }}>MAX</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 6 }}>Quên mật khẩu</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: 14 }}>Nhập email để nhận link đặt lại mật khẩu</p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '32px 28px' }}>
          {isSent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
              <h3 style={{ marginBottom: 12, color: 'var(--gold)' }}>Kiểm tra hòm thư của bạn</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Chúng tôi đã gửi một đường dẫn khôi phục mật khẩu đến email <strong>{email}</strong>. Vui lòng kiểm tra (cả hộp thư rác).
              </p>
              <Link to="/login" style={{ color: 'var(--text-pri)', textDecoration: 'none', display: 'inline-block', border: '1px solid var(--border)', padding: '10px 24px', borderRadius: 6, fontSize: 14 }}>
                Quay lại Đăng nhập
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <Input 
                label="Email của bạn" 
                type="email" 
                value={email} 
                error={error}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="your@email.com" 
                icon="✉️"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              
              <Button variant="primary" fullWidth size="lg" onClick={handleSubmit} loading={loading} className="mt-4">
                Gửi link khôi phục
              </Button>

              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
                <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                  ← Quay lại đăng nhập
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}