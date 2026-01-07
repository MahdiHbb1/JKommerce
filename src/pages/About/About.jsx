import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../../components/Button/Button';
import model1 from '../../assets/images/model-1.png';
import './About.css';

const About = () => {
  const { t } = useTranslation();
  
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-background">
          <div className="about-hero-overlay"></div>
        </div>
        <div className="container">
          <div className="about-hero-content">
            <h1>{t('about.ourStory')}</h1>
            <p className="about-hero-subtitle">
              Melestarikan Warisan Indonesia melalui Keahlian Batik yang Abadi
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
              <h3 className="about-tagline">Di Mana Tradisi Bertemu Keanggunan Modern</h3>
              <p>
                Didirikan dengan penghormatan mendalam terhadap warisan budaya Indonesia, Janoer Koening
                lebih dari sekadar merek batik—ini adalah gerakan untuk melestarikan dan merayakan salah satu
                seni tekstil paling menawan di dunia.
              </p>
              <p>
                Nama kami menggabungkan "Janoer" (penghormatan kepada keahlian pengrajin) dengan "Koening"
                (bahasa Belanda untuk "raja"), mencerminkan komitmen kami terhadap batik berkualitas kerajaan yang menghormati
                tradisi berabad-abad sambil merangkul estetika kontemporer.
              </p>
              <p>
                Setiap karya dalam koleksi kami menceritakan sebuah kisah—tentang pengrajin terampil yang mendedikasikan
                berbulan-bulan untuk menyempurnakan satu kain, tentang pola kuno yang membawa makna
                filosofis, dan tentang warisan budaya yang diakui oleh UNESCO sebagai Mahakarya
                Warisan Lisan dan Takbenda Kemanusiaan.
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
              <h3>{t('about.mission')}</h3>
              <p>
                Melestarikan dan mempromosikan keahlian batik Indonesia autentik dengan menghubungkan
                pengrajin master dengan kolektor yang berpengetahuan di seluruh dunia, memastikan bentuk seni suci ini
                berkembang untuk generasi mendatang.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">✨</div>
              <h3>{t('about.vision')}</h3>
              <p>
                Menjadi standar global untuk batik premium, di mana setiap karya mewakili
                puncak kualitas, keaslian, dan signifikansi budaya—membuat warisan Indonesia
                dapat diakses oleh dunia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Craftsmanship Heritage */}
      <section className="about-section craftsmanship-section">
        <div className="container">
          <div className="section-header">
            <h2>Seni Batik</h2>
            <p>Tiga teknik berbeda, masing-masing adalah mahakarya dedikasi</p>
          </div>
          <div className="craftsmanship-grid">
            <div className="craftsmanship-item">
              <div className="craftsmanship-number">01</div>
              <h4>Batik Tulis</h4>
              <p className="craftsmanship-subtitle">Keunggulan Gambar Tangan</p>
              <p>
                Bentuk paling bergengsi, di mana pengrajin menggunakan canting (wadah tembaga kecil)
                untuk menggambar pola rumit dengan lilin cair. Satu kain dapat memerlukan
                2-3 bulan kerja teliti, dengan setiap goresan membawa semangat sang seniman.
              </p>
            </div>
            <div className="craftsmanship-item">
              <div className="craftsmanship-number">02</div>
              <h4>Batik Cap</h4>
              <p className="craftsmanship-subtitle">Presisi Stempel</p>
              <p>
                Menggunakan blok tembaga yang diukir tangan (cap), pengrajin mencap pola dengan lilin panas.
                Teknik ini menggabungkan efisiensi dengan seni, mempertahankan kualitas tinggi
                sambil memungkinkan harga yang lebih terjangkau.
              </p>
            </div>
            <div className="craftsmanship-item">
              <div className="craftsmanship-number">03</div>
              <h4>Batik Printing</h4>
              <p className="craftsmanship-subtitle">Aksesibilitas Kontemporer</p>
              <p>
                Teknik pencetakan modern membuat keindahan batik tersedia untuk pakaian sehari-hari.
                Meskipun kurang padat karya, setiap desain masih menghormati pola tradisional dan
                palet warna yang berakar pada berabad-abad budaya Indonesia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-section values-section">
        <div className="container">
          <div className="section-header">
            <h2>Nilai-Nilai Kami</h2>
            <p>Prinsip yang memandu setiap benang yang kami tenun</p>
          </div>
          <div className="values-grid">
            <div className="value-item">
              <h4>Keaslian</h4>
              <p>Setiap karya adalah asli, bersumber langsung dari pengrajin master dan bersertifikat kualitas</p>
            </div>
            <div className="value-item">
              <h4>Warisan</h4>
              <p>Kami menghormati teknik tradisional yang diwariskan melalui generasi pengrajin Indonesia</p>
            </div>
            <div className="value-item">
              <h4>Kualitas</h4>
              <p>Material premium, keahlian yang teliti, dan standar kontrol kualitas yang ketat</p>
            </div>
            <div className="value-item">
              <h4>Keberlanjutan</h4>
              <p>Pewarna alami, proses ramah lingkungan, dan kompensasi yang adil untuk mitra pengrajin kami</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="container">
          <div className="about-cta-content">
            <h2>Rasakan Warisan</h2>
            <p>Temukan koleksi batik Indonesia autentik kami yang dikurasi</p>
            <Link to="/shop">
              <Button variant="primary" size="large">
                {t('home.exploreCollection')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
