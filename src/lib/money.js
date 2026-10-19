export function formatIDR(amount) {
  if (!Number.isInteger(amount)) throw new TypeError('Jumlah harus integer rupiah');
  return 'Rp' + amount.toLocaleString('id-ID');
}
