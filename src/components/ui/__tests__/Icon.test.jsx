import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import Icon from '../Icon';

describe('Icon', () => {
  it('renders a decorative SVG at the requested size', () => {
    const { container } = render(<Icon name="search" size={24} />);
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('renders nothing for an unknown name', () => {
    const { container } = render(<Icon name="not-a-real-icon" />);

    expect(container.querySelector('svg')).toBeNull();
  });
});
