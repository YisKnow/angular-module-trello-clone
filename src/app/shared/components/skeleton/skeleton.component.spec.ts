import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  it('renders with the default "text" variant when no variant is provided', async () => {
    await render(SkeletonComponent);
    const skel = screen.getByTestId('app-skeleton');
    expect(skel).toBeInTheDocument();
    expect(skel).toHaveClass('animate-pulse-skeleton');
    expect(skel).toHaveClass('bg-gray-200');
  });

  it('renders a circle variant as a rounded shape', async () => {
    await render(SkeletonComponent, {
      inputs: { variant: 'circle' },
    });
    const skel = screen.getByTestId('app-skeleton');
    expect(skel).toHaveClass('rounded-full');
  });

  it('renders a card variant as a rectangle with explicit height', async () => {
    await render(SkeletonComponent, {
      inputs: { variant: 'card', height: '6rem' },
    });
    const skel = screen.getByTestId('app-skeleton');
    expect(skel).toHaveClass('rounded-lg');
    expect(skel.style.height).toBe('6rem');
  });

  it('renders a row variant as a wide rectangular placeholder', async () => {
    await render(SkeletonComponent, {
      inputs: { variant: 'row', width: '100%', height: '3rem' },
    });
    const skel = screen.getByTestId('app-skeleton');
    expect(skel).toHaveClass('rounded-md');
    expect(skel.style.width).toBe('100%');
    expect(skel.style.height).toBe('3rem');
  });

  it('renders a text variant with rounded-md and a default text line height', async () => {
    await render(SkeletonComponent, {
      inputs: { variant: 'text' },
    });
    const skel = screen.getByTestId('app-skeleton');
    expect(skel).toHaveClass('rounded-md');
    // ponytail: default height is "1rem" — a single text line
    expect(skel.style.height).toBe('1rem');
  });
});
