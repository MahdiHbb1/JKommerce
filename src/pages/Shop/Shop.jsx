import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../hooks/useTranslation';
import ProductGrid from '../../components/ProductGrid/ProductGrid';
import QuickView from '../../components/QuickView/QuickView';
import ProductFilter from '../../components/ProductFilter/ProductFilter';
import Pagination from '../../components/Pagination/Pagination';
import { ProductGridSkeleton } from '../../components/Skeleton/Skeleton';
import Button from '../../components/ui/Button';
import PageMeta from '../../components/Seo/PageMeta';
import { fetchProducts } from '../../lib/db/catalog';
import { toCardProduct } from '../../lib/db/presenters';

const EMPTY_FILTERS = {
  categories: [],
  patterns: [],
  priceRange: { min: null, max: null },
};

const Shop = () => {
  const { addToCart } = useCart();
  const { success } = useToast();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Catalog state
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Filter state
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Sort state
  const [sortBy, setSortBy] = useState('featured');

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchProducts();
      setProducts(data.map(toCardProduct));
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

  // Terapkan kategori dari tautan Home (?category=Batik Tulis).
  useEffect(() => {
    if (!categoryParam) {
      return;
    }
    setFilters((prev) =>
      prev.categories.includes(categoryParam)
        ? prev
        : { ...prev, categories: [...prev.categories, categoryParam] },
    );
  }, [categoryParam]);

  // Jumlah produk per kategori/motif untuk panel filter.
  const productStats = useMemo(() => {
    const categoryCount = {};
    const patternCount = {};
    for (const product of products) {
      if (product.category) {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
      }
      if (product.pattern) {
        patternCount[product.pattern] = (patternCount[product.pattern] || 0) + 1;
      }
    }
    return { categoryCount, patternCount };
  }, [products]);

  // Apply filters and sorting
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        (product.pattern || '').toLowerCase().includes(query) ||
        (product.description || '').toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product =>
        filters.categories.includes(product.category)
      );
    }

    // Apply pattern filter
    if (filters.patterns.length > 0) {
      filtered = filtered.filter(product =>
        filters.patterns.includes(product.pattern)
      );
    }

    // Apply price range filter
    if (filters.priceRange.min !== null && filters.priceRange.min !== '') {
      filtered = filtered.filter(product =>
        product.price >= Number(filters.priceRange.min)
      );
    }
    if (filters.priceRange.max !== null && filters.priceRange.max !== '') {
      filtered = filtered.filter(product =>
        product.price <= Number(filters.priceRange.max)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        break;
      case 'featured':
      default:
        // Featured products first, then bestsellers
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          if (a.bestseller && !b.bestseller) return -1;
          if (!a.bestseller && b.bestseller) return 1;
          return 0;
        });
        break;
    }

    return filtered;
  }, [products, filters, sortBy, searchQuery]);

  // Paginate products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, searchQuery, itemsPerPage]);

  // Scroll to top when search query changes
  useEffect(() => {
    if (searchQuery) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchQuery]);

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSortBy('featured');
  };

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

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (items) => {
    setItemsPerPage(items);
  };

  const renderCatalog = () => {
    if (isLoading) {
      return <ProductGridSkeleton count={itemsPerPage} />;
    }

    if (loadError) {
      return (
        <div
          role="alert"
          className="text-center py-16 bg-white rounded-lg shadow-sm"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('shop.loadError')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('shop.loadErrorHint')}
          </p>
          <Button variant="primary" size="large" onClick={loadProducts}>
            {t('common.retry')}
          </Button>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('shop.emptyTitle')}
          </h3>
          <p className="text-gray-600">
            {t('shop.emptyBody')}
          </p>
        </div>
      );
    }

    if (paginatedProducts.length === 0) {
      return (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <svg
            className="w-24 h-24 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t('search.noProducts')}
          </h3>
          <p className="text-gray-600 mb-6">
            {t('search.tryAdjusting')}
          </p>
          <Button variant="primary" size="large" onClick={handleClearFilters}>
            {t('filter.clearAll')}
          </Button>
        </div>
      );
    }

    return (
      <>
        <ProductGrid
          products={paginatedProducts}
          onAddToCart={handleAddToCart}
          onQuickView={handleQuickView}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredProducts.length}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageMeta
        title="Shop batik collection"
        description="Browse batik tulis, batik cap, and batik printing pieces with filters, sorting, and quick view."
      />
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {t('shop.title')}
          </h1>
          {searchQuery ? (
            <div className="space-y-1">
              <p className="text-lg text-gray-600">
                {t('search.resultsFor')} "<strong className="text-batik-orange">{searchQuery}</strong>"
              </p>
              <p className="text-sm text-gray-500">
                {filteredProducts.length > 0 
                  ? t('search.found', { count: filteredProducts.length })
                  : t('search.noResults')
                }
              </p>
            </div>
          ) : (
            <p className="text-lg text-gray-600">
              {t('shop.description')}
            </p>
          )}
        </div>

        {/* Main Content with Filters */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <ProductFilter
              filters={filters}
              onFilterChange={setFilters}
              onClearFilters={handleClearFilters}
              productStats={productStats}
            />
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
              <div className="text-sm text-gray-600">
                {t('pagination.showing', { shown: paginatedProducts.length, total: filteredProducts.length })}
              </div>
              
              {/* Sort Dropdown */}
              <div className="flex items-center gap-3">
                <label htmlFor="sort" className="text-sm font-medium text-gray-700">
                  {t('sort.sortBy')}:
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-batik-orange focus:border-transparent"
                >
                  <option value="featured">{t('sort.featured')}</option>
                  <option value="newest">{t('sort.newest')}</option>
                  <option value="price-asc">{t('sort.priceLowToHigh')}</option>
                  <option value="price-desc">{t('sort.priceHighToLow')}</option>
                  <option value="name-asc">{t('sort.nameAZ')}</option>
                  <option value="name-desc">{t('sort.nameZA')}</option>
                </select>
              </div>
            </div>

            {/* Products */}
            {renderCatalog()}
          </div>
        </div>
      </div>

      {/* QuickView Modal */}
      {quickViewProduct && (
        <QuickView product={quickViewProduct} onClose={closeQuickView} />
      )}
    </div>
  );
};

export default Shop;
