import { useState, useEffect } from 'react'
import { promotionService } from '../../services/movieService'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import { validate } from '../../utils/validation'

import { formatCurrency, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

const EMPTY = { code: '', title: '', description: '', discountType: 'percentage', discountValue: '', maxDiscountAmount: '', minOrderValue: '0', maxUses: '', maxUsesPerUser: '1', validFrom: '', validTo: '', appliesToFood: false }
const ssBase = { width: '100%', background: 'var(--bg-card2)', borderRadius: 6, padding: '10px 12px', color: 'var(--text-pri)', fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none', transition: 'border-color .2s' }

const ss = (err) => ({ ...ssBase, border: `1px solid ${err ? 'var(--red)' : 'var(--border)'}` })
const errStyle = { fontSize: 12, color: 'var(--red)', marginTop: 4, display: 'block' }

function valPromo(f) {
  const isPct = f.discountType === 'percentage';
  const dFrom = f.validFrom ? new Date(f.validFrom) : null;
  const dTo = f.validTo ? new Date(f.validTo) : null;

  return validate({
    code: !f.code ? 'Vui lòng nhập Mã KM' : f.code.length < 2 ? 'Tối thiểu 2 ký tự' : /\s/.test(f.code) ? 'Không chứa khoảng trắng' : null,
    title: !f.title ? 'Vui lòng nhập tiêu đề' : f.title.length < 3 ? 'Tiêu đề tối thiểu 3 ký tự' : null,
    discountValue: !f.discountValue ? 'Vui lòng nhập mức giảm' : 
                   isPct && (parseFloat(f.discountValue) <= 0 || parseFloat(f.discountValue) > 100) ? 'Phần trăm phải từ 1 - 100' : 
                   !isPct && parseFloat(f.discountValue) <= 0 ? 'Số tiền giảm phải > 0' : null,
    maxDiscountAmount: f.maxDiscountAmount && parseFloat(f.maxDiscountAmount) <= 0 ? 'Phải lớn hơn 0' : null,
    minOrderValue: f.minOrderValue && parseFloat(f.minOrderValue) < 0 ? 'Không được âm' : null,
    maxUsesPerUser: !f.maxUsesPerUser || parseInt(f.maxUsesPerUser) < 1 ? 'Tối thiểu 1 lượt' : null,
    validFrom: !f.validFrom ? 'Chọn ngày bắt đầu' : null,
    validTo: !f.validTo ? 'Chọn ngày kết thúc' : (dFrom && dTo && dTo <= dFrom) ? 'Ngày kết thúc phải sau ngày bắt đầu' : null,
  })
}

const toLocalInputFormat = (isoStr) => {
  if (!isoStr) return '';
  return isoStr.replace(' ', 'T').slice(0, 16);
};

function countdown(validTo) {
  const diff = new Date(validTo.replace(' ', 'T')) - new Date();
  if (diff <= 0) return 'Đã hết hạn'
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000)
  return d > 0 ? `Còn ${d} ngày` : `Còn ${h} giờ`
}

export default function ManagePromotions() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  const load = () => { setLoading(true); promotionService.getAll().then(r => setPromos(Array.isArray(r.data) ? r.data : [])).catch(() => setPromos([])).finally(() => setLoading(false)) }
  useEffect(load, [])

  // Xử lý khi nhập liệu (Tự động xóa lỗi cũ)
  const setF = (f) => (e) => {
    const v = f === 'code' ? e.target.value.toUpperCase().replace(/\s/g, '') : e.target.value;
    setForm(p => ({ ...p, [f]: v }));
    setErrors(p => ({ ...p, [f]: undefined }));
  }

  // Xử lý báo lỗi khi click ra ngoài (Real-time Validation)
  const handleBlur = (field) => () => {
    const { errors: currentErrors } = valPromo(form);
    if (currentErrors[field]) {
      setErrors(prev => ({ ...prev, [field]: currentErrors[field] }));
    }
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setModal(true) }

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      ...EMPTY,
      ...p,
      validFrom: toLocalInputFormat(p.validFrom),
      validTo: toLocalInputFormat(p.validTo),
      discountValue: String(p.discountValue),
      maxDiscountAmount: p.maxDiscountAmount ? String(p.maxDiscountAmount) : '',
      minOrderValue: String(p.minOrderValue || 0),
      maxUses: p.maxUses ? String(p.maxUses) : '',
      maxUsesPerUser: String(p.maxUsesPerUser || 1)
    });
    setErrors({}); setModal(true)
  }

  const handleSave = async () => {
    const { errors: errs, isValid } = valPromo(form)
    
    // Nếu có lỗi thì hiển thị tất cả
    if (!isValid) { 
      setErrors(errs); 
      toast.error('Vui lòng kiểm tra lại thông tin bị đỏ'); 
      return; 
    }
    
    setSaving(true)
    const payload = {
      ...form, 
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      discountValue: parseFloat(form.discountValue),
      maxDiscountAmount: form.maxDiscountAmount ? parseFloat(form.maxDiscountAmount) : null,
      minOrderValue: parseFloat(form.minOrderValue) || 0,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      maxUsesPerUser: parseInt(form.maxUsesPerUser) || 1,
      appliesToFood: !!form.appliesToFood,
      validFrom: form.validFrom,
      validTo: form.validTo
    }
    try {
      if (editing) { await promotionService.update(editing.id, payload); toast.success('Cập nhật thành công!') }
      else { await promotionService.create(payload); toast.success('Tạo mã thành công!') }
      setModal(false); load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã đã tồn tại')
    } finally { setSaving(false) }
  }

  const handleToggle = async (p) => { try { await promotionService.disable(p.id); toast.success(p.isActive ? 'Đã tắt' : 'Cập nhật thành công'); load() } catch { toast.error('Không thể thay đổi') } }
  const filtered = promos.filter(p => filter === 'all' ? true : filter === 'active' ? p.isActive : !p.isActive)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26 }}>Quản lý <span style={{ color: 'var(--gold)' }}>Khuyến Mãi</span></h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {[['all', 'Tất cả'], ['active', 'Đang bật'], ['inactive', 'Đã tắt']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{ padding: '8px 14px', background: filter === v ? 'var(--gold)' : 'var(--bg-card)', border: 'none', color: filter === v ? '#000' : 'var(--text-sec)', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: filter === v ? 500 : 400 }}>{l}</button>
            ))}
          </div>
          <Button variant="primary" size="md" onClick={openCreate}>+ Tạo mã mới</Button>
        </div>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size="lg" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(380px,1fr))', gap: 16 }}>
          {filtered.map(p => {
            const used = p.usedCount || 0;
            const pct = p.maxUses ? Math.min(100, Math.round((p.usedCount / p.maxUses) * 100)) : null
            const expiring = new Date(p.validTo.replace(' ', 'T')) - Date.now() < 7 * 86400000 && p.isActive;
            return (
              <div key={p.id} style={{ background: 'var(--bg-card)', border: `1px solid ${p.isActive ? 'var(--border)' : 'rgba(90,88,80,.3)'}`, borderRadius: 10, overflow: 'hidden', opacity: p.isActive ? 1 : .6, transition: '.2s' }}
                onMouseEnter={e => { if (p.isActive) e.currentTarget.style.borderColor = 'var(--border-gold)' }} onMouseLeave={e => e.currentTarget.style.borderColor = p.isActive ? 'var(--border)' : 'rgba(90,88,80,.3)'}>
                <div style={{ height: 3, background: p.isActive ? 'linear-gradient(to right,var(--gold-dark),var(--gold),var(--gold-light))' : 'var(--border)' }} />
                <div style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      {expiring && <div style={{ fontSize: 10, background: 'rgba(224,82,82,.15)', color: 'var(--red)', border: '1px solid rgba(224,82,82,.3)', padding: '1px 7px', borderRadius: 2, display: 'inline-block', marginBottom: 6 }}>🔥 SẮP HẾT HẠN</div>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: 'var(--gold)', letterSpacing: 2 }}>{p.code}</span>
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, ...(p.isActive ? { background: 'rgba(82,201,124,.15)', color: 'var(--green)' } : { background: 'rgba(90,88,80,.2)', color: 'var(--text-muted)' }) }}>{p.isActive ? 'BẬT' : 'TẮT'}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{p.title}</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(201,168,76,.08)', border: '1px solid var(--border-gold)', borderRadius: 6, padding: '8px 12px', flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: 'var(--gold)' }}>{p.discountType === 'percentage' ? `${p.discountValue}%` : formatCurrency(p.discountValue)}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>GIẢM</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                    {p.minOrderValue > 0 && <span>Min: {formatCurrency(p.minOrderValue)}</span>}
                    {p.maxDiscountAmount && <span>Tối đa: {formatCurrency(p.maxDiscountAmount)}</span>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: 'var(--text-pri)', fontWeight: 500 }}>
                        👥 {(p.usedCount || 0).toLocaleString('vi-VN')}
                      </span>
                      <span> / {p.maxUses ? p.maxUses.toLocaleString('vi-VN') : '∞'} lượt dùng</span>
                    </div>

                    <span style={{ color: expiring ? 'var(--red)' : 'inherit' }}>
                      ⏳ {countdown(p.validTo)}
                    </span>
                  </div>
                  {pct !== null && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Mức độ sử dụng</span>
                        <span style={{ fontWeight: 600, color: pct > 90 ? 'var(--red)' : 'var(--gold)' }}>{pct}%</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--bg-card2)', borderRadius: 2, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            background: pct > 80 ? 'var(--red)' : 'var(--gold)',
                            borderRadius: 2,
                            transition: 'width 0.5s ease-in-out'
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>{formatDate(p.validFrom)} → {formatDate(p.validTo)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="subtle" size="sm" onClick={() => openEdit(p)}>✏️ Sửa</Button>
                    {p.isActive && (
                      <Button variant="danger" size="sm" onClick={() => handleToggle(p)}>
                        🚫 Tắt
                      </Button>
                    )}
                  </div>
                  {p.maxUses && p.usedCount >= p.maxUses && (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 2, background: 'rgba(224,82,82,.2)', color: 'var(--red)', marginLeft: 4 }}>
                      HẾT LƯỢT
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10 }}>Chưa có mã khuyến mãi nào</div>}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Sửa mã' : 'Tạo mã khuyến mãi'} maxWidth={560}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <Input label="Mã KM *" value={form.code} onChange={setF('code')} onBlur={handleBlur('code')} error={errors.code} placeholder="VD: SUMMER25" />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>Chữ in HOA, không khoảng trắng</span>
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Loại giảm giá *</label>
              <select value={form.discountType} onChange={setF('discountType')} style={ssBase}>
                <option value="percentage">Phần trăm (%)</option>
                <option value="fixed_amount">Số tiền cố định (đ)</option>
              </select>
            </div>
          </div>
          
          <Input label="Tiêu đề *" value={form.title} onChange={setF('title')} onBlur={handleBlur('title')} error={errors.title} placeholder="VD: Giảm 20% thành viên mới" />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label={form.discountType === 'percentage' ? 'Phần trăm giảm * (1-100%)' : 'Số tiền giảm (đ) *'} type="number" value={form.discountValue} onChange={setF('discountValue')} onBlur={handleBlur('discountValue')} error={errors.discountValue} />
            {form.discountType === 'percentage' && <Input label="Giảm tối đa (đ)" type="number" value={form.maxDiscountAmount} onChange={setF('maxDiscountAmount')} onBlur={handleBlur('maxDiscountAmount')} error={errors.maxDiscountAmount} placeholder="Không giới hạn" />}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Đơn tối thiểu (đ)" type="number" value={form.minOrderValue} onChange={setF('minOrderValue')} onBlur={handleBlur('minOrderValue')} error={errors.minOrderValue} placeholder="0" />
            <Input label="Tổng lượt dùng" type="number" value={form.maxUses} onChange={setF('maxUses')} onBlur={handleBlur('maxUses')} error={errors.maxUses} placeholder="Không giới hạn" />
          </div>
          
          <Input label="Lượt dùng / người *" type="number" value={form.maxUsesPerUser} onChange={setF('maxUsesPerUser')} onBlur={handleBlur('maxUsesPerUser')} error={errors.maxUsesPerUser} placeholder="1" />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Từ ngày *" type="datetime-local" value={form.validFrom} onChange={setF('validFrom')} onBlur={handleBlur('validFrom')} error={errors.validFrom} />
            <Input label="Đến ngày *" type="datetime-local" value={form.validTo} onChange={setF('validTo')} onBlur={handleBlur('validTo')} error={errors.validTo} />
          </div>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: 'var(--text-sec)' }}>
            <input type="checkbox" checked={!!form.appliesToFood} onChange={e => setForm(f => ({ ...f, appliesToFood: e.target.checked }))} />
            Áp dụng cho đồ ăn & thức uống
          </label>

          {Object.keys(errors).some(k => errors[k]) && (
            <div style={{ background: 'rgba(224,82,82,.08)', border: '1px solid rgba(224,82,82,.3)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: 'var(--red)' }}>
              ⚠ Vui lòng sửa các lỗi hiển thị màu đỏ phía trên
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <Button variant="ghost" size="md" onClick={() => setModal(false)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={handleSave} loading={saving}>{editing ? 'Lưu cập nhật' : 'Tạo mã'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}