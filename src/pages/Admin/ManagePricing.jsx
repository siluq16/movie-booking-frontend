import { useState, useEffect } from 'react'
import { pricingService } from '../../services/movieService'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

// ── Constants ─────────────────────────────────────────────────────────────────
const SEAT_TYPES = ['standard', 'vip', 'couple', 'recliner', 'sweetbox']
const FORMATS = ['2D', '3D', 'IMAX', '4DX', 'Dolby', 'ScreenX']
const DOW_OPTS   = [['1','T2'],['2','T3'],['3','T4'],['4','T5'],['5','T6'],['6','T7'],['0','CN']]

const SEAT_LABEL  = { standard:'Thường', vip:'VIP', couple:'Couple', recliner:'Recliner', sweetbox:'Sweetbox' }
const SEAT_COLOR  = { standard:'var(--text-sec)', vip:'var(--gold)', couple:'#a07ad0', recliner:'#52c97c', sweetbox:'#e06090' }

const EMPTY_RULE = {
  ruleName:'', seatType:'', screenFormat:'', basePrice:'',
  priority:1, isHoliday:false, dayOfWeekFilter:[],
  startTimeFilter:'', endTimeFilter:'',
}
const EMPTY_HOL = { holidayDate:'', description:'' }

const ss = {
  width:'100%', background:'var(--bg-card2)', border:'1px solid var(--border)',
  borderRadius:6, padding:'10px 12px', color:'var(--text-pri)',
  fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none',
}

const errStyle = { fontSize:11, color:'var(--red)', marginTop:3, display:'block' }

// ── Validate pricing rule ─────────────────────────────────────────────────────
function validateRule(form) {
  const errors = {}
  if (!form.ruleName?.trim())               errors.ruleName  = 'Tên luật không được để trống'
  if (!form.basePrice || isNaN(parseFloat(form.basePrice)) || parseFloat(form.basePrice) < 0)
                                            errors.basePrice = 'Giá tiền phải là số >= 0'
  if (!form.priority || isNaN(parseInt(form.priority)) || parseInt(form.priority) < 1)
                                            errors.priority  = 'Độ ưu tiên phải >= 1'
  if (form.startTimeFilter && form.endTimeFilter && form.startTimeFilter >= form.endTimeFilter)
                                            errors.endTimeFilter = 'Giờ kết thúc phải sau giờ bắt đầu'
  if (!form.seatType && !form.screenFormat && !form.isHoliday && !form.dayOfWeekFilter?.length && !form.startTimeFilter)
                                            errors.ruleName = (errors.ruleName || '') + ' (Nên có ít nhất 1 điều kiện lọc)'
  return errors
}

// ── Validate holiday ──────────────────────────────────────────────────────────
function validateHoliday(form, existingHolidays, editingId) {
  const errors = {}
  if (!form.holidayDate)              errors.holidayDate  = 'Vui lòng chọn ngày'
  if (!form.description?.trim())      errors.description  = 'Mô tả không được để trống'
  if (form.holidayDate) {
    const dup = existingHolidays.find(h => h.holidayDate?.slice(0,10) === form.holidayDate && h.id !== editingId)
    if (dup) errors.holidayDate = `Ngày này đã tồn tại: "${dup.description}"`
  }
  return errors
}

