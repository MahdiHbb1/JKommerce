import React from 'react';
import PropTypes from 'prop-types';
import {
  ArrowRight,
  Check,
  Eye,
  Heart,
  House,
  ImageBroken,
  List,
  MagnifyingGlass,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingBagOpen,
  Storefront,
  Trash,
  Truck,
  User,
  X,
} from '@phosphor-icons/react';

const ICONS = {
  search: MagnifyingGlass,
  heart: Heart,
  bag: ShoppingBag,
  bagOpen: ShoppingBagOpen,
  menu: List,
  close: X,
  user: User,
  home: House,
  shop: Storefront,
  quickView: Eye,
  trash: Trash,
  plus: Plus,
  minus: Minus,
  arrowRight: ArrowRight,
  check: Check,
  truck: Truck,
  shield: ShieldCheck,
  imageOff: ImageBroken,
};

const Icon = ({ name, size = 20, weight = 'regular', className = '', ...rest }) => {
  const Component = ICONS[name];

  if (!Component) {
    return null;
  }

  return (
    <Component
      size={size}
      weight={weight}
      className={className}
      aria-hidden="true"
      focusable="false"
      {...rest}
    />
  );
};

Icon.propTypes = {
  name: PropTypes.oneOf(Object.keys(ICONS)).isRequired,
  size: PropTypes.number,
  weight: PropTypes.oneOf(['thin', 'light', 'regular', 'bold', 'fill', 'duotone']),
  className: PropTypes.string,
};

export default Icon;
