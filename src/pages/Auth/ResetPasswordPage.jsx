import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') // Hứng token từ URL

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div style={{ textAlign: 'center', marginTop: 100, color: 'var(--text-muted)' }}>
        <h2>Đường dẫn không hợp lệ</h2>
        <Link to="/forgot-password" style={{ color: 'var(--gold)' }}>Yêu cầu gửi lại link mới</Link>
      </div>
    )
  }

  const validate = () => {
    const e = {}
    if (form.password.length < 6) e.password = 'Mật khẩu phải từ 6 ký tự'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Mật khẩu nhập lại không khớp'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      // Gọi API với token lấy từ URL và mật khẩu mới
      await authService.resetPassword({ token, newPassword: form.password })
      toast.success('Mật khẩu đã được đổi thành công!')
      navigate('/login') // Chuyển về trang đăng nhập
    } catch (err) {
      toast.error(err.response?.data?.message || 'Link đã hết hạn hoặc không hợp lệ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', padding: '40px 5%' }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeInUp .4s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 6 }}>Tạo mật khẩu mới</h2>
          <p style={{ color: 'var(--text-sec)', fontSize: 14 }}>Vui lòng nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '32px 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Input label="Mật khẩu mới" type="password" value={form.password} error={errors.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••" icon="🔒"
            />
            <Input label="Nhập lại mật khẩu" type="password" value={form.confirmPassword} error={errors.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="••••••••" icon="🔒"
            />
          </div>

          <Button variant="primary" fullWidth size="lg" onClick={handleSubmit} loading={loading} className="mt-6">
            Đổi mật khẩu
          </Button>
        </div>
      </div>
    </div>
  )
}