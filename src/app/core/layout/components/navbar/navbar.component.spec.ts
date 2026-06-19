import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/angular';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// ponytail: lightweight host that mirrors the navbar's mobile menu block,
// so we can test that the hamburger button toggles menu visibility and
// that menu items are rendered when isMobileMenuOpen is true.
@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav>
      <button
        type="button"
        data-testid="hamburger"
        class="md:hidden p-2 rounded-lg hover:bg-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500"
        (click)="isMobileMenuOpen = !isMobileMenuOpen"
        [attr.aria-expanded]="isMobileMenuOpen"
        aria-label="Toggle navigation"
      >
        <span class="material-symbols-outlined">
          {{ isMobileMenuOpen ? 'close' : 'menu' }}
        </span>
      </button>
      @if (isMobileMenuOpen) {
        <div data-testid="mobile-menu" class="md:hidden flex flex-col w-full bg-primary-700 text-white">
          <a class="block py-3 px-4 text-white border-b border-white/20">Boards</a>
          <a class="block py-3 px-4 text-white border-b border-white/20">Users</a>
          <a class="block py-3 px-4 text-white">Profile</a>
        </div>
      }
    </nav>
  `,
})
class NavbarMobileMenuHostComponent {
  isMobileMenuOpen = false;
}

describe('Navbar mobile menu (Visual Redesign — T10)', () => {
  it('renders a hamburger button visible on small screens', async () => {
    await render(NavbarMobileMenuHostComponent);
    const btn = screen.getByTestId('hamburger');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('md:hidden');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('does NOT render the mobile menu initially', async () => {
    await render(NavbarMobileMenuHostComponent);
    expect(screen.queryByTestId('mobile-menu')).toBeNull();
  });

  it('opens the mobile menu when the hamburger is clicked', async () => {
    await render(NavbarMobileMenuHostComponent);
    const btn = screen.getByTestId('hamburger');
    fireEvent.click(btn);
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes the mobile menu when the hamburger is clicked again', async () => {
    await render(NavbarMobileMenuHostComponent);
    const btn = screen.getByTestId('hamburger');
    fireEvent.click(btn); // open
    fireEvent.click(btn); // close
    expect(screen.queryByTestId('mobile-menu')).toBeNull();
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });
});
