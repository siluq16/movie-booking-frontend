export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const isValidPhone = (phone) =>
  /^(0|\+84)[3-9]\d{8}$/.test(phone)

export const isStrongPassword = (pw) => pw?.length >= 6

export const isValidPromoCode = (code) =>
  /^[A-Z0-9]{4,30}$/.test(code?.toUpperCase())
