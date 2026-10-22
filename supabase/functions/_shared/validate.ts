export interface CreateOrderItem {
  variant_id: string;
  qty: number;
}

export interface CreateOrderCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface CreateOrderAddress {
  recipient: string;
  phone: string;
  full_address: string;
  city: string;
  province: string;
  postal_code?: string;
  country: 'ID';
  note?: string;
}

export interface CreateOrderAccepts {
  tos: true;
  privacy: true;
  versions: {
    tos: string;
    privacy: string;
  };
}

export interface CreateOrderInput {
  items: CreateOrderItem[];
  customer: CreateOrderCustomer;
  address: CreateOrderAddress;
  payment_preference: 'manual' | 'duitku';
  accepts: CreateOrderAccepts;
  idempotency_key: string;
}

export type ValidationResult =
  | { ok: true; value: CreateOrderInput }
  | { ok: false; errors: string[] };

type PlainObject = Record<string, unknown>;

const TOP_LEVEL_FIELDS = [
  'items',
  'customer',
  'address',
  'payment_preference',
  'accepts',
  'idempotency_key',
];

const ITEM_FIELDS = ['variant_id', 'qty'];
const CUSTOMER_FIELDS = ['name', 'email', 'phone'];
const ADDRESS_FIELDS = [
  'recipient',
  'phone',
  'full_address',
  'city',
  'province',
  'postal_code',
  'country',
  'note',
];
const ACCEPTS_FIELDS = ['tos', 'privacy', 'versions'];
const VERSION_FIELDS = ['tos', 'privacy'];
const PAYMENT_PREFERENCES = ['manual', 'duitku'];

const isPlainObject = (value: unknown): value is PlainObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const collectUnknownFields = (
  value: PlainObject,
  allowed: string[],
  prefix: string,
  errors: string[],
) => {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      errors.push(`unknown_field:${prefix}${key}`);
    }
  }
};

const trimmed = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const isStringLength = (value: unknown, min: number, max: number): value is string => {
  if (typeof value !== 'string') {
    return false;
  }
  const length = value.trim().length;
  return length >= min && length <= max;
};

const isIntInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const isEmail = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }
  const candidate = value.trim();
  return candidate.length <= 254 && EMAIL_PATTERN.test(candidate);
};

const isPhone = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }
  const candidate = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(candidate)) {
    return false;
  }
  const digits = candidate.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 16;
};

const isPostalCode = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{3,10}$/.test(value.trim());

/**
 * Validasi payload create-order dari browser. Field asing ditolak supaya
 * penambahan field baru tidak diam-diam masuk ke database.
 */