// ── Rule card ─────────────────────────────────────────────────────────────────
function RuleCard({ rule, onEdit, onToggle }) {
  const sc = rule.seatType ? SEAT_COLOR[rule.seatType] : 'var(--text-sec)'
  return (
    <div style={{ background:'var(--bg-card)', border:`1px solid ${rule.isActive?'var(--border)':'rgba(90,88,80,.3)'}`, borderRadius:10, padding:20, opacity:rule.isActive?1:.55, transition:'.2s' }}
      onMouseEnter={e => { if (rule.isActive) e.currentTarget.style.borderColor='var(--border-gold)' }}
      onMouseLeave={e => e.currentTarget.style.borderColor=rule.isActive?'var(--border)':'rgba(90,88,80,.3)'}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:500, marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{rule.ruleName}</div>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {rule.seatType && (
              <span style={{ fontSize:10, background:`${sc}20`, color:sc, border:`1px solid ${sc}44`, padding:'1px 8px', borderRadius:2, fontWeight:600 }}>{SEAT_LABEL[rule.seatType]||rule.seatType}</span>
            )}
            {rule.screenFormat && (
              <span style={{ fontSize:10, background:'rgba(74,159,208,.12)', color:'#4a9fd0', border:'1px solid rgba(74,159,208,.3)', padding:'1px 8px', borderRadius:2, fontWeight:600 }}>{rule.screenFormat}</span>
            )}
            {rule.isHoliday && (
              <span style={{ fontSize:10, background:'rgba(224,82,82,.12)', color:'var(--red)', border:'1px solid rgba(224,82,82,.3)', padding:'1px 8px', borderRadius:2 }}>Ngày lễ</span>
            )}
            {rule.dayOfWeekFilter && (
              <span style={{ fontSize:10, background:'rgba(130,100,200,.12)', color:'#a07ad0', border:'1px solid rgba(130,100,200,.3)', padding:'1px 8px', borderRadius:2 }}>
                {rule.dayOfWeekFilter.split(',').map(d => DOW_OPTS.find(o=>o[0]===d)?.[1]).filter(Boolean).join(', ')}
              </span>
            )}
            {(rule.startTimeFilter || rule.endTimeFilter) && (
              <span style={{ fontSize:10, background:'rgba(82,201,124,.1)', color:'var(--green)', border:'1px solid rgba(82,201,124,.3)', padding:'1px 8px', borderRadius:2 }}>
                {rule.startTimeFilter||'--:--'} → {rule.endTimeFilter||'--:--'}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0, marginLeft:12 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:'var(--gold)' }}>{formatCurrency(rule.basePrice)}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>Ưu tiên: {rule.priority}</div>
        </div>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <Button variant="subtle" size="sm" onClick={() => onEdit(rule)}>✏️ Sửa</Button>
        <Button variant={rule.isActive?'danger':'outline'} size="sm" onClick={() => onToggle(rule.id)}>
          {rule.isActive ? '🚫 Tắt' : '✅ Bật'}
        </Button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ManagePricing() {
  const [rules, setRules]       = useState([])
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('rules')
  const [modal, setModal]       = useState(null)  // 'rule' | 'holiday'
  const [editing, setEditing]   = useState(null)
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE)
  const [holForm, setHolForm]   = useState(EMPTY_HOL)
  const [ruleErrors, setRuleErrors] = useState({})
  const [holErrors,  setHolErrors]  = useState({})
  const [saving, setSaving]     = useState(false)
  const [search, setSearch]     = useState('')

  const load = () => {
    setLoading(true)
    Promise.allSettled([pricingService.getRules(), pricingService.getHolidays()])
      .then(([r, h]) => {
        setRules(r.status==='fulfilled' ? (r.value.data||[]) : [])
        setHolidays(h.status==='fulfilled' ? (h.value.data||[]) : [])
      }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  // ── Input helpers ─────────────────────────────────────────────────────────
  const setr = (f) => (e) => { setRuleForm(p => ({ ...p, [f]: e.target.value })); setRuleErrors(p => ({ ...p, [f]: undefined })) }
  const seth = (f) => (e) => { setHolForm(p => ({ ...p, [f]: e.target.value })); setHolErrors(p => ({ ...p, [f]: undefined })) }
  const toggleDow = (val) => setRuleForm(f => {
    const cur = Array.isArray(f.dayOfWeekFilter) ? f.dayOfWeekFilter : []
    return { ...f, dayOfWeekFilter: cur.includes(val) ? cur.filter(v => v!==val) : [...cur, val] }
  })

  // ── Open modals ───────────────────────────────────────────────────────────
  const openRule = (r = null) => {
    setEditing(r)
    setRuleErrors({})
    setRuleForm(r ? {
      ruleName: r.ruleName||'', seatType: r.seatType||'', screenFormat: r.screenFormat||'',
      basePrice: String(r.basePrice), priority: r.priority||1,
      isHoliday: !!r.isHoliday,
      dayOfWeekFilter: r.dayOfWeekFilter ? r.dayOfWeekFilter.split(',') : [],
      startTimeFilter: r.startTimeFilter?.slice(0,5)||'',
      endTimeFilter:   r.endTimeFilter?.slice(0,5)||'',
    } : EMPTY_RULE)
    setModal('rule')
  }

  const openHol = (h = null) => {
    setEditing(h)
    setHolErrors({})
    setHolForm(h ? { holidayDate: h.holidayDate?.slice(0,10)||'', description: h.description||'' } : EMPTY_HOL)
    setModal('holiday')
  }

  // ── Save rule ─────────────────────────────────────────────────────────────
  const handleSaveRule = async () => {
    const errs = validateRule(ruleForm)
    if (Object.keys(errs).length) { setRuleErrors(errs); return }
    setSaving(true)
    try {
      const payload = {
        ruleName:        ruleForm.ruleName.trim(),
        seatType:        ruleForm.seatType     || null,
        screenFormat:    ruleForm.screenFormat || null,
        basePrice:       parseFloat(ruleForm.basePrice),
        priority:        parseInt(ruleForm.priority),
        isHoliday:       !!ruleForm.isHoliday,
        dayOfWeekFilter: ruleForm.dayOfWeekFilter?.length ? ruleForm.dayOfWeekFilter.join(',') : null,
        startTimeFilter: ruleForm.startTimeFilter || null,
        endTimeFilter:   ruleForm.endTimeFilter   || null,
      }
      if (editing) { await pricingService.updateRule(editing.id, payload); toast.success('Cập nhật luật giá thành công!') }
      else         { await pricingService.createRule(payload);             toast.success('Tạo luật giá thành công!') }
      setModal(null); load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu luật giá')
    } finally { setSaving(false) }
  }

  // ── Save holiday ──────────────────────────────────────────────────────────
  const handleSaveHol = async () => {
    const errs = validateHoliday(holForm, holidays, editing?.id)
    if (Object.keys(errs).length) { setHolErrors(errs); return }
    setSaving(true)
    try {
      const payload = { holidayDate: holForm.holidayDate, description: holForm.description.trim() }
      if (editing) { await pricingService.updateHoliday(editing.id, payload); toast.success('Cập nhật ngày lễ thành công!') }
      else         { await pricingService.createHoliday(payload);             toast.success('Thêm ngày lễ thành công!') }
      setModal(null); load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể lưu ngày lễ')
    } finally { setSaving(false) }
  }

  const toggleRule = async (id) => {
    try { await pricingService.toggleRule(id); load() }
    catch { toast.error('Không thể thay đổi trạng thái') }
  }

  const deleteHol = async (id) => {
    if (!confirm('Xóa ngày lễ này? Các luật giá theo ngày lễ sẽ không còn hiệu lực.')) return
    try { await pricingService.deleteHoliday(id); toast.success('Đã xóa ngày lễ'); load() }
    catch { toast.error('Không thể xóa ngày lễ này') }
  }

  const filteredRules = rules.filter(r => !search || r.ruleName?.toLowerCase().includes(search.toLowerCase()))
  const sortedHolidays = [...holidays].sort((a, b) => a.holidayDate?.localeCompare(b.holidayDate))

  // ── Holiday conflict check for display ───────────────────────────────────
  const upcomingHolidays = sortedHolidays.filter(h => new Date(h.holidayDate) >= new Date())
  const pastHolidays     = sortedHolidays.filter(h => new Date(h.holidayDate) < new Date())
  const holidayRules     = rules.filter(r => r.isActive && r.isHoliday)

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26 }}>
          Quản lý <span style={{ color:'var(--gold)' }}>Giá Vé</span>
        </h1>
        <Button variant="primary" size="md" onClick={() => tab==='rules' ? openRule() : openHol()}>
          + {tab==='rules' ? 'Thêm luật giá' : 'Thêm ngày lễ'}
        </Button>
      </div>

      {/* Holiday–rules integration notice */}
      {tab==='rules' && holidays.length > 0 && holidayRules.length > 0 && (
        <div style={{ background:'rgba(201,168,76,.06)', border:'1px solid var(--border-gold)', borderRadius:8, padding:'12px 16px', marginBottom:20, fontSize:13, color:'var(--text-sec)', display:'flex', gap:10 }}>
          <span style={{ fontSize:16 }}>ℹ️</span>
          <span>Hệ thống có <strong style={{ color:'var(--gold)' }}>{holidayRules.length}</strong> luật giá ngày lễ đang hoạt động và <strong style={{ color:'var(--gold)' }}>{upcomingHolidays.length}</strong> ngày lễ sắp tới trong tab Ngày Lễ.</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['rules',`💰 Luật Giá (${rules.length})`],['holidays',`📅 Ngày Lễ (${holidays.length})`]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ background:'none', border:'none', color:tab===v?'var(--gold)':'var(--text-sec)', fontSize:14, padding:'10px 24px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", borderBottom:`2px solid ${tab===v?'var(--gold)':'transparent'}`, marginBottom:-1 }}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size="lg" /></div> : (

        /* ── RULES TAB ── */
        tab==='rules' ? (
          <div>
            <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm luật giá..."
                style={{ background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 14px', color:'var(--text-pri)', fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", width:220 }}
                onFocus={e => e.target.style.borderColor='var(--gold)'}
                onBlur={e => e.target.style.borderColor='var(--border)'}
              />
              <div style={{ fontSize:13, color:'var(--text-sec)' }}>
                <span style={{ color:'var(--green)' }}>{rules.filter(r=>r.isActive).length} đang bật</span>
                {' · '}
                <span style={{ color:'var(--text-muted)' }}>{rules.filter(r=>!r.isActive).length} đang tắt</span>
              </div>
            </div>

            {/* Priority explanation */}
            <div style={{ background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', marginBottom:20, fontSize:12, color:'var(--text-muted)' }}>
              💡 <strong style={{ color:'var(--text-sec)' }}>Cách hoạt động:</strong> Luật có <strong style={{ color:'var(--gold)' }}>độ ưu tiên cao hơn</strong> sẽ được áp dụng trước. Ví dụ: Luật "cuối tuần VIP" (ưu tiên 5) sẽ đè lên "giá VIP cơ bản" (ưu tiên 1).
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14 }}>
              {filteredRules.map(r => (
                <RuleCard key={r.id} rule={r} onEdit={openRule} onToggle={toggleRule} />
              ))}
              {filteredRules.length===0 && (
                <div style={{ gridColumn:'1/-1', textAlign:'center', padding:60, color:'var(--text-muted)', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10 }}>
                  {search ? 'Không tìm thấy luật giá phù hợp' : 'Chưa có luật giá nào — nhấn "+ Thêm" để bắt đầu'}
                </div>
              )}
            </div>
          </div>
        ) : (

          /* ── HOLIDAYS TAB ── */
          <div>
            {/* Upcoming vs past */}
            {upcomingHolidays.length > 0 && (
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:12, color:'var(--gold)', letterSpacing:.5, marginBottom:14 }}>SẮP TỚI ({upcomingHolidays.length})</div>
                <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'var(--bg-card2)' }}>
                      {['Ngày lễ','Tên / Mô tả','Còn lại','Luật giá áp dụng',''].map(h => <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, color:'var(--text-muted)', letterSpacing:.5, fontWeight:500 }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {upcomingHolidays.map(h => {
                        const daysLeft = Math.ceil((new Date(h.holidayDate) - new Date()) / 86400000)
                        const appliedRules = rules.filter(r => r.isActive && r.isHoliday)
                        return (
                          <tr key={h.id} style={{ borderTop:'1px solid var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background='var(--bg-card2)'}
                            onMouseLeave={e => e.currentTarget.style.background=''}
                          >
                            <td style={{ padding:'11px 16px' }}>
                              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:'var(--gold)' }}>
                                {new Date(h.holidayDate).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' })}
                              </div>
                              <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                                {new Date(h.holidayDate).toLocaleDateString('vi-VN', { weekday:'long' })}
                              </div>
                            </td>
                            <td style={{ padding:'11px 16px', fontSize:14, fontWeight:500 }}>{h.description}</td>
                            <td style={{ padding:'11px 16px' }}>
                              <span style={{ fontSize:12, color:daysLeft<=7?'var(--red)':daysLeft<=30?'#e07a42':'var(--green)', fontWeight:500 }}>
                                {daysLeft===0?'Hôm nay!':daysLeft===1?'Ngày mai':daysLeft + ' ngày'}
                              </span>
                            </td>
                            <td style={{ padding:'11px 16px' }}>
                              {appliedRules.length > 0 ? (
                                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                                  {appliedRules.slice(0,2).map(r => (
                                    <span key={r.id} style={{ fontSize:10, background:'rgba(201,168,76,.1)', color:'var(--gold)', border:'1px solid var(--border-gold)', padding:'1px 6px', borderRadius:2 }}>
                                      {r.ruleName.length > 20 ? r.ruleName.slice(0,20)+'…' : r.ruleName}
                                    </span>
                                  ))}
                                  {appliedRules.length > 2 && <span style={{ fontSize:10, color:'var(--text-muted)' }}>+{appliedRules.length-2}</span>}
                                </div>
                              ) : (
                                <span style={{ fontSize:12, color:'var(--red)' }}>⚠ Chưa có luật giá!</span>
                              )}
                            </td>
                            <td style={{ padding:'11px 16px' }}>
                              <div style={{ display:'flex', gap:6 }}>
                                <button onClick={() => openHol(h)} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-sec)', borderRadius:4, padding:'3px 10px', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>✏️</button>
                                <button onClick={() => deleteHol(h.id)} style={{ background:'none', border:'1px solid rgba(224,82,82,.3)', color:'var(--red)', borderRadius:4, padding:'3px 10px', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>🗑️</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {pastHolidays.length > 0 && (
              <div>
                <div style={{ fontSize:12, color:'var(--text-muted)', letterSpacing:.5, marginBottom:14 }}>ĐÃ QUA ({pastHolidays.length})</div>
                <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', opacity:.7 }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr style={{ background:'var(--bg-card2)' }}>
                      {['Ngày lễ','Tên / Mô tả',''].map(h => <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, color:'var(--text-muted)', fontWeight:500 }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {pastHolidays.map(h => (
                        <tr key={h.id} style={{ borderTop:'1px solid var(--border)' }}
                          onMouseEnter={e => e.currentTarget.style.background='var(--bg-card2)'}
                          onMouseLeave={e => e.currentTarget.style.background=''}
                        >
                          <td style={{ padding:'10px 16px', fontSize:13, color:'var(--text-muted)' }}>
                            {new Date(h.holidayDate).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' })}
                          </td>
                          <td style={{ padding:'10px 16px', fontSize:13, color:'var(--text-sec)' }}>{h.description}</td>
                          <td style={{ padding:'10px 16px' }}>
                            <div style={{ display:'flex', gap:6 }}>
                              <button onClick={() => openHol(h)} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-sec)', borderRadius:4, padding:'3px 10px', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>✏️</button>
                              <button onClick={() => deleteHol(h.id)} style={{ background:'none', border:'1px solid rgba(224,82,82,.3)', color:'var(--red)', borderRadius:4, padding:'3px 10px', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {holidays.length === 0 && (
              <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📅</div>
                <div style={{ fontSize:15, color:'var(--text-sec)', marginBottom:8 }}>Chưa có ngày lễ nào</div>
                <div style={{ fontSize:13, marginBottom:20 }}>Thêm ngày lễ để hệ thống tự áp dụng luật giá đặc biệt</div>
                <Button variant="primary" size="md" onClick={() => openHol()}>+ Thêm ngày lễ đầu tiên</Button>
              </div>
            )}
          </div>
        )
      )}

      {/* ── Rule Modal ── */}
      <Modal open={modal==='rule'} onClose={() => setModal(null)} title={editing ? 'Chỉnh sửa luật giá' : 'Thêm luật giá mới'} maxWidth={520}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize:13, color:'var(--text-sec)', display:'block', marginBottom:6 }}>Tên luật *</label>
            <input value={ruleForm.ruleName} onChange={setr('ruleName')} placeholder="VD: Phụ thu cuối tuần VIP"
              style={{ ...ss, borderColor: ruleErrors.ruleName ? 'var(--red)' : 'var(--border)' }} />
            {ruleErrors.ruleName && <span style={errStyle}>⚠ {ruleErrors.ruleName}</span>}
          </div>

          {/* Seat type + Format */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={{ fontSize:13, color:'var(--text-sec)', display:'block', marginBottom:6 }}>Loại ghế</label>
              <select value={ruleForm.seatType} onChange={setr('seatType')} style={ss}>
                <option value="">Tất cả loại ghế</option>
                {SEAT_TYPES.map(t => <option key={t} value={t}>{SEAT_LABEL[t]||t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:13, color:'var(--text-sec)', display:'block', marginBottom:6 }}>Định dạng chiếu</label>
              <select value={ruleForm.screenFormat} onChange={setr('screenFormat')} style={ss}>
                <option value="">Tất cả định dạng</option>
                {FORMATS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Price + Priority */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={{ fontSize:13, color:'var(--text-sec)', display:'block', marginBottom:6 }}>Giá tiền (đ) *</label>
              <input type="number" value={ruleForm.basePrice} onChange={setr('basePrice')} placeholder="70000" min="0"
                style={{ ...ss, borderColor: ruleErrors.basePrice ? 'var(--red)' : 'var(--border)' }} />
              {ruleErrors.basePrice && <span style={errStyle}>⚠ {ruleErrors.basePrice}</span>}
            </div>
            <div>
              <label style={{ fontSize:13, color:'var(--text-sec)', display:'block', marginBottom:6 }}>Độ ưu tiên * (càng cao càng ưu tiên)</label>
              <input type="number" value={ruleForm.priority} onChange={setr('priority')} min="1" max="100"
                style={{ ...ss, borderColor: ruleErrors.priority ? 'var(--red)' : 'var(--border)' }} />
              {ruleErrors.priority && <span style={errStyle}>⚠ {ruleErrors.priority}</span>}
            </div>
          </div>

          {/* Time range */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label style={{ fontSize:13, color:'var(--text-sec)', display:'block', marginBottom:6 }}>Giờ bắt đầu áp dụng</label>
              <input type="time" value={ruleForm.startTimeFilter} onChange={setr('startTimeFilter')} style={ss} />
            </div>
            <div>
              <label style={{ fontSize:13, color:'var(--text-sec)', display:'block', marginBottom:6 }}>Giờ kết thúc áp dụng</label>
              <input type="time" value={ruleForm.endTimeFilter} onChange={setr('endTimeFilter')}
                style={{ ...ss, borderColor: ruleErrors.endTimeFilter ? 'var(--red)' : 'var(--border)' }} />
              {ruleErrors.endTimeFilter && <span style={errStyle}>⚠ {ruleErrors.endTimeFilter}</span>}
            </div>
          </div>

          {/* Day of week */}
          <div>
            <label style={{ fontSize:13, color:'var(--text-sec)', display:'block', marginBottom:8 }}>Áp dụng vào ngày trong tuần (để trống = mọi ngày)</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {DOW_OPTS.map(([val, label]) => {
                const active = (Array.isArray(ruleForm.dayOfWeekFilter)?ruleForm.dayOfWeekFilter:[]).includes(val)
                return (
                  <button key={val} type="button" onClick={() => toggleDow(val)} style={{ padding:'6px 14px', borderRadius:4, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", border:`1px solid ${active?'var(--gold)':'var(--border)'}`, background:active?'rgba(201,168,76,.15)':'var(--bg-card2)', color:active?'var(--gold)':'var(--text-sec)', transition:'.15s', fontWeight:active?600:400 }}>
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Holiday checkbox */}
          <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', fontSize:14, color:'var(--text-sec)', padding:'10px 12px', background:'var(--bg-card2)', borderRadius:6, border:`1px solid ${ruleForm.isHoliday?'rgba(224,82,82,.4)':'var(--border)'}` }}>
            <input type="checkbox" checked={!!ruleForm.isHoliday} onChange={e => setRuleForm(f => ({ ...f, isHoliday: e.target.checked }))} style={{ marginTop:2 }} />
            <div>
              <div style={{ fontWeight:500, color: ruleForm.isHoliday ? 'var(--red)' : 'inherit' }}>Chỉ áp dụng vào ngày lễ</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Sẽ tự động kích hoạt vào các ngày được khai báo trong tab "Ngày Lễ"</div>
            </div>
          </label>

          {/* Preview */}
          {ruleForm.basePrice && !isNaN(parseFloat(ruleForm.basePrice)) && (
            <div style={{ background:'rgba(201,168,76,.06)', border:'1px solid var(--border-gold)', borderRadius:6, padding:'10px 14px', fontSize:13, color:'var(--text-sec)', display:'flex', gap:8, alignItems:'center' }}>
              <span>💰</span>
              <span>Giá áp dụng: <strong style={{ color:'var(--gold)', fontSize:16 }}>{formatCurrency(parseFloat(ruleForm.basePrice))}</strong></span>
              {ruleForm.seatType && <span>· Ghế {SEAT_LABEL[ruleForm.seatType]}</span>}
              {ruleForm.screenFormat && <span>· {ruleForm.screenFormat}</span>}
              {ruleForm.isHoliday && <span style={{ color:'var(--red)' }}>· Ngày lễ</span>}
            </div>
          )}

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
            <Button variant="ghost" size="md" onClick={() => setModal(null)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={handleSaveRule} loading={saving}>
              {editing ? 'Lưu thay đổi' : 'Tạo luật giá'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Holiday Modal ── */}
      <Modal open={modal==='holiday'} onClose={() => setModal(null)} title={editing ? 'Sửa ngày lễ' : 'Thêm ngày lễ mới'} maxWidth={380}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:13, color:'var(--text-sec)', display:'block', marginBottom:6 }}>Ngày lễ *</label>
            <input type="date" value={holForm.holidayDate} onChange={seth('holidayDate')}
              style={{ ...ss, borderColor: holErrors.holidayDate ? 'var(--red)' : 'var(--border)' }} />
            {holErrors.holidayDate && <span style={errStyle}>⚠ {holErrors.holidayDate}</span>}
          </div>

          <div>
            <label style={{ fontSize:13, color:'var(--text-sec)', display:'block', marginBottom:6 }}>Tên / Mô tả *</label>
            <input value={holForm.description} onChange={seth('description')} placeholder="VD: Tết Nguyên Đán, Quốc khánh 2/9..."
              style={{ ...ss, borderColor: holErrors.description ? 'var(--red)' : 'var(--border)' }} />
            {holErrors.description && <span style={errStyle}>⚠ {holErrors.description}</span>}
          </div>

          {/* Active holiday rules */}
          <div style={{ background:'var(--bg-card2)', borderRadius:6, padding:'10px 12px', fontSize:12, color:'var(--text-sec)' }}>
            <div style={{ fontWeight:500, marginBottom:6 }}>Luật giá ngày lễ đang hoạt động:</div>
            {holidayRules.length === 0 ? (
              <div style={{ color:'var(--red)' }}>⚠ Chưa có luật giá ngày lễ nào! Hãy tạo luật giá với checkbox "Chỉ áp dụng vào ngày lễ" trong tab Luật Giá.</div>
            ) : (
              holidayRules.map(r => (
                <div key={r.id} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:'1px solid var(--border)' }}>
                  <span>{r.ruleName}</span>
                  <span style={{ color:'var(--gold)' }}>{formatCurrency(r.basePrice)}</span>
                </div>
              ))
            )}
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <Button variant="ghost" size="md" onClick={() => setModal(null)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={handleSaveHol} loading={saving}>
              {editing ? 'Lưu' : 'Thêm ngày lễ'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
