import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTranslation } from '../../hooks/useTranslation';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import QuickView from '../../components/QuickView/QuickView';
import Button from '../../components/Button/Button';
import { getFeaturedProducts, getBestsellerProducts } from '../../data/products';
import parangImg from '../../assets/images/motif-parang.jpg';
import kawungImg from '../../assets/images/motif-kawung.jpg';
import kontemporerImg from '../../assets/images/motif-kontemporer.jpg';
import megaMendungImg from '../../assets/images/batik-motif-mega-mendung.jpg';
import sekarJagadImg from '../../assets/images/motif-sekar-jagad.jpg';
import './Home.css';

const Home = () => {
  const { addToCart } = useCart();
  const { t } = useTranslation();
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  
  const featuredProducts = getFeaturedProducts().slice(0, 4);
  const bestsellerProducts = getBestsellerProducts().slice(0, 4);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    alert(`✓ "${product.name}" ${t('notifications.addedToCart')}`);
  };

  const handleQuickView = (product) => {
    setQuickViewProduct(product);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <span className="hero-label">{t('home.heroLabel')}</span>
            <h1 className="hero-title">Janoer Koening</h1>
            <p className="hero-tagline">{t('home.heroTagline')}</p>
            <p className="hero-description">
              {t('home.heroDescription')}
            </p>
            <div className="hero-actions">
              <Link to="/shop">
                <Button variant="primary" size="large">
                  {t('home.exploreCollection')}
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="large">
                  {t('home.ourStory')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Showcase */}
      <section className="category-showcase">
        <div className="container">
          <div className="section-header">
            <h2>{t('home.exploreTechnique')}</h2>
            <p>{t('home.techniqueDescription')}</p>
          </div>
          <div className="category-grid">
            <Link to="/shop?category=Batik Tulis" className="category-card">
              <div className="category-image">
                <img src={parangImg} alt="Batik Tulis" />
                <div className="category-overlay">
                  <span className="category-badge">{t('home.premium')}</span>
                </div>
              </div>
              <div className="category-info">
                <h3>{t('home.batikTulis')}</h3>
                <p>{t('home.batikTulisDesc')}</p>
                <span className="category-link">{t('home.viewCollection')} →</span>
              </div>
            </Link>
            <Link to="/shop?category=Batik Cap" className="category-card">
              <div className="category-image">
                <img src={kawungImg} alt="Batik Cap" />
                <div className="category-overlay"></div>
              </div>
              <div className="category-info">
                <h3>{t('home.batikCap')}</h3>
                <p>{t('home.batikCapDesc')}</p>
                <span className="category-link">{t('home.viewCollection')} →</span>
              </div>
            </Link>
            <Link to="/shop?category=Batik Printing" className="category-card">
              <div className="category-image">
                <img src={kontemporerImg} alt="Batik Printing" />
                <div className="category-overlay"></div>
              </div>
              <div className="category-info">
                <h3>{t('home.batikPrinting')}</h3>
                <p>{t('home.batikPrintingDesc')}</p>
                <span className="category-link">{t('home.viewCollection')} →</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Pattern Heritage */}
      <section className="pattern-heritage">
        <div className="container">
          <div className="section-header">
            <h2>{t('home.traditionalPatterns')}</h2>
            <p>{t('home.patternsDescription')}</p>
          </div>
          <div className="pattern-grid">
            <div className="pattern-item">
              <div className="pattern-image">
                <img src={parangImg} alt="Parang Pattern" />
              </div>
              <h4>{t('home.parang')}</h4>
              <p>{t('home.parangDesc')}</p>
            </div>
            <div className="pattern-item">
              <div className="pattern-image">
                <img src={kawungImg} alt="Kawung Pattern" />
              </div>
              <h4>{t('home.kawung')}</h4>
              <p>{t('home.kawungDesc')}</p>
            </div>
            <div className="pattern-item">
              <div className="pattern-image">
                <img src={megaMendungImg} alt="Mega Mendung Pattern" />
              </div>
              <h4>{t('home.megaMendung')}</h4>
              <p>{t('home.megaMendungDesc')}</p>
            </div>
            <div className="pattern-item">
              <div className="pattern-image">
                <img src={sekarJagadImg} alt="Sekar Jagad Pattern" />
              </div>
              <h4>{t('home.sekarJagad')}</h4>
              <p>{t('home.sekarJagadDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-products">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{t('home.featuredCollection')}</h2>
              <p className="section-subtitle">{t('home.featuredSubtitle')}</p>
            </div>
            <Link to="/shop">
              <Button variant="outline">{t('common.viewAll')}</Button>
            </Link>
          </div>
          <ProductGrid
            products={featuredProducts}
            onAddToCart={handleAddToCart}
            onQuickView={handleQuickView}
          />
        </div>
      </section>

      {/* Bestsellers */}
      <section className="section-products section-bestsellers">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>{t('home.bestsellers')}</h2>
              <p className="section-subtitle">{t('home.bestsellersSubtitle')}</p>
            </div>
            <Link to="/shop">
              <Button variant="outline">{t('common.viewAll')}</Button>
            </Link>
          </div>
          <ProductGrid
            products={bestsellerProducts}
            onAddToCart={handleAddToCart}
            onQuickView={handleQuickView}
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>{t('home.testimonials')}</h2>
            <p>{t('home.testimonialsSubtitle')}</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">
                {t('home.testimonial1')}
              </p>
              <div className="testimonial-author">
                <strong>Sarah Wijaya</strong>
                <span>Jakarta</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">
                {t('home.testimonial2')}
              </p>
              <div className="testimonial-author">
                <strong>Michael Hartono</strong>
                <span>Surabaya</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">
                {t('home.testimonial3')}
              </p>
              <div className="testimonial-author">
                <strong>Dewi Kusuma</strong>
                <span>Bandung</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QuickView Modal */}
      {quickViewProduct && (
        <QuickView product={quickViewProduct} onClose={closeQuickView} />
      )}
    </div>
  );
};

export default Home;
