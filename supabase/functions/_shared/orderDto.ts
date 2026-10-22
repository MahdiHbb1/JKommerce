export interface OrderItemRow {
  name_snapshot: string | null;
  qty: number;
  unit_price_idr: number;
}

export interface OrderRowWithItems {
  order_number: string;
  status: string;
  subtotal_idr: number;
  shipping_idr: number;
  discount_idr: number;
  tax_idr: number;
  total_idr: number;
  tax_mode: string;
  courier: string | null;
  tracking_number: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  expires_at: string | null;
  email?: string | null;
  user_id?: string | null;
  internal_note?: string | null;
  payload?: unknown;
  customer?: unknown;
  address?: unknown;
  order_items?: OrderItemRow[] | null;
}

export interface PublicOrderItem {
  name: string;
  qty: number;
  unit_price_idr: number;
}

export interface PublicOrder {
  order_number: string;
  status: string;
  totals: {
    subtotal_idr: number;
    shipping_idr: number;
    discount_idr: number;
    tax_idr: number;
    total_idr: number;
    tax_mode: string;
  };
  items: PublicOrderItem[];
  courier: string | null;
  tracking_number: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  expires_at: string | null;
}

/**
 * DTO pelacakan pesanan: allowlist eksplisit supaya field internal
 * (email, user_id, internal_note, payload, customer, address) tidak pernah
 * ikut terkirim ke browser.
 */
export function toPublicOrder(row: OrderRowWithItems): PublicOrder {
  return {
    order_number: row.order_number,
    status: row.status,
    totals: {
      subtotal_idr: row.subtotal_idr,
      shipping_idr: row.shipping_idr,
      discount_idr: row.discount_idr,
      tax_idr: row.tax_idr,
      total_idr: row.total_idr,
      tax_mode: row.tax_mode,
    },
    items: (row.order_items ?? []).map((item) => ({
      name: item.name_snapshot ?? 'Produk',
      qty: item.qty,
      unit_price_idr: item.unit_price_idr,
    })),
    courier: row.courier,
    tracking_number: row.tracking_number,
    created_at: row.created_at,
    paid_at: row.paid_at,
    shipped_at: row.shipped_at,
    delivered_at: row.delivered_at,
    expires_at: row.expires_at,
  };
}