export function validateCreateOrder(body: unknown): ValidationResult {
  if (!isPlainObject(body)) {
    return { ok: false, errors: ['body_invalid'] };
  }

  const errors: string[] = [];
  collectUnknownFields(body, TOP_LEVEL_FIELDS, '', errors);

  const items: CreateOrderItem[] = [];
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push('items_required');
  } else if (body.items.length > 20) {
    errors.push('items_too_many');
  } else {
    body.items.forEach((item, index) => {
      if (!isPlainObject(item)) {
        errors.push(`item_${index}_invalid`);
        return;
      }
      collectUnknownFields(item, ITEM_FIELDS, `item_${index}.`, errors);

      const variantId = trimmed(item.variant_id);
      if (variantId.length < 1 || variantId.length > 100) {
        errors.push(`item_${index}_variant_id_invalid`);
      }

      if (!isIntInRange(item.qty, 1, 10)) {
        errors.push(`item_${index}_qty_invalid`);
      }

      if (
        variantId.length >= 1 &&
        variantId.length <= 100 &&
        isIntInRange(item.qty, 1, 10)
      ) {
        items.push({ variant_id: variantId, qty: item.qty });
      }
    });
  }

  let customer: CreateOrderCustomer = { name: '', email: '', phone: '' };
  if (!isPlainObject(body.customer)) {
    errors.push('customer_invalid');
  } else {
    collectUnknownFields(body.customer, CUSTOMER_FIELDS, 'customer.', errors);

    if (!isStringLength(body.customer.name, 2, 80)) {
      errors.push('customer_name_invalid');
    }
    if (!isEmail(body.customer.email)) {
      errors.push('customer_email_invalid');
    }
    if (!isPhone(body.customer.phone)) {
      errors.push('customer_phone_invalid');
    }

    customer = {
      name: trimmed(body.customer.name),
      email: trimmed(body.customer.email),
      phone: trimmed(body.customer.phone),
    };
  }

  let address: CreateOrderAddress = {
    recipient: '',
    phone: '',
    full_address: '',
    city: '',
    province: '',
    country: 'ID',
  };
  if (!isPlainObject(body.address)) {
    errors.push('address_invalid');
  } else {
    const rawAddress = body.address;
    collectUnknownFields(rawAddress, ADDRESS_FIELDS, 'address.', errors);

    if (!isStringLength(rawAddress.recipient, 2, 80)) {
      errors.push('address_recipient_invalid');
    }
    if (!isPhone(rawAddress.phone)) {
      errors.push('address_phone_invalid');
    }
    if (!isStringLength(rawAddress.full_address, 10, 500)) {
      errors.push('address_full_address_invalid');
    }
    if (!isStringLength(rawAddress.city, 2, 80)) {
      errors.push('address_city_invalid');
    }
    if (!isStringLength(rawAddress.province, 2, 80)) {
      errors.push('address_province_invalid');
    }

    const postalCode = rawAddress.postal_code;
    if (postalCode !== undefined && postalCode !== null && postalCode !== '') {
      if (!isPostalCode(postalCode)) {
        errors.push('address_postal_code_invalid');
      }
    }

    const country = rawAddress.country === undefined ? 'ID' : rawAddress.country;
    if (country !== 'ID') {
      errors.push('address_country_invalid');
    }

    const note = rawAddress.note;
    if (note !== undefined && note !== null && note !== '' && !isStringLength(note, 1, 500)) {
      errors.push('address_note_invalid');
    }

    address = {
      recipient: trimmed(rawAddress.recipient),
      phone: trimmed(rawAddress.phone),
      full_address: trimmed(rawAddress.full_address),
      city: trimmed(rawAddress.city),
      province: trimmed(rawAddress.province),
      ...(isPostalCode(postalCode) ? { postal_code: postalCode.trim() } : {}),
      country: 'ID',
      ...(isStringLength(note, 1, 500) ? { note: note.trim() } : {}),
    };
  }

  const paymentPreference = body.payment_preference;
  if (
    typeof paymentPreference !== 'string' ||
    !PAYMENT_PREFERENCES.includes(paymentPreference)
  ) {
    errors.push('payment_preference_invalid');
  }

  let accepts: CreateOrderAccepts = {
    tos: true,
    privacy: true,
    versions: { tos: '', privacy: '' },
  };
  if (!isPlainObject(body.accepts)) {
    errors.push('accepts_required');
  } else {
    const rawAccepts = body.accepts;
    collectUnknownFields(rawAccepts, ACCEPTS_FIELDS, 'accepts.', errors);

    if (rawAccepts.tos !== true) {
      errors.push('accepts_tos_required');
    }
    if (rawAccepts.privacy !== true) {
      errors.push('accepts_privacy_required');
    }

    if (!isPlainObject(rawAccepts.versions)) {
      errors.push('accepts_versions_invalid');
    } else {
      const versions = rawAccepts.versions;
      collectUnknownFields(versions, VERSION_FIELDS, 'accepts.versions.', errors);

      if (!isStringLength(versions.tos, 1, 50)) {
        errors.push('accepts_versions_tos_invalid');
      }
      if (!isStringLength(versions.privacy, 1, 50)) {
        errors.push('accepts_versions_privacy_invalid');
      }

      accepts = {
        tos: true,
        privacy: true,
        versions: {
          tos: trimmed(versions.tos),
          privacy: trimmed(versions.privacy),
        },
      };
    }
  }

  if (!isStringLength(body.idempotency_key, 8, 80)) {
    errors.push('idempotency_key_invalid');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      items,
      customer,
      address,
      payment_preference: paymentPreference as 'manual' | 'duitku',
      accepts,
      idempotency_key: trimmed(body.idempotency_key),
    },
  };
}
