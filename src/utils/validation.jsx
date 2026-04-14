// ─── Shared validation helpers ───────────────────────────────────────────────
// rules.xxx(label?) returns a VALIDATOR FUNCTION (v) => string|null
// Use with: check(value, rules.required(), rules.minLen(3))

export const errStyle = {
  fontSize: 11, color: 'var(--red)', marginTop: 3,
  display: 'block', lineHeight: 1.4,
}

export const inputErr = (hasError) =>
  hasError ? { borderColor: 'var(--red)', background: 'rgba(224,82,82,.04)' } : {}

// ─── Curried validators ───────────────────────────────────────────────────────
export const rules = {
  required: (label = 'Trường này') =>
    (v) => !v?.toString().trim() ? `${label} không được để trống` : null,

  minLen: (n, label = 'Trường này') =>
    (v) => (v?.toString().trim().length ?? 0) < n ? `${label} phải có ít nhất ${n} ký tự` : null,

  maxLen: (n, label = 'Trường này') =>
    (v) => (v?.toString().length ?? 0) > n ? `${label} không được quá ${n} ký tự` : null,

  positive: (label = 'Giá trị') =>
    (v) => isNaN(parseFloat(v)) || parseFloat(v) <= 0 ? `${label} phải lớn hơn 0` : null,

  nonNeg: (label = 'Giá trị') =>
    (v) => isNaN(parseFloat(v)) || parseFloat(v) < 0 ? `${label} phải >= 0` : null,

  integer: (label = 'Giá trị') =>
    (v) => !Number.isInteger(Number(v)) || Number(v) < 1 ? `${label} phải là số nguyên >= 1` : null,

  pct: () =>
    (v) => isNaN(parseFloat(v)) || parseFloat(v) <= 0 || parseFloat(v) > 100
      ? 'Phần trăm phải từ 1–100' : null,

  email: () =>
    (v) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Email không đúng định dạng' : null,

  phone: () =>
    (v) => !/^[0-9]{9,11}$/.test(v?.replace(/\s/g, '')) ? 'Số điện thoại không hợp lệ (9–11 chữ số)' : null,

  url: () =>
    (v) => { if (!v) return null; try { new URL(v); return null } catch { return 'URL không hợp lệ' } },

  slug: () =>
    (v) => /[^a-z0-9-]/.test(v) ? 'Slug chỉ dùng chữ thường, số, dấu gạch ngang' : null,

  noSpace: () =>
    (v) => /\s/.test(v) ? 'Không được chứa khoảng trắng' : null,

  future: () =>
    (v) => { if (!v) return null; return new Date(v) <= new Date() ? 'Phải là thời điểm trong tương lai' : null },
}

// ─── check(value, ...validators) — returns first error or null ────────────────
export function check(value, ...validators) {
  for (const fn of validators) {
    if (typeof fn !== 'function') continue
    const msg = fn(value)
    if (msg) return msg
  }
  return null
}

// ─── validate(schema) — returns { errors, isValid } ──────────────────────────
// schema = { fieldName: errorMessageOrNull }
// Example:
//   validate({
//     name: check(form.name, rules.required('Tên'), rules.minLen(2, 'Tên')),
//     price: check(form.price, rules.required('Giá'), rules.positive('Giá')),
//   })
export function validate(schema) {
  const errors = {}
  for (const [field, msg] of Object.entries(schema)) {
    if (msg) errors[field] = msg
  }
  return { errors, isValid: Object.keys(errors).length === 0 }
}

// ─── FieldError component ─────────────────────────────────────────────────────
export function FieldError({ msg }) {
  if (!msg) return null
  return <span style={errStyle}>⚠ {msg}</span>
}
