import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button/Button';
import model1 from '../../assets/images/model-1.png';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-background">
          <div className="about-hero-overlay"></div>
        </div>
        <div className="container">
          <div className="about-hero-content">
            <h1>Our Story</h1>
            <p className="about-hero-subtitle">
              Preserving Indonesian Heritage Through Timeless Batik Craftsmanship
            </p>
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <section className="about-section">
        <div className="container">
          <div className="about-content-grid">
            <div className="about-text">
              <h2>Janoer Koening</h2>
              <h3 className="about-tagline">Where Tradition Meets Modern Elegance</h3>
              <p>
                Founded with a deep reverence for Indonesian cultural heritage, Janoer Koening 
                is more than a batik brand—it's a movement to preserve and celebrate one of 
                the world's most exquisite textile arts.
              </p>
              <p>
                Our name combines "Janoer" (a tribute to artisan craftsmanship) with "Koening" 
                (Dutch for "king"), reflecting our commitment to royal-quality batik that honors 
                centuries-old traditions while embracing contemporary aesthetics.
              </p>
              <p>
                Each piece in our collection tells a story—of skilled artisans who dedicate 
                months to perfecting a single cloth, of ancient patterns carrying philosophical 
                meanings, and of a cultural legacy recognized by UNESCO as a Masterpiece of 
                Oral and Intangible Heritage of Humanity.
              </p>
            </div>
            <div className="about-image">
              <img src={model1} alt="Batik craftsmanship" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="about-section mission-vision">
        <div className="container">
          <div className="mission-vision-grid">
            <div className="mission-card">
              <div className="mission-icon">🎨</div>
              <h3>Our Mission</h3>
              <p>
                To preserve and promote authentic Indonesian batik craftsmanship by connecting 
                master artisans with discerning collectors worldwide, ensuring this sacred art 
                form thrives for generations to come.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">✨</div>
              <h3>Our Vision</h3>
              <p>
                To become the global standard for premium batik, where every piece represents 
                the pinnacle of quality, authenticity, and cultural significance—making Indonesian 
                heritage accessible to the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Craftsmanship Heritage */}
      <section className="about-section craftsmanship-section">
        <div className="container">
          <div className="section-header">
            <h2>The Art of Batik</h2>
            <p>Three distinct techniques, each a masterpiece of dedication</p>
          </div>
          <div className="craftsmanship-grid">
            <div className="craftsmanship-item">
              <div className="craftsmanship-number">01</div>
              <h4>Batik Tulis</h4>
              <p className="craftsmanship-subtitle">Hand-Drawn Excellence</p>
              <p>
                The most prestigious form, where artisans use a canting (small copper reservoir) 
                to hand-draw intricate patterns with liquid wax. A single cloth can require 
                2-3 months of meticulous work, with every stroke carrying the artist's spirit.
              </p>
            </div>
            <div className="craftsmanship-item">
              <div className="craftsmanship-number">02</div>
              <h4>Batik Cap</h4>
              <p className="craftsmanship-subtitle">Stamped Precision</p>
              <p>
                Using hand-carved copper blocks (cap), artisans stamp patterns with hot wax. 
                This technique combines efficiency with artistry, maintaining high quality 
                while allowing for more accessible pricing.
              </p>
            </div>
            <div className="craftsmanship-item">
              <div className="craftsmanship-number">03</div>
              <h4>Batik Printing</h4>
              <p className="craftsmanship-subtitle">Contemporary Accessibility</p>
              <p>
                Modern printing techniques make batik's beauty available for everyday wear. 
                While less labor-intensive, each design still honors traditional patterns and 
                color palettes rooted in centuries of Indonesian culture.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-section values-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Values</h2>
            <p>Principles that guide every thread we weave</p>
          </div>
          <div className="values-grid">
            <div className="value-item">
              <h4>Authenticity</h4>
              <p>Every piece is genuine, sourced directly from master artisans and certified for quality</p>
            </div>
            <div className="value-item">
              <h4>Heritage</h4>
              <p>We honor traditional techniques passed down through generations of Indonesian craftspeople</p>
            </div>
            <div className="value-item">
              <h4>Quality</h4>
              <p>Premium materials, meticulous craftsmanship, and rigorous quality control standards</p>
            </div>
            <div className="value-item">
              <h4>Sustainability</h4>
              <p>Natural dyes, eco-friendly processes, and fair compensation for our artisan partners</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="container">
          <div className="about-cta-content">
            <h2>Experience the Legacy</h2>
            <p>Discover our curated collection of authentic Indonesian batik</p>
            <Link to="/shop">
              <Button variant="primary" size="large">
                Explore Collection
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
