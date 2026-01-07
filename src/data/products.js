/**
 * Batik Product Data for Janoer Koening
 * 
 * Each product includes:
 * - Authentic Indonesian batik patterns
 * - Premium pricing (Rp 500K - 2M range)
 * - Cultural heritage descriptions
 * - Multiple variants (sizes, colors)
 */

// Import actual product images
import parangImg from '../assets/images/motif-parang.jpg';
import kawungImg from '../assets/images/motif-kawung.jpg';
import megaMendungImg from '../assets/images/batik-motif-mega-mendung.jpg';
import sekarJagadImg from '../assets/images/motif-sekar-jagad.jpg';
import sidomuktiImg from '../assets/images/batik-sidomukti.jpg';
import soganImg from '../assets/images/motif-sogan.jpg';
import kontemporerImg from '../assets/images/motif-kontemporer.jpg';
import model1 from '../assets/images/model-1.png';
import model2 from '../assets/images/model-2.png';
import model3 from '../assets/images/model-3.png';

export const batikCategories = {
  TULIS: 'Batik Tulis', // Hand-drawn with canting (most premium)
  CAP: 'Batik Cap', // Stamped with copper blocks
  PRINTING: 'Batik Printing', // Modern printed technique
};

export const batikPatterns = {
  PARANG: 'Parang',
  KAWUNG: 'Kawung',
  MEGA_MENDUNG: 'Mega Mendung',
  SEKAR_JAGAD: 'Sekar Jagad',
  TRUNTUM: 'Truntum',
  SIDOMUKTI: 'Sidomukti',
  SOGAN: 'Sogan',
  LERENG: 'Lereng',
};

