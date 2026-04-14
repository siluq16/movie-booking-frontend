import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { authService } from '../../services/authService'
import { isValidEmail, isValidPhone, isStrongPassword } from '../../utils/validators'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.fullName.trim())                 e.fullName = 'Vui lòng nhập họ tên'
    if (!isValidEmail(form.email))             e.email = 'Email không hợp lệ'
    if (!isValidPhone(form.phone))             e.phone = 'Số điện thoại không hợp lệ (VD: 0901234567)'
    if (!isStrongPassword(form.password))      e.password = 'Mật khẩu phải từ 6 ký tự'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Mật khẩu không khớp'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await authService.register({ fullName: form.fullName, email: form.email, phone: form.phone, password: form.password })
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', padding: '40px 5%' }}>
      <div style={{ width: '100%', maxWidth: 440, animation: 'fadeInUp .4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--gold)', marginBottom: 8 }}>
            CINE<span style={{ color: 'var(--text-pri)' }}>MAX</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 6 }}>Tạo Tài Khoản</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: 14 }}>Đăng ký để trải nghiệm điện ảnh đỉnh cao</p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '32px 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Họ và tên" value={form.fullName} onChange={set('fullName')} error={errors.fullName}
              placeholder="Nguyễn Văn A" icon="👤" />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email}
              placeholder="your@email.com" icon="✉️" />
            <Input label="Số điện thoại" type="tel" value={form.phone} onChange={set('phone')} error={errors.phone}
              placeholder="0901234567" icon="📱" />
            <Input label="Mật khẩu" type="password" value={form.password} onChange={set('password')} error={errors.password}
              placeholder="Tối thiểu 6 ký tự" icon="🔒" />
            <Input label="Xác nhận mật khẩu" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword}
              placeholder="Nhập lại mật khẩu" icon="🔒" />
          </div>

          <Button variant="primary" fullWidth size="lg" onClick={handleSubmit} loading={loading} className="mt-6">
            Đăng ký
          </Button>

          <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 13 }}>
            Đã có tài khoản?{' '}
            <Link to="/login" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
