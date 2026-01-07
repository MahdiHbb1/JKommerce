import React from 'react';
import './Button.css';

/**
 * Reusable Button Component
 * 
 * Variants:
 * - primary: Main CTA buttons (gold accent)
 * - secondary: Alternative actions (navy)
 * - outline: Subtle actions (bordered)
 * 
 * Sizes: small, medium (default), large
 */

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const classNames = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full-width' : '',
    disabled ? 'btn-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