const products = [
  // BATIK TULIS COLLECTION (Premium Handcrafted)
  {
    id: 1,
    name: 'Batik Tulis Parang Rusak Barong',
    slug: 'batik-tulis-parang-rusak-barong',
    price: 1850000,
    category: batikCategories.TULIS,
    pattern: batikPatterns.PARANG,
    images: [
      parangImg,
      model1,
      model2,
    ],
    description: 'Batik tulis klasik dengan motif Parang Rusak Barong yang megah. Dibuat dengan teknik canting tradisional oleh pengrajin Solo, setiap garis menunjukkan keahlian tinggi dan kesabaran luar biasa.',
    heritage: 'Motif Parang melambangkan kekuatan, keberanian, dan kepemimpinan. Dulunya hanya boleh dikenakan oleh keluarga kerajaan Jawa sebagai simbol status bangsawan.',
    details: 'Proses pembuatan 3-4 bulan, pewarnaan alami menggunakan indigo dan soga.',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Navy Blue', 'Dark Brown'],
    stock: 8,
    featured: true,
    bestseller: true,
  },
  {
    id: 2,
    name: 'Batik Tulis Kawung Klasik',
    slug: 'batik-tulis-kawung-klasik',
    price: 1650000,
    category: batikCategories.TULIS,
    pattern: batikPatterns.KAWUNG,
    images: [
      kawungImg,
      model2,
      model3,
    ],
    description: 'Motif Kawung geometris yang sempurna, menampilkan lingkaran simetris yang menghipnotis. Batik tulis premium dari Yogyakarta dengan pewarnaan soga alami.',
    heritage: 'Kawung terinspirasi dari buah aren atau kolang-kaling. Motif ini melambangkan kesucian, keadilan, dan umur panjang. Motif tertua dalam sejarah batik Indonesia.',
    details: 'Kain katun prima, warna coklat soga khas Jawa, proses 2-3 bulan.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Soga Brown', 'Black'],
    stock: 12,
    featured: false,
    bestseller: true,
  },
  {
    id: 3,
    name: 'Batik Tulis Mega Mendung Cirebon',
    slug: 'batik-tulis-mega-mendung-cirebon',
    price: 1950000,
    category: batikCategories.TULIS,
    pattern: batikPatterns.MEGA_MENDUNG,
    images: [
      megaMendungImg,
      model1,
      model3,
    ],
    description: 'Batik Cirebon dengan motif awan berlapis yang ikonik. Gradasi warna biru yang memukau mencerminkan pengaruh Tiongkok pada batik pesisir Indonesia.',
    heritage: 'Mega Mendung melambangkan pemberi kehidupan dan kesejukan. Motif ini memadukan estetika Jawa dan Tiongkok, menciptakan identitas batik pesisir yang unik.',
    details: 'Pewarnaan gradasi manual 7-9 warna, kain sutra premium, proses 4 bulan.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Indigo Blue', 'Red Maroon'],
    stock: 5,
    featured: true,
    bestseller: false,
  },
  {
    id: 4,
    name: 'Batik Tulis Truntum Kasih Sayang',
    slug: 'batik-tulis-truntum-kasih-sayang',
    price: 1550000,
    category: batikCategories.TULIS,
    pattern: batikPatterns.TRUNTUM,
    images: [
      soganImg,
      model2,
      model1,
    ],
    description: 'Motif bunga kecil yang tumbuh kembali dengan indah, melambangkan cinta yang bersemi. Batik tulis halus dengan detail mikroskopis dari Surakarta.',
    heritage: 'Truntum diciptakan oleh Kanjeng Ratu Kencana untuk Raja Paku Buwono III sebagai simbol cinta yang tumbuh kembali. Sering dikenakan dalam upacara pernikahan.',
    details: 'Detail ultra-halus, pewarnaan natural soga, waktu pengerjaan 3 bulan.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Cream Gold', 'Soft Purple'],
    stock: 15,
    featured: false,
    bestseller: false,
  },

  // BATIK CAP COLLECTION (Premium Stamped)
  {
    id: 5,
    name: 'Batik Cap Parang Centong Modern',
    slug: 'batik-cap-parang-centong-modern',
    price: 850000,
    category: batikCategories.CAP,
    pattern: batikPatterns.PARANG,
    images: [
      parangImg,
      model3,
      model1,
    ],
    description: 'Motif Parang dengan interpretasi kontemporer, dibuat menggunakan cap tembaga berkualitas tinggi. Presisi sempurna dengan karakter handmade.',
    heritage: 'Parang Centong adalah varian Parang yang lebih bebas digunakan masyarakat umum. Motif ini melambangkan kekuatan yang terkendali dan kebijaksanaan.',
    details: 'Pewarnaan reaktif modern, kain katun Primisima, hasil konsisten.',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Navy', 'Brown', 'Black'],
    stock: 25,
    featured: false,
    bestseller: true,
  },
  {
    id: 6,
    name: 'Batik Cap Kawung Beton',
    slug: 'batik-cap-kawung-beton',
    price: 780000,
    category: batikCategories.CAP,
    pattern: batikPatterns.KAWUNG,
    images: [
      kawungImg,
      model1,
      model2,
    ],
    description: 'Kawung geometris presisi tinggi dengan cap tembaga warisan. Perpaduan sempurna antara tradisi dan efisiensi produksi modern.',
    heritage: 'Kawung Beton adalah variasi dengan garis tegas dan kuat, melambangkan ketahanan dan fondasi yang kokoh dalam kehidupan.',
    details: 'Cap tembaga antik 50+ tahun, pewarnaan soga kombinasi, kain katun premium.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Dark Soga', 'Maroon'],
    stock: 30,
    featured: false,
    bestseller: false,
  },
  {
    id: 7,
    name: 'Batik Cap Sekar Jagad Nusantara',
    slug: 'batik-cap-sekar-jagad-nusantara',
    price: 920000,
    category: batikCategories.CAP,
    pattern: batikPatterns.SEKAR_JAGAD,
    images: [
      sekarJagadImg,
      model2,
      model3,
    ],
    description: 'Motif "Bunga Dunia" yang menggabungkan berbagai ornamen dalam satu kain. Kompleksitas visual yang memukau dengan warna-warna cerah khas batik pesisir.',
    heritage: 'Sekar Jagad berarti "Bunga Dunia", melambangkan keberagaman dan keindahan dunia. Motif ini mencerminkan toleransi dan apresiasi terhadap perbedaan.',
    details: 'Multi-color stamping, 5-7 warna, kain katun lembut, detail rumit.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Multi Red', 'Multi Blue'],
    stock: 18,
    featured: true,
    bestseller: false,
  },
  {
    id: 8,
    name: 'Batik Cap Sidomukti Pengantin',
    slug: 'batik-cap-sidomukti-pengantin',
    price: 950000,
    category: batikCategories.CAP,
    pattern: batikPatterns.SIDOMUKTI,
    images: [
      sidomuktiImg,
      model1,
      model3,
    ],
    description: 'Batik penuh makna untuk momen sakral. Motif Sidomukti dengan ornamen rumit melambangkan harapan kemakmuran dan kehidupan yang sempurna.',
    heritage: 'Sidomukti (sido = jadi, mukti = makmur) adalah motif wajib dalam pernikahan Jawa. Dipercaya membawa berkah kemakmuran bagi pengantin baru.',
    details: 'Pewarnaan premium multi-tahap, detail isen-isen tradisional, kain eksklusif.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Gold Cream', 'Red Gold'],
    stock: 20,
    featured: false,
    bestseller: true,
  },

  // BATIK PRINTING COLLECTION (Contemporary)
  {
    id: 9,
    name: 'Batik Printing Parang Modern Slim',
    slug: 'batik-printing-parang-modern-slim',
    price: 485000,
    category: batikCategories.PRINTING,
    pattern: batikPatterns.PARANG,
    images: [
      kontemporerImg,
      model1,
      model2,
    ],
    description: 'Batik printing modern dengan motif Parang yang disederhanakan untuk gaya kasual kontemporer. Nyaman untuk penggunaan sehari-hari dengan sentuhan heritage.',
    heritage: 'Adaptasi modern dari motif klasik Parang, mempertahankan esensi filosofis sambil menghadirkan kenyamanan dan aksesibilitas untuk generasi muda.',
    details: 'Digital printing HD, kain katun stretch, warna tahan lama, easy care.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Navy', 'Black', 'Maroon', 'Grey'],
    stock: 50,
    featured: false,
    bestseller: true,
  },
  {
    id: 10,
    name: 'Batik Printing Kawung Contemporary',
    slug: 'batik-printing-kawung-contemporary',
    price: 425000,
    category: batikCategories.PRINTING,
    pattern: batikPatterns.KAWUNG,
    images: [
      kawungImg,
      model3,
      model2,
    ],
    description: 'Interpretasi fresh motif Kawung dengan skema warna modern. Perfect untuk profesional muda yang ingin tampil berkelas dengan budaya.',
    heritage: 'Kawung modern yang tetap menghormati filosofi kesempurnaan dan keadilan, dikemas dalam estetika yang relevan dengan lifestyle urban.',
    details: 'Reactive printing, anti-kusut, breathable fabric, machine washable.',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Light Blue', 'Mint Green', 'Dusty Pink'],
    stock: 60,
    featured: false,
    bestseller: false,
  },
  {
    id: 11,
    name: 'Batik Printing Mega Mendung Rainbow',
    slug: 'batik-printing-mega-mendung-rainbow',
    price: 520000,
    category: batikCategories.PRINTING,
    pattern: batikPatterns.MEGA_MENDUNG,
    images: [
      megaMendungImg,
      model2,
      model1,
    ],
    description: 'Mega Mendung dengan gradasi warna pelangi yang ceria. Statement piece yang sempurna untuk tampilan bold dan percaya diri.',
    heritage: 'Mega Mendung dengan interpretasi warna kontemporer, mempertahankan bentuk awan berlapis iconic sambil mengeksplorasi palet warna modern.',
    details: 'Sublimation print, warna vibrant tahan luntur, kain premium soft-touch.',
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Rainbow Blue', 'Rainbow Pink'],
    stock: 35,
    featured: true,
    bestseller: false,
  },
  {
    id: 12,
    name: 'Batik Printing Lereng Minimalis',
    slug: 'batik-printing-lereng-minimalis',
    price: 450000,
    category: batikCategories.PRINTING,
    pattern: batikPatterns.LERENG,
    images: [
      kontemporerImg,
      model3,
      model1,
    ],
    description: 'Motif garis diagonal minimalis yang elegan. Batik modern untuk mereka yang menyukai simplicity dengan karakter kuat.',
    heritage: 'Lereng melambangkan jalan kehidupan yang tidak selalu lurus. Garis diagonal mengajarkan fleksibilitas dan adaptasi dalam menghadapi tantangan.',
    details: 'Eco-friendly water-based ink, kain bamboo blend, sustainable production.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White Black', 'Beige Brown', 'Navy White'],
    stock: 45,
    featured: false,
    bestseller: true,
  },
  {
    id: 13,
    name: 'Batik Printing Sogan Contemporary',
    slug: 'batik-printing-sogan-contemporary',
    price: 495000,
    category: batikCategories.PRINTING,
    pattern: batikPatterns.SOGAN,
    images: [
      soganImg,
      model1,
      model2,
    ],
    description: 'Warna soga klasik dalam format modern. Keelokan coklat natural batik Jawa yang timeless, cocok untuk segala suasana.',
    heritage: 'Sogan adalah warna khas batik Jawa dari kulit kayu tingi dan indigo. Warna earth tone ini melambangkan kesederhanaan dan kearifan lokal.',
    details: 'Natural color tone print, comfortable viscose blend, elegant drape.',
    sizes: ['M', 'L', 'XL'],
    colors: ['Classic Soga', 'Dark Soga'],
    stock: 40,
    featured: false,
    bestseller: false,
  },
  {
    id: 14,
    name: 'Batik Printing Mix Motif Urban',
    slug: 'batik-printing-mix-motif-urban',
    price: 535000,
    category: batikCategories.PRINTING,
    pattern: batikPatterns.SEKAR_JAGAD,
    images: [
      'https://placehold.co/400x500/1B3A52/D4AF37?text=Urban+Mix',
      'https://placehold.co/400x500/3A506B/D4AF37?text=Fusion+Style',
      'https://placehold.co/400x500/5C4033/D4AF37?text=Contemporary',
    ],
    description: 'Fusion berbagai motif klasik dalam komposisi urban contemporary. Batik untuk jiwa muda yang berani eksplorasi dengan tetap menghormati akar budaya.',
    heritage: 'Perpaduan berbagai motif melambangkan Indonesia sebagai negara yang kaya dengan keberagaman. Unity in diversity dalam selembar kain.',
    details: 'HD digital print, wrinkle-free fabric, modern fit, travel-friendly.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Urban Black', 'Urban Navy', 'Urban Grey'],
    stock: 55,
    featured: true,
    bestseller: true,
  },
];

// Helper function to format price to Indonesian Rupiah
export const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

// Helper function to get products by category
export const getProductsByCategory = (category) => {
  return products.filter(product => product.category === category);
};

// Helper function to get featured products
export const getFeaturedProducts = () => {
  return products.filter(product => product.featured);
};

// Helper function to get bestseller products
export const getBestsellerProducts = () => {
  return products.filter(product => product.bestseller);
};

// Helper function to get product by ID
export const getProductById = (id) => {
  return products.find(product => product.id === parseInt(id));
};

// Helper function to get product by slug
export const getProductBySlug = (slug) => {
  return products.find(product => product.slug === slug);
};

// Helper function to get related products (same pattern or category)
export const getRelatedProducts = (productId, limit = 4) => {
  const product = getProductById(productId);
  if (!product) return [];
  
  return products
    .filter(p => 
      p.id !== productId && 
      (p.pattern === product.pattern || p.category === product.category)
    )
    .slice(0, limit);
};

export default products;
