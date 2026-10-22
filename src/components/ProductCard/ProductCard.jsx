import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../data/products';
import { useWishlist } from '../../context/WishlistContext';
import { useTranslation } from '../../hooks/useTranslation';
import Icon from '../ui/Icon';

const ProductCard = ({ product, onAddToCart, onQuickView }) => {
  const [imageError, setImageError] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { t } = useTranslation();

  const {
    id,
    name,
    slug,
    price,
    pattern,
    category,
    images,
    stock,
    featured,
  } = product;

  const imageSrc = images?.[0];
  const productPath = `/product/${slug || id}`;
  const isOutOfStock = stock === 0;
  const inWishlist = isInWishlist(id);
  const hasImage = Boolean(imageSrc) && !imageError;

  const controlClass =
    'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-paper-raised)] text-[var(--color-ink-soft)] shadow-[var(--shadow-lift)] transition-colors duration-200 hover:border-[var(--color-line-strong)] hover:text-[var(--color-brown-ink)]';

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-paper-raised)] transition-colors duration-200 hover:border-[var(--color-line-strong)]">
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-paper-deep)]">
        <Link
          to={productPath}
          className="block h-full"
          aria-label={`${t('product.viewDetails')}: ${name}`}
        >
          {hasImage ? (
            <img
              src={imageSrc}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.03]"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-[var(--color-ink-soft)]">
              <Icon name="imageOff" size={28} />
              <span className="text-sm font-medium text-[var(--color-ink)]">
                {t('product.noImage')}
              </span>
            </span>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 z-20">
          {pattern && (
            <span className="inline-flex items-center rounded-[var(--radius-xs)] border border-[var(--color-line-strong)] bg-[var(--color-paper-raised)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink)]">
              {pattern}
            </span>
          )}
        </div>

        {featured && (
          <div className="pointer-events-none absolute right-3 top-3 z-20">
            <span className="inline-flex items-center rounded-[var(--radius-xs)] border border-[var(--color-gold)] bg-[var(--color-paper-raised)] px-2.5 py-1 text-xs font-medium text-[var(--color-gold)]">
              {t('product.featured')}
            </span>
          </div>
        )}

        <div className="absolute inset-x-3 bottom-3 z-20 flex justify-end gap-2">
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className={controlClass}
              aria-label={t('product.quickView')}
            >
              <Icon name="quickView" size={20} />
            </button>
          )}

          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            className={`${controlClass} ${
              inWishlist ? 'text-[var(--color-danger)]' : ''
            }`}
            aria-label={
              inWishlist
                ? t('product.removeFromWishlist')
                : t('product.addToWishlist')
            }
            aria-pressed={inWishlist}
          >
            <Icon name="heart" size={20} weight={inWishlist ? 'fill' : 'regular'} />
          </button>
        </div>

        {isOutOfStock && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[rgba(28,25,23,0.72)]">
            <span className="text-sm font-semibold text-[var(--color-paper)]">
              {t('product.outOfStock')}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium text-[var(--color-ink-faint)]">
          {category}
        </p>

        <h3 className="mt-1 font-serif text-lg leading-snug text-[var(--color-ink)]">
          <Link
            to={productPath}
            className="underline-offset-4 transition-colors duration-200 hover:text-[var(--color-gold)] hover:underline"
          >
            {name}
          </Link>
        </h3>

        <div className="mt-auto pt-4">
          <p className="text-lg font-semibold tabular-nums text-[var(--color-brown-ink)]">
            {formatPrice(price)}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">
            {isOutOfStock
              ? t('product.outOfStock')
              : t('product.stockAvailable', { stock })}
          </p>

          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            disabled={isOutOfStock}
            className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-brown-ink)] bg-[var(--color-brown-ink)] px-4 text-sm font-semibold text-[var(--color-paper)] transition-colors duration-200 enabled:hover:border-[var(--color-brown-deep)] enabled:hover:bg-[var(--color-brown-deep)] disabled:cursor-not-allowed disabled:border-[var(--color-line-strong)] disabled:bg-[var(--color-paper-deep)] disabled:text-[var(--color-ink-soft)]"
          >
            <Icon name="bag" size={18} />
            {isOutOfStock ? t('product.outOfStock') : t('product.addToCart')}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
