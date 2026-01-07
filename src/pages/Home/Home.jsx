import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
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
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  
  const featuredProducts = getFeaturedProducts().slice(0, 4);
  const bestsellerProducts = getBestsellerProducts().slice(0, 4);

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    alert(`✓ "${product.name}" has been added to your cart!`);
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
            <span className="hero-label">Premium Indonesian Craftsmanship</span>
            <h1 className="hero-title">Janoer Koening</h1>
            <p className="hero-tagline">Heritage Batik Redefined</p>
            <p className="hero-description">
              Discover authentic Indonesian batik craftsmanship with modern sophistication.
              Each piece tells a story of tradition, artistry, and cultural pride.
            </p>
            <div className="hero-actions">
              <Link to="/shop">
                <Button variant="primary" size="large">
                  Explore Collection
                </Button>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="large">
                  Our Story
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
            <h2>Explore by Technique</h2>
            <p>Each technique represents a unique heritage of Indonesian batik craftsmanship</p>
          </div>
          <div className="category-grid">
            <Link to="/shop?category=Batik Tulis" className="category-card">
              <div className="category-image">
                <img src={parangImg} alt="Batik Tulis" />
                <div className="category-overlay">
                  <span className="category-badge">Premium</span>
                </div>
              </div>
              <div className="category-info">
                <h3>Batik Tulis</h3>
                <p>Hand-drawn with canting, the most prestigious and time-intensive technique</p>
                <span className="category-link">View Collection →</span>
              </div>
            </Link>
            <Link to="/shop?category=Batik Cap" className="category-card">
              <div className="category-image">
                <img src={kawungImg} alt="Batik Cap" />
                <div className="category-overlay"></div>
              </div>
              <div className="category-info">
                <h3>Batik Cap</h3>
                <p>Stamped with copper blocks, combining tradition with refined efficiency</p>
                <span className="category-link">View Collection →</span>
              </div>
            </Link>
            <Link to="/shop?category=Batik Printing" className="category-card">
              <div className="category-image">
                <img src={kontemporerImg} alt="Batik Printing" />
                <div className="category-overlay"></div>
              </div>
              <div className="category-info">
                <h3>Batik Printing</h3>
                <p>Modern printed technique making batik accessible to contemporary lifestyle</p>
                <span className="category-link">View Collection →</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Pattern Heritage */}
      <section className="pattern-heritage">
        <div className="container">
          <div className="section-header">
            <h2>Traditional Patterns</h2>
            <p>Timeless motifs carrying deep philosophical meanings and cultural heritage</p>
          </div>
          <div className="pattern-grid">
            <div className="pattern-item">
              <div className="pattern-image">
                <img src={parangImg} alt="Parang Pattern" />
              </div>
              <h4>Parang</h4>
              <p>Symbol of strength and power, traditionally reserved for royalty</p>
            </div>
            <div className="pattern-item">
              <div className="pattern-image">
                <img src={kawungImg} alt="Kawung Pattern" />
              </div>
              <h4>Kawung</h4>
              <p>Represents longevity, perfection, and purity of heart</p>
            </div>
            <div className="pattern-item">
              <div className="pattern-image">
                <img src={megaMendungImg} alt="Mega Mendung Pattern" />
              </div>
              <h4>Mega Mendung</h4>
              <p>Cloud motif symbolizing patience and self-control</p>
            </div>
            <div className="pattern-item">
              <div className="pattern-image">
                <img src={sekarJagadImg} alt="Sekar Jagad Pattern" />
              </div>
              <h4>Sekar Jagad</h4>
              <p>"Flowers of the world" - unity in diversity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-products">
        <div className="container">
          <div className="section-header">
            <div>
              <h2>Featured Collection</h2>
              <p className="section-subtitle">Handpicked masterpieces from our artisans</p>
            </div>
            <Link to="/shop">
              <Button variant="outline">View All</Button>
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
              <h2>Bestsellers</h2>
              <p className="section-subtitle">Most loved by our customers</p>
            </div>
            <Link to="/shop">
              <Button variant="outline">View All</Button>
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
            <h2>What Our Customers Say</h2>
            <p>Trusted by batik enthusiasts and collectors worldwide</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">
                "The craftsmanship is extraordinary. Each piece is a work of art that tells a story. 
                I've received countless compliments wearing Janoer Koening batik."
              </p>
              <div className="testimonial-author">
                <strong>Sarah Wijaya</strong>
                <span>Jakarta</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">
                "As someone who appreciates traditional Indonesian art, I'm impressed by how 
                Janoer Koening preserves heritage while maintaining modern elegance."
              </p>
              <div className="testimonial-author">
                <strong>Michael Hartono</strong>
                <span>Surabaya</span>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">★★★★★</div>
              <p className="testimonial-text">
                "The quality is unmatched. I purchased a Batik Tulis piece and the detail is 
                breathtaking. Worth every rupiah. Excellent customer service too!"
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
