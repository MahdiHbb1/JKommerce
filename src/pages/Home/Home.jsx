import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../hooks/useTranslation';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import QuickView from '../../components/QuickView/QuickView';
import PageMeta from '../../components/Seo/PageMeta';
import { ProductGridSkeleton } from '../../components/Skeleton/Skeleton';
import { fetchProducts } from '../../lib/db/catalog';
import { toCardProduct } from '../../lib/db/presenters';
import parangImg from '../../assets/images/motif-parang.jpg';
import kawungImg from '../../assets/images/motif-kawung.jpg';
import kontemporerImg from '../../assets/images/motif-kontemporer.jpg';
import soganImg from '../../assets/images/motif-sogan.jpg';
import './Home.css';

const Home = () => {
  const { addToCart } = useCart();
  const { success } = useToast();
  const { t } = useTranslation();
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [brokenHeroImage, setBrokenHeroImage] = useState(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchProducts();
      setProducts(data.map(toCardProduct));
      setBrokenHeroImage(null);
    } catch (error) {
      console.error('Gagal memuat katalog:', error);
      setLoadError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const featuredProducts = products.filter((product) => product.featured).slice(0, 4);
  const heroProduct = featuredProducts[0] || null;
  const heroProductImage = heroProduct?.images?.[0] || null;
  const heroImageSrc =
    heroProductImage && brokenHeroImage !== heroProductImage
      ? heroProductImage
      : soganImg;
  const heroShowsProduct = Boolean(heroProduct) && heroImageSrc === heroProductImage;
  const heroCaption = heroShowsProduct
    ? t('home.heroImageCaption', { name: heroProduct.name })
    : t('home.heroFallbackCaption');

  const categories = [
    {
      to: '/shop?category=Batik Tulis',
      titleKey: 'home.batikTulis',
      bodyKey: 'home.categoryTulisBody',
      altKey: 'home.categoryTulisAlt',
      image: parangImg,
    },
    {
      to: '/shop?category=Batik Cap',
      titleKey: 'home.batikCap',
      bodyKey: 'home.categoryCapBody',
      altKey: 'home.categoryCapAlt',
      image: kawungImg,
    },
    {
      to: '/shop?category=Batik Printing',
      titleKey: 'home.batikPrinting',
      bodyKey: 'home.categoryPrintingBody',
      altKey: 'home.categoryPrintingAlt',
      image: kontemporerImg,
    },
  ];

  const motifs = [
    { title: t('home.parang'), body: t('home.motifParangBody') },
    { title: t('home.kawung'), body: t('home.motifKawungBody') },
    { title: t('home.megaMendung'), body: t('home.motifMegaMendungBody') },
  ];

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    success(t('notifications.addedToCart', { name: product.name }));
  };

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  const renderCollection = (items) => {
    if (isLoading) {
      return <ProductGridSkeleton count={4} />;
    }

    if (loadError) {
      return (
        <div role="alert" className="home-products__state">
          <h3>{t('shop.loadError')}</h3>
          <p>{t('shop.loadErrorHint')}</p>
          <button
            type="button"
            onClick={loadProducts}
            className="home-button home-button--primary"
          >
            {t('shop.retry')}
          </button>
        </div>
      );
    }

    if (!isLoading && !loadError && items.length === 0) {
      return (
        <div className="home-products__state">
          <h3>{t('home.collectionEmptyTitle')}</h3>
          <p>{t('home.collectionEmptyBody')}</p>
          <Link to="/shop" className="home-button home-button--primary">
            {t('home.collectionEmptyCta')}
          </Link>
        </div>
      );
    }

    return (
      <ProductGrid
        products={items}
        onAddToCart={handleAddToCart}
        onQuickView={handleQuickView}
      />
    );
  };

  return (
    <div className="home-page">
      <PageMeta
        title={t('home.metaTitle')}
        description={t('home.metaDescription')}
      />

      <section className="home-hero" aria-labelledby="home-hero-title">
        <div className="home-container home-hero__inner">
          <div className="home-hero__copy">
            <p className="home-kicker">{t('home.heroKicker')}</p>
            <h1 id="home-hero-title" className="home-hero__title">
              {t('home.heroHeading')}
            </h1>
            <p className="home-hero__body">{t('home.heroBody')}</p>
            <div className="home-hero__actions">
              <Link to="/shop" className="home-button home-button--primary">
                {t('home.heroCta')}
              </Link>
            </div>
          </div>

          <figure className="home-hero__figure">
            <div className="home-hero__image">
              <img
                src={heroImageSrc}
                alt={heroShowsProduct ? heroProduct.name : t('home.heroFallbackAlt')}
                onError={() => setBrokenHeroImage(heroProductImage)}
              />
            </div>
            <figcaption className="home-hero__caption">
              {heroShowsProduct ? (
                <Link
                  to={`/product/${heroProduct.slug || heroProduct.id}`}
                  className="home-hero__caption-link"
                >
                  {heroCaption}
                </Link>
              ) : (
                <span>{heroCaption}</span>
              )}
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="home-categories" aria-labelledby="home-categories-title">
        <div className="home-container">
          <header className="home-section-head">
            <div>
              <p className="home-kicker">{t('home.categoriesKicker')}</p>
              <h2 id="home-categories-title">{t('home.categoriesHeading')}</h2>
            </div>
            <p className="home-section-head__body">{t('home.categoriesBody')}</p>
          </header>

          <div className="home-category-grid">
            {categories.map((category) => (
              <Link key={category.to} to={category.to} className="home-category">
                <div className="home-category__media">
                  <img
                    src={category.image}
                    alt={t(category.altKey)}
                    loading="lazy"
                  />
                </div>
                <div className="home-category__body">
                  <h3>{t(category.titleKey)}</h3>
                  <p>{t(category.bodyKey)}</p>
                  <span className="home-category__cue">
                    {t('home.viewCollection')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-story" aria-labelledby="home-story-title">
        <div className="home-container home-story__inner">
          <div>
            <p className="home-kicker">{t('home.storyKicker')}</p>
            <h2 id="home-story-title" className="home-story__heading">
              {t('home.storyHeading')}
            </h2>
          </div>
          <div className="home-story__copy">
            <p>{t('home.storyBody')}</p>
            <Link to="/about" className="home-text-link">
              {t('home.storyCta')}
            </Link>
          </div>
        </div>
      </section>

      <section className="home-motifs" aria-labelledby="home-motifs-title">
        <div className="home-container">
          <header className="home-section-head">
            <div>
              <p className="home-kicker">{t('home.motifKicker')}</p>
              <h2 id="home-motifs-title">{t('home.motifHeading')}</h2>
            </div>
            <p className="home-section-head__body">{t('home.motifBody')}</p>
          </header>

          <div className="home-motif-layout">
            <figure className="home-motif-feature">
              <div className="home-motif-feature__media">
                <img
                  src={parangImg}
                  alt={t('home.categoryTulisAlt')}
                  loading="lazy"
                />
              </div>
              <figcaption>{t('home.parang')}</figcaption>
            </figure>

            <ul className="home-motif-list">
              {motifs.map((motif) => (
                <li key={motif.title} className="home-motif-item">
                  <h3>{motif.title}</h3>
                  <p>{motif.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="home-products" id="koleksi" aria-labelledby="home-products-title">
        <div className="home-container">
          <header className="home-section-head home-section-head--split">
            <div>
              <p className="home-kicker">{t('home.productsKicker')}</p>
              <h2 id="home-products-title">{t('home.productsHeading')}</h2>
              <p className="home-section-head__body">{t('home.productsBody')}</p>
            </div>
            <Link to="/shop" className="home-text-link">
              {t('home.productsCta')}
            </Link>
          </header>

          {renderCollection(featuredProducts)}
        </div>
      </section>

      {quickViewProduct && (
        <QuickView product={quickViewProduct} onClose={closeQuickView} />
      )}
    </div>
  );
};

export default Home;
