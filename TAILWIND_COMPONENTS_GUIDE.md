# Tailwind CSS Component Library - Usage Guide

This document provides examples of how to use the new Tailwind CSS components in your batik e-commerce application.

## Table of Contents
1. [Button Component](#button-component)
2. [Input Components](#input-components)
3. [Cart Components](#cart-components)
4. [Product Components](#product-components)
5. [Layout Components](#layout-components)

---

## Button Component

Location: `src/components/ui/Button.jsx`

### Basic Usage

```jsx
import Button from '../components/ui/Button';

// Primary button (default)
<Button onClick={handleClick}>
  Click Me
</Button>

// With icon
<Button 
  variant="primary" 
  icon={<ShoppingCartIcon />}
  onClick={handleAddToCart}
>
  Add to Cart
</Button>
```

### Variants

```jsx
// Primary (filled, primary color)
<Button variant="primary">Primary Button</Button>

// Secondary (outlined)
<Button variant="secondary">Secondary Button</Button>

// Accent (gold color for special actions)
<Button variant="accent">Special Offer</Button>

// Ghost (transparent with hover)
<Button variant="ghost">Cancel</Button>

// Danger (red for destructive actions)
<Button variant="danger">Delete</Button>

// Icon only (circular button)
<Button variant="icon">
  <HeartIcon />
</Button>
```

### Sizes

```jsx
<Button size="sm">Small</Button>
<Button size="md">Medium (Default)</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
```

### States

```jsx
// Disabled
<Button disabled>Disabled Button</Button>

// Loading
<Button loading>Processing...</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

### Complete Example

```jsx
<Button
  variant="primary"
  size="lg"
  loading={isSubmitting}
  disabled={!isValid}
  fullWidth
  onClick={handleSubmit}
  icon={<CheckIcon />}
>
  Complete Purchase
</Button>
```

---

## Input Components

Location: `src/components/ui/Input.jsx`

### TextInput

```jsx
import { TextInput } from '../components/ui/Input';

<TextInput
  label="Email Address"
  name="email"
  type="email"
  value={formData.email}
  onChange={(e) => setFormData({...formData, email: e.target.value})}
  placeholder="you@example.com"
  error={errors.email}
  required
/>
```

### Select

```jsx
import { Select } from '../components/ui/Input';

<Select
  label="Select Size"
  name="size"
  value={selectedSize}
  onChange={(e) => setSelectedSize(e.target.value)}
  options={[
    { value: 's', label: 'Small' },
    { value: 'm', label: 'Medium' },
    { value: 'l', label: 'Large' },
    { value: 'xl', label: 'Extra Large' }
  ]}
  placeholder="Choose a size"
  error={errors.size}
  required
/>
```

### Checkbox

```jsx
import { Checkbox } from '../components/ui/Input';

<Checkbox
  label="I agree to the terms and conditions"
  name="terms"
  checked={agreedToTerms}
  onChange={(e) => setAgreedToTerms(e.target.checked)}
/>
```

### Radio

```jsx
import { Radio } from '../components/ui/Input';

<div>
  <Radio
    label="Standard Shipping"
    name="shipping"
    value="standard"
    checked={shippingMethod === 'standard'}
    onChange={(e) => setShippingMethod(e.target.value)}
  />
  <Radio
    label="Express Shipping"
    name="shipping"
    value="express"
    checked={shippingMethod === 'express'}
    onChange={(e) => setShippingMethod(e.target.value)}
  />
</div>
```

### Textarea

```jsx
import { Textarea } from '../components/ui/Input';

<Textarea
  label="Review"
  name="review"
  value={reviewText}
  onChange={(e) => setReviewText(e.target.value)}
  placeholder="Share your experience with this product..."
  rows={6}
  error={errors.review}
  required
/>
```

---

## Cart Components

### CartDrawer

Location: `src/components/Cart/CartDrawer.jsx`

```jsx
import { useState } from 'react';
import CartDrawer from '../components/Cart/CartDrawer';

function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsCartOpen(true)}>
        Open Cart
      </button>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </>
  );
}
```

Features:
- Slide-in from right
- Backdrop overlay
- Scrollable cart items
- Sticky footer with total
- Empty state with call-to-action
- Smooth animations

### CartItem

Location: `src/components/Cart/CartItem.jsx`

Used automatically within CartDrawer, but can be used standalone:

```jsx
import CartItem from '../components/Cart/CartItem';

<CartItem
  item={{
    id: 1,
    name: 'Batik Tulis Parang',
    price: 1850000,
    image: '/images/parang.jpg',
    size: 'L',
    color: 'Blue',
    quantity: 2
  }}
  onUpdateQuantity={(id, quantity) => updateQuantity(id, quantity)}
  onRemove={(id) => removeFromCart(id)}
/>
```

---

## Product Components

### ProductCard

Location: `src/components/ProductCard/ProductCard.jsx`

```jsx
import ProductCard from '../components/ProductCard/ProductCard';

<ProductCard
  product={product}
  onAddToCart={(product) => addToCart(product)}
  onQuickView={(product) => openQuickView(product)}
/>
```

Features:
- Responsive image with hover scale
- Category badge (top-left)
- Status badges (top-right): Featured, Bestseller, Out of Stock
- Quick actions overlay on hover:
  - Quick View button
  - Wishlist toggle button
- Product info section
- Add to Cart button

### ProductGrid

Location: `src/components/ProductGrid/ProductGrid.jsx`

```jsx
import ProductGrid from '../components/ProductGrid/ProductGrid';

<ProductGrid
  products={filteredProducts}
  onAddToCart={handleAddToCart}
  onQuickView={handleQuickView}
  emptyMessage="No products match your filters"
/>
```

Responsive grid:
- 1 column on mobile
- 2 columns on tablet (640px+)
- 3 columns on desktop (1024px+)
- 4 columns on large desktop (1280px+)

---

## Layout Components

### Header

Location: `src/components/Layout/Header.jsx`

The Header component is automatically used in the Layout and includes:

Features:
- Sticky navigation with shadow on scroll
- Logo with brand name
- Desktop navigation links
- Search bar (desktop: inline, mobile: toggle)
- Wishlist icon with counter badge
- Cart button (opens CartDrawer)
- Mobile hamburger menu
- Responsive design

Usage is automatic through Layout component.

### Layout

Location: `src/components/Layout/Layout.jsx`

```jsx
import Layout from '../components/Layout/Layout';

function MyPage() {
  return (
    <Layout>
      <div className="container-custom py-12">
        <h1>Page Content</h1>
        {/* Your page content */}
      </div>
    </Layout>
  );
}
```

---

## Custom Tailwind Classes

Location: `src/index.css`

### Container

```jsx
<div className="container-custom">
  {/* Max-width container with responsive padding */}
</div>
```

### Card

```jsx
<div className="card">
  {/* White background with shadow */}
</div>
```

### Link Hover

```jsx
<a className="link-hover">Hover me</a>
```

### Smooth Transitions

```jsx
<div className="transition-smooth">
  {/* Smooth transition on all properties */}
</div>
```

### Text Gradient

```jsx
<h1 className="text-gradient">
  Gradient Text
</h1>
```

### Skeleton Loader

```jsx
<div className="skeleton h-48 w-full"></div>
```

---

## Color Palette

### Primary (Brown)
- `bg-primary-50` to `bg-primary-900`
- `text-primary-50` to `text-primary-900`
- `border-primary-50` to `border-primary-900`

Main: `primary-600` (#6d5535)

### Accent (Gold)
- `bg-accent-50` to `bg-accent-900`
- `text-accent-50` to `text-accent-900`
- `border-accent-50` to `border-accent-900`

Main: `accent-500` (#d4af37)

### Neutral (Gray)
- `bg-neutral-50` to `bg-neutral-900`
- `text-neutral-50` to `text-neutral-900`
- `border-neutral-50` to `border-neutral-900`

---

## Responsive Design Patterns

### Padding

```jsx
<div className="px-4 sm:px-6 lg:px-8">
  {/* Responsive horizontal padding */}
</div>
```

### Text Sizes

```jsx
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
  Responsive Heading
</h1>
```

### Grid Layouts

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Responsive product grid */}
</div>
```

### Hide/Show

```jsx
{/* Show on mobile, hide on desktop */}
<div className="block md:hidden">Mobile Only</div>

{/* Hide on mobile, show on desktop */}
<div className="hidden md:block">Desktop Only</div>
```

### Flex Direction

```jsx
<div className="flex flex-col md:flex-row gap-4">
  {/* Vertical on mobile, horizontal on desktop */}
</div>
```

---

## Animation Classes

### Slide In Right

```jsx
<div className="animate-slide-in-right">
  {/* Slides in from right */}
</div>
```

### Fade In

```jsx
<div className="animate-fade-in">
  {/* Fades in */}
</div>
```

### Scale In

```jsx
<div className="animate-scale-in">
  {/* Scales in with fade */}
</div>
```

### Spin (for loading)

```jsx
<div className="animate-spin">
  {/* Spins continuously */}
</div>
```

---

## Best Practices

1. **Always use the custom Button component** instead of raw `<button>` tags for consistency
2. **Use Input components** for all form fields to maintain consistent styling
3. **Leverage utility classes** from Tailwind for spacing, colors, and typography
4. **Use responsive classes** to ensure mobile-first design
5. **Apply smooth transitions** to interactive elements with `transition-smooth` or duration classes
6. **Use semantic color names** (`primary`, `accent`, `neutral`) instead of generic colors
7. **Test components** on mobile, tablet, and desktop breakpoints

---

## Next Steps

To create additional components not yet implemented:

1. **ProductFilter Component** - For filtering products in shop page
2. **Loading States** - Add skeleton loaders to product grids
3. **Toast Notifications** - For success/error messages
4. **Modal Component** - For Quick View functionality
5. **Pagination Component** - For large product lists

---

For questions or issues, refer to the Tailwind CSS documentation: https://tailwindcss.com/docs
