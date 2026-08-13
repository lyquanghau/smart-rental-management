export function parseMoneyInput(value) {
  return String(value || '').replace(/\D/g, '');
}

export function formatMoneyInput(value) {
  const digits = parseMoneyInput(value);

  if (!digits) return '';

  return new Intl.NumberFormat('vi-VN').format(Number(digits));
}
