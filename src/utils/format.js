export function formatNumber(value, { maximumFractionDigits, zeroAs = '0' } = {}) {
  if (!value || value === 0) return zeroAs;
  const options = maximumFractionDigits !== undefined ? { maximumFractionDigits } : undefined;
  return Number(value).toLocaleString('ko-KR', options);
}
