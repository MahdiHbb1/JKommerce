/**
 * Bentuk data yang dipakai halaman katalog (hasil mapping dari PostgREST).
 *
 * @typedef {Object} Variant
 * @property {string} id
 * @property {string} sku
 * @property {string} size
 * @property {string} color
 * @property {boolean} is_active
 * @property {number} stock_available  stock_on_hand - stock_reserved
 *
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} slug
 * @property {string} name
 * @property {string|null} name_en
 * @property {string} category
 * @property {string|null} pattern
 * @property {string|null} description
 * @property {string|null} heritage
 * @property {string|null} details
 * @property {number} price_idr
 * @property {string[]} images
 * @property {boolean} is_featured
 * @property {boolean} is_bestseller
 * @property {boolean} needs_verification
 * @property {number} sort_order
 * @property {Variant[]} variants
 *
 * @typedef {Object} Zone
 * @property {string} id
 * @property {string} name
 * @property {number} rate_idr
 * @property {number} eta_min_days
 * @property {number} eta_max_days
 * @property {string[]} provinces
 * @property {boolean} is_active
 *
 * @typedef {Object} PublicSettings
 * @property {Object} business
 * @property {{ mode: 'included'|'excluded'|'none', rate_percent: number }} tax
 * @property {Object} payment
 * @property {Object} legal
 */

export {};
