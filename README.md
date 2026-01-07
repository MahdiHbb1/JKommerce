# Janoer Koening Batik E-Commerce

A modern, full-featured e-commerce platform for authentic Indonesian batik products built with React, Vite, and Tailwind CSS.

![Batik E-Commerce](https://img.shields.io/badge/React-18.3.1-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.0-06B6D4) ![Vite](https://img.shields.io/badge/Vite-5.4.2-646CFF)

## 🌟 Features

### Core E-Commerce Functionality
- **Product Catalog**: Browse authentic batik products with detailed information
- **Advanced Filtering**: Filter by categories, patterns, and price range
- **Smart Search**: Search products by name, category, pattern, or description
- **Sorting Options**: Sort by featured, newest, price, or name
- **Pagination**: Customizable items per page (8/16/24/32)
- **Shopping Cart**: Add, remove, update quantities with size/color variants
- **Wishlist**: Save favorite products for later
- **Order Management**: Complete checkout process with order tracking

### Advanced Features
- **Quick View Modal**: Preview products without leaving the page
- **Recently Viewed**: Track last 8 viewed products
- **Toast Notifications**: Real-time feedback for user actions
- **Skeleton Loaders**: Smooth loading states for better UX
- **Product Reviews**: Customer reviews and ratings system
- **Related Products**: Smart product recommendations
- **Responsive Design**: Mobile-first, fully responsive layout

### User Experience
- **Newsletter Subscription**: Email signup for updates
- **Social Media Integration**: Share products on social platforms
- **Contact Forms**: Customer support and inquiries
- **About Page**: Brand story and heritage information
- **Product Gallery**: Multiple image views with thumbnails
- **Size & Color Selection**: Product variant options

## 🚀 Tech Stack

- **Frontend Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.0
- **Routing**: React Router DOM 6.28.0
- **State Management**: React Context API
- **Storage**: localStorage for cart, wishlist, and preferences
- **Icons**: Heroicons (SVG)
- **Form Validation**: PropTypes

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/MahdiHbb1/JKommerce.git
   cd JKommerce/batik-ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🏗️ Project Structure

```
batik-ecommerce/
├── src/
│   ├── assets/
│   │   └── images/          # Product and UI images
│   ├── components/
│   │   ├── Button/          # Reusable button components
│   │   ├── Layout/          # Header, Footer, Layout
│   │   ├── ProductCard/     # Product display card
│   │   ├── ProductGrid/     # Product grid layout
│   │   ├── ProductFilter/   # Advanced filtering sidebar
│   │   ├── QuickView/       # Quick view modal
│   │   ├── Toast/           # Toast notification system
│   │   ├── Skeleton/        # Loading skeleton components
│   │   ├── Pagination/      # Pagination controls
│   │   └── ui/              # UI component library
│   ├── context/
│   │   ├── CartContext.jsx           # Shopping cart state
│   │   ├── WishlistContext.jsx       # Wishlist state
│   │   ├── OrderContext.jsx          # Order management
│   │   ├── ToastContext.jsx          # Toast notifications
│   │   └── RecentlyViewedContext.jsx # Recently viewed tracking
│   ├── pages/
│   │   ├── Home/            # Landing page
│   │   ├── Shop/            # Product catalog
│   │   ├── ProductDetail/   # Individual product page
│   │   ├── Cart/            # Shopping cart page
│   │   ├── Checkout/        # Checkout process
│   │   └── About/           # About page
│   ├── data/
│   │   └── products.js      # Product data and utilities
│   ├── App.jsx              # Main app component
│   └── main.jsx             # App entry point
├── public/                  # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
└── postcss.config.js       # PostCSS configuration
```

## 🎨 Key Components

### Product Filter
Advanced filtering system with:
- Category checkboxes
- Pattern selection
- Price range inputs
- Active filter counts
- Clear filters button

### Toast Notifications
Real-time user feedback:
- Success messages (green)
- Error alerts (red)
- Info messages (blue)
- Warning notifications (yellow)
- Auto-dismiss with configurable duration

### Pagination
Smart pagination with:
- Page number buttons
- Ellipsis for large page counts
- Previous/Next navigation
- Items per page selector
- Results count display

### Recently Viewed
Automatic product tracking:
- Last 8 viewed products
- localStorage persistence
- Excludes current product
- Quick navigation

## 🛒 E-Commerce Features

### Shopping Cart
- Add products with variants (size, color)
- Update quantities
- Remove items
- Calculate subtotal, tax, shipping
- localStorage persistence
- Cart count badge

### Wishlist
- Save favorite products
- Toggle wishlist items
- Persistent across sessions
- Quick access from header

### Checkout Process
1. Cart review
2. Customer information
3. Shipping details
4. Payment method
5. Order confirmation

## 🎯 Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🌈 Color Palette

The project uses a custom batik-inspired color scheme:

- **Orange**: `#D2691E` (Primary brand color)
- **Brown**: `#8B4513` (Secondary)
- **Blue**: `#4682B4` (Accent)
- **Cream**: `#F5F5DC` (Background)

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🔧 Configuration

### Tailwind CSS
Custom configuration in `tailwind.config.js`:
- Custom color palette
- Extended spacing
- Custom animations
- Custom fonts

### Vite
Fast build tool with:
- Hot Module Replacement (HMR)
- Optimized builds
- React Fast Refresh
- ESBuild for speed

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The optimized production build will be in the `dist/` folder.

### Deploy Options

- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Drag and drop `dist` folder
- **GitHub Pages**: Use `gh-pages` branch
- **Custom Server**: Upload `dist` folder contents

## 📄 License

This project is created for Janoer Koening Batik.

## 👥 Author

**Mahdi Hbb**
- GitHub: [@MahdiHbb1](https://github.com/MahdiHbb1)

## 🙏 Acknowledgments

- Indonesian batik heritage and craftsmanship
- React and Vite communities
- Tailwind CSS team
- Open source contributors

## 📞 Support

For support and inquiries:
- Email: contact@janoerkoening.com
- Website: [Janoer Koening Batik](#)

---

Built with ❤️ for authentic Indonesian batik culture
