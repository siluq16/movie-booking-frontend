// ManageFood.jsx
import { useState, useEffect } from 'react'
import { foodService } from '../../services/movieService'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import { FieldError, validate, check, rules, inputErr } from '../../utils/validation'
import { formatCurrency } from '../../utils/formatters'
import toast from 'react-hot-toast'

const EMPTY_ITEM = { categoryId:'', name:'', description:'', basePrice:'', calories:'', isCombo:false, isAvailable:true, displayOrder:0, imageUrl:'' }
const EMPTY_CAT  = { name:'', slug:'', displayOrder:0, isActive:true }
const ssBase = { width:'100%', background:'var(--bg-card2)', borderRadius:6, padding:'10px 12px', color:'var(--text-pri)', fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none' }
const ss = (err) => ({ ...ssBase, border:`1px solid ${err?'var(--red)':'var(--border)'}` })

function valItem(f) {
  return validate({
    categoryId: !f.categoryId ? 'Vui lòng chọn danh mục' : null,
    name:       check(f.name, rules.required('Tên món'), rules.minLen(2,'Tên món'), rules.maxLen(100,'Tên món')),
    basePrice:  check(f.basePrice, rules.required('Giá tiền'), rules.nonNeg('Giá tiền')),
    calories:   f.calories && (isNaN(parseInt(f.calories))||parseInt(f.calories)<0) ? 'Calories phải >= 0' : null,
  })
}
function valCat(f) {
  return validate({
    name: check(f.name, rules.required('Tên danh mục'), rules.minLen(2,'Tên'), rules.maxLen(50,'Tên')),
    slug: check(f.slug, rules.required('Slug'), rules.slug()),
  })
}

export default function ManageFood() {
  const [categories, setCategories] = useState([])
  const [items, setItems]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('items')
  const [catFilter, setCatFilter]   = useState('all')
  const [search, setSearch]         = useState('')
  const [modal, setModal]           = useState(null)
  const [editing, setEditing]       = useState(null)
  const [itemForm, setItemForm]     = useState(EMPTY_ITEM)
  const [catForm, setCatForm]       = useState(EMPTY_CAT)
  const [itemErrors, setItemErrors] = useState({})
  const [catErrors, setCatErrors]   = useState({})
  const [touched, setTouched]       = useState({})
  const [saving, setSaving]         = useState(false)

  const load = () => {
    setLoading(true)
    Promise.allSettled([foodService.getCategories(), foodService.getItems()])
      .then(([c,i]) => {
        setCategories(c.status==='fulfilled'?(Array.isArray(c.value.data)?c.value.data:[]):[])
        setItems(i.status==='fulfilled'?(Array.isArray(i.value.data)?i.value.data:[]):[])
      }).finally(()=>setLoading(false))
  }
  useEffect(load,[])

  const setI = (f) => (e) => {
    const v = e.target.value; const nf = {...itemForm,[f]:v}
    setItemForm(nf); setTouched(p=>({...p,[f]:true}))
    const {errors} = valItem(nf); setItemErrors(p=>({...p,[f]:errors[f]}))
  }
  const setC = (f) => (e) => {
    const v = e.target.value
    const update = {[f]:v}
    if (f==='name'&&!editing) update.slug = v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-')
    const nf = {...catForm,...update}; setCatForm(nf); setTouched(p=>({...p,[f]:true}))
    const {errors} = valCat(nf); setCatErrors(p=>({...p,...Object.fromEntries(Object.keys(errors).map(k=>[k,errors[k]]))}))
  }

  const openItem = (item=null) => { setEditing(item); setItemForm(item?{...item,basePrice:String(item.basePrice),categoryId:String(item.categoryId),calories:item.calories?String(item.calories):''}:EMPTY_ITEM); setItemErrors({}); setTouched({}); setModal('item') }
  const openCat  = (cat=null) => { setEditing(cat); setCatForm(cat||EMPTY_CAT); setCatErrors({}); setTouched({}); setModal('cat') }

  const saveItem = async () => {
    const {errors:errs,isValid} = valItem(itemForm)
    if (!isValid) { setItemErrors(errs); setTouched(Object.fromEntries(Object.keys(itemForm).map(k=>[k,true]))); toast.error('Vui lòng kiểm tra lại'); return }
    setSaving(true)
    const payload = {...itemForm, categoryId:parseInt(itemForm.categoryId), basePrice:parseFloat(itemForm.basePrice), calories:itemForm.calories?parseInt(itemForm.calories):null, displayOrder:parseInt(itemForm.displayOrder)||0}
    try {
      if (editing) { await foodService.updateItem(editing.id,payload); toast.success('Cập nhật thành công!') }
      else         { await foodService.createItem(payload);            toast.success('Tạo món thành công!') }
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message||'Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const saveCat = async () => {
    const {errors:errs,isValid} = valCat(catForm)
    if (!isValid) { setCatErrors(errs); setTouched(Object.fromEntries(Object.keys(catForm).map(k=>[k,true]))); toast.error('Vui lòng kiểm tra lại'); return }
    setSaving(true)
    try {
      if (editing) { await foodService.updateCategory(editing.id,catForm); toast.success('Cập nhật thành công!') }
      else         { await foodService.createCategory(catForm);            toast.success('Tạo danh mục thành công!') }
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message||'Tên hoặc slug đã tồn tại') }
    finally { setSaving(false) }
  }

  const filteredItems = items.filter(i=>{const mc=catFilter==='all'||i.categoryId===parseInt(catFilter); const ms=!search||i.name?.toLowerCase().includes(search.toLowerCase()); return mc&&ms})
  const EI = ({f}) => <FieldError msg={touched[f]?itemErrors[f]:null} />
  const EC = ({f}) => <FieldError msg={touched[f]?catErrors[f]:null} />

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26 }}>Quản lý <span style={{ color:'var(--gold)' }}>Đồ Ăn & Thức Uống</span></h1>
        <Button variant="primary" size="md" onClick={()=>tab==='items'?openItem():openCat()}>+ {tab==='items'?'Thêm món ăn':'Thêm danh mục'}</Button>
      </div>
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:24 }}>
        {[['items','🍿 Món Ăn'],['cats','📂 Danh Mục']].map(([v,l])=>(
          <button key={v} onClick={()=>setTab(v)} style={{ background:'none', border:'none', color:tab===v?'var(--gold)':'var(--text-sec)', fontSize:14, padding:'10px 24px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", borderBottom:`2px solid ${tab===v?'var(--gold)':'transparent'}`, marginBottom:-1 }}>
            {l} <span style={{ fontSize:11, opacity:.6 }}>({v==='items'?items.length:categories.length})</span>
          </button>
        ))}
      </div>
      {tab==='items'&&(
        <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Tìm món ăn..."
            style={{ background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 14px', color:'var(--text-pri)', fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", width:200 }}
            onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
          <div style={{ display:'flex', borderRadius:6, overflow:'hidden', border:'1px solid var(--border)' }}>
            <button onClick={()=>setCatFilter('all')} style={{ padding:'8px 12px', background:catFilter==='all'?'var(--gold)':'var(--bg-card)', border:'none', color:catFilter==='all'?'#000':'var(--text-sec)', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>Tất cả</button>
            {categories.map(c=><button key={c.id} onClick={()=>setCatFilter(String(c.id))} style={{ padding:'8px 12px', background:catFilter===String(c.id)?'var(--gold)':'var(--bg-card)', border:'none', borderLeft:'1px solid var(--border)', color:catFilter===String(c.id)?'#000':'var(--text-sec)', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{c.name}</button>)}
          </div>
        </div>
      )}
      {loading?<div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size="lg" /></div>
        :tab==='items'?(
        <>
          {filteredItems.length===0
            ? <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10 }}>{search?'Không tìm thấy':'Chưa có món ăn nào'}</div>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
                {filteredItems.map(item=>{
                  const hasRealImg = item.imageUrl?.startsWith('http')
                  const catName = categories.find(c=>c.id===item.categoryId)?.name||''
                  return (
                    <div key={item.id} style={{ background:'var(--bg-card)', border:`1px solid ${item.isAvailable?'var(--border)':'rgba(90,88,80,.4)'}`, borderRadius:10, overflow:'hidden', opacity:item.isAvailable?1:.7, transition:'border-color .2s, transform .15s' }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-gold)';e.currentTarget.style.transform='translateY(-2px)'}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=item.isAvailable?'var(--border)':'rgba(90,88,80,.4)';e.currentTarget.style.transform=''}}>

                      {/* Image area — 16:9, shows real img or emoji */}
                      <div style={{ height:130, background:'var(--bg-card2)', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {hasRealImg ? (
                          <img src={item.imageUrl} alt={item.name}
                            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                            onError={e=>{ e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex' }} />
                        ) : null}
                        {/* Fallback emoji — always in DOM, hidden when img loads */}
                        <div style={{ position: hasRealImg?'absolute':'static', inset:0, display: hasRealImg?'none':'flex', alignItems:'center', justifyContent:'center', fontSize:52, background:'var(--bg-card2)' }}>
                          {item.imageUrl && !hasRealImg ? item.imageUrl : '🍽️'}
                        </div>

                        {/* Badges */}
                        <div style={{ position:'absolute', top:8, left:8, display:'flex', gap:4 }}>
                          {item.isCombo&&<span style={{ fontSize:9, fontWeight:700, background:'var(--gold)', color:'#000', padding:'2px 7px', borderRadius:2 }}>COMBO</span>}
                          {!item.isAvailable&&<span style={{ fontSize:9, background:'rgba(40,40,40,.85)', color:'var(--text-muted)', padding:'2px 7px', borderRadius:2 }}>HẾT HÀNG</span>}
                        </div>

                        {/* Category pill */}
                        {catName&&<div style={{ position:'absolute', bottom:8, right:8, fontSize:10, background:'rgba(0,0,0,.6)', color:'#ccc', padding:'2px 8px', borderRadius:10, backdropFilter:'blur(4px)' }}>{catName}</div>}
                      </div>

                      {/* Info */}
                      <div style={{ padding:'12px 14px' }}>
                        <div style={{ fontSize:13, fontWeight:500, marginBottom:4, lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                        {item.description&&<div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.description}</div>}
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                          <span style={{ fontSize:15, color:'var(--gold)', fontWeight:600 }}>{formatCurrency(item.basePrice)}</span>
                          {item.calories&&<span style={{ fontSize:10, color:'var(--text-muted)' }}>{item.calories} kcal</span>}
                        </div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={()=>openItem(item)}
                            style={{ flex:1, background:'var(--bg-card2)', border:'1px solid var(--border)', color:'var(--text-sec)', borderRadius:5, padding:'6px 0', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif", transition:'.15s' }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold)'}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-sec)'}}>✏️ Sửa</button>
                          <button onClick={async()=>{try{await foodService.deleteItem(item.id);toast.success('Đã cập nhật');load()}catch{toast.error('Không thể thay đổi')}}}
                            style={{ flex:1, background:'none', border:`1px solid ${item.isAvailable?'rgba(224,82,82,.35)':'rgba(82,201,124,.35)'}`, color:item.isAvailable?'var(--red)':'var(--green)', borderRadius:5, padding:'6px 0', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif", transition:'.15s' }}>
                            {item.isAvailable?'Ẩn':'Hiện'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
          }
        </>
      ):(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:14 }}>
          {categories.map(c=>(
            <div key={c.id} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:18, transition:'.2s' }} onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-gold)'} onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={{ fontSize:14, fontWeight:500 }}>{c.name}</div>
                <span style={{ fontSize:10, ...(c.isActive?{background:'rgba(82,201,124,.12)',color:'var(--green)'}:{background:'rgba(90,88,80,.2)',color:'var(--text-muted)'}), padding:'2px 7px', borderRadius:2 }}>{c.isActive?'Hiển thị':'Ẩn'}</span>
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'monospace', marginBottom:4 }}>{c.slug}</div>
              <div style={{ fontSize:12, color:'var(--text-sec)', marginBottom:14 }}>{items.filter(i=>i.categoryId===c.id).length} món</div>
              <button onClick={()=>openCat(c)} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-sec)', borderRadius:4, padding:'5px 12px', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif", width:'100%', transition:'.15s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-sec)'}}>✏️ Chỉnh sửa</button>
            </div>
          ))}
          {categories.length===0&&<div style={{ gridColumn:'1/-1', textAlign:'center', padding:60, color:'var(--text-muted)', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10 }}>Chưa có danh mục nào</div>}
        </div>
      )}

      {/* Item Modal */}
      <Modal open={modal==='item'} onClose={()=>setModal(null)} title={editing?'Sửa món ăn':'Thêm món ăn'} maxWidth={500}>
        <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <div>
            <label style={{ fontSize:13, color:'var(--text-sec)', display:'block', marginBottom:6 }}>Danh mục *</label>
            <select value={itemForm.categoryId} onChange={setI('categoryId')} style={ss(touched.categoryId&&itemErrors.categoryId)}>
              <option value="">-- Chọn danh mục --</option>
              {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <EI f="categoryId" />
          </div>
          <div><Input label="Tên món *" value={itemForm.name} onChange={setI('name')} placeholder="VD: Bắp rang phô mai (Lớn)" style={inputErr(touched.name&&itemErrors.name)} /><EI f="name" /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><Input label="Giá bán (đ) *" type="number" min={0} value={itemForm.basePrice} onChange={setI('basePrice')} style={inputErr(touched.basePrice&&itemErrors.basePrice)} /><EI f="basePrice" /></div>
            <div><Input label="Calories (tuỳ chọn)" type="number" min={0} value={itemForm.calories} onChange={setI('calories')} style={inputErr(touched.calories&&itemErrors.calories)} /><EI f="calories" /></div>
          </div>
          <Input label="Emoji hoặc URL ảnh" value={itemForm.imageUrl} onChange={setI('imageUrl')} placeholder="🍿 hoặc https://..." />
          <Input label="Mô tả" value={itemForm.description||''} onChange={setI('description')} placeholder="Mô tả ngắn..." />
          <div style={{ display:'flex', gap:24 }}>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, color:'var(--text-sec)' }}><input type="checkbox" checked={!!itemForm.isCombo} onChange={e=>setItemForm(f=>({...f,isCombo:e.target.checked}))} />Là Combo</label>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, color:'var(--text-sec)' }}><input type="checkbox" checked={!!itemForm.isAvailable} onChange={e=>setItemForm(f=>({...f,isAvailable:e.target.checked}))} />Đang có sẵn</label>
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:8, borderTop:'1px solid var(--border)' }}>
            <Button variant="ghost" size="md" onClick={()=>setModal(null)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={saveItem} loading={saving}>{editing?'Lưu':'Tạo'}</Button>
          </div>
        </div>
      </Modal>

      {/* Cat Modal */}
      <Modal open={modal==='cat'} onClose={()=>setModal(null)} title={editing?'Sửa danh mục':'Thêm danh mục'} maxWidth={400}>
        <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <div><Input label="Tên danh mục *" value={catForm.name} onChange={setC('name')} placeholder="VD: Bắp rang" style={inputErr(touched.name&&catErrors.name)} /><EC f="name" /></div>
          <div>
            <Input label="Slug *" value={catForm.slug} onChange={setC('slug')} placeholder="vd: bap-rang" style={inputErr(touched.slug&&catErrors.slug)} />
            <EC f="slug" />
            <span style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, display:'block' }}>Chỉ dùng chữ thường, số, dấu gạch ngang. Tự điền khi nhập tên.</span>
          </div>
          <Input label="Thứ tự hiển thị" type="number" min={0} value={catForm.displayOrder} onChange={setC('displayOrder')} />
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, color:'var(--text-sec)' }}><input type="checkbox" checked={!!catForm.isActive} onChange={e=>setCatForm(f=>({...f,isActive:e.target.checked}))} />Đang hiển thị</label>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:8, borderTop:'1px solid var(--border)' }}>
            <Button variant="ghost" size="md" onClick={()=>setModal(null)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={saveCat} loading={saving}>{editing?'Lưu':'Tạo'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
