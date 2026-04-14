import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { authService } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'
import { isValidEmail } from '../../utils/validators'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { login } = useAuth()
  const from      = location.state?.from?.pathname || '/'

  const [form, setForm]     = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!isValidEmail(form.email)) e.email = 'Email không hợp lệ'
    if (form.password.length < 6)  e.password = 'Mật khẩu phải từ 6 ký tự'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await authService.login(form)
      login(res.data)
      toast.success('Đăng nhập thành công!')
      navigate(from, { replace: true })
    } catch (err) {
      console.log('Chi tiết lỗi API:', err.response?.data);
      const msg = err.response?.data?.message || err.response?.data?.title || 'Email hoặc mật khẩu không đúng';
      toast.error(msg);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', padding: '40px 5%' }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeInUp .4s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: 'var(--gold)', marginBottom: 8 }}>
            CINE<span style={{ color: 'var(--text-pri)' }}>MAX</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 6 }}>Đăng nhập</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: 14 }}>Chào mừng bạn trở lại</p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '32px 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Input label="Email" id="email" type="email" value={form.email} error={errors.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com" icon="✉️"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <Input label="Mật khẩu" id="password" type="password" value={form.password} error={errors.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••" icon="🔒"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <div style={{ textAlign: 'right', marginTop: -10 }}>
              <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--gold)', textDecoration: 'none' }}>
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <Button variant="primary" fullWidth size="lg" onClick={handleSubmit} loading={loading} className="mt-6">
            Đăng nhập
          </Button>

          <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 13 }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}>
              Đăng ký ngay
            </Link>
          </div>
        </div>

        {/* Demo hint */}
        <div style={{ marginTop: 16, background: 'rgba(201,168,76,.06)', border: '1px solid var(--border-gold)', borderRadius: 8, padding: 14, fontSize: 13, color: 'var(--text-sec)', textAlign: 'center' }}>
          <div style={{ color: 'var(--gold)', marginBottom: 4, fontWeight: 500 }}>Demo Admin</div>
          <div>Email: <span style={{ color: 'var(--text-pri)' }}>admin@cinema.com</span></div>
          <div>Pass: <span style={{ color: 'var(--text-pri)' }}>Admin@123</span></div>
        </div>
      </div>
    </div>
  )
}
