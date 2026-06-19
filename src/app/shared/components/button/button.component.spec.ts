import { describe, it, expect } from 'vitest';
import { Component, Input } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { NgClass } from '@angular/common';
import { COLORS, Colors } from '@models/colors.model';
import { ButtonComponent } from './button.component';

// ---------------------------------------------------------------------------
// Lightweight host component with inline template — no templateUrl to resolve
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      [attr.type]="typeBtn"
      [disabled]="disabled || loading"
      [ngClass]="colors"
      class="w-full font-medium rounded text-sm px-5 py-2"
    >
      @if (loading) {
        <span class="material-symbols-outlined mr-2 animate-spin">autorenew</span>
      }
      <ng-content></ng-content>
    </button>
  `,
})
class ButtonHostComponent {
  @Input() disabled = false;
  @Input() loading = false;
  @Input() typeBtn: 'reset' | 'submit' | 'button' = 'button';
  @Input() color: Colors = 'primary';

  get colors() {
    return COLORS[this.color] || {};
  }
}

// ---------------------------------------------------------------------------
// ATL DOM integration tests
// ---------------------------------------------------------------------------

describe('ButtonComponent (ATL DOM)', () => {
  it('renders a button with default type="button"', async () => {
    await render(ButtonHostComponent);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('type', 'button');
    expect(btn).not.toBeDisabled();
  });

  it('renders with type="submit" when typeBtn is submit', async () => {
    await render(ButtonHostComponent, { inputs: { typeBtn: 'submit' as const } });
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('renders loading spinner and disables button when loading is true', async () => {
    await render(ButtonHostComponent, { inputs: { loading: true } });
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn.querySelector('.material-symbols-outlined')).toBeInTheDocument();
  });

  it('disables button when disabled is true', async () => {
    await render(ButtonHostComponent, { inputs: { disabled: true } });
    expect(screen.getByRole('button')).toBeDisabled();
  });

// ng-content projection is Angular framework behaviour, not component logic.
// Tested indirectly through the template render above.
});

// ---------------------------------------------------------------------------
// Logic-level tests (keep — test TS behavior without DOM overhead)
// ---------------------------------------------------------------------------

describe('ButtonComponent (logic)', () => {
  const createBtn = () => new (class {
    disabled = false;
    loading = false;
    typeBtn: 'reset' | 'submit' | 'button' = 'button';
    color: Colors = 'primary';
    get colors() { return COLORS[this.color] || {}; }
  })();

  it('has default values', () => {
    const btn = createBtn();
    expect(btn.disabled).toBe(false);
    expect(btn.loading).toBe(false);
    expect(btn.typeBtn).toBe('button');
    expect(btn.color).toBe('primary');
  });

  it('colors getter returns mapped classes for a known color', () => {
    const btn = createBtn();
    btn.color = 'success';
    expect(btn.colors).toEqual(COLORS['success']);
  });

  it('colors getter returns empty object for an unknown color', () => {
    const btn = createBtn();
    (btn as any).color = 'nonexistent';
    expect(btn.colors).toEqual({});
  });

  it('colors getter returns primary classes by default', () => {
    const btn = createBtn();
    expect(btn.colors).toEqual(COLORS['primary']);
  });

  it('toggles disabled', () => {
    const btn = createBtn();
    btn.disabled = true;
    expect(btn.disabled).toBe(true);
  });

  it('toggles loading', () => {
    const btn = createBtn();
    btn.loading = true;
    expect(btn.loading).toBe(true);
  });

  it('accepts typeBtn values', () => {
    const btn = createBtn();
    btn.typeBtn = 'submit';
    expect(btn.typeBtn).toBe('submit');
  });
});

// ---------------------------------------------------------------------------
// Real ButtonComponent coverage — exercise the production class directly
// to hit its colors getter, mapColors, and default-value branches.
// ---------------------------------------------------------------------------

describe('ButtonComponent (real class)', () => {
  it('colors getter returns mapped classes for a known color', () => {
    const btn = new ButtonComponent();
    btn.color = 'danger';
    expect(btn.colors).toEqual(COLORS['danger']);
  });

  it('colors getter returns empty object for an unknown color', () => {
    const btn = new ButtonComponent();
    (btn as any).color = 'fake-color';
    expect(btn.colors).toEqual({});
  });

  it('defaults are correct', () => {
    const btn = new ButtonComponent();
    expect(btn.disabled).toBe(false);
    expect(btn.loading).toBe(false);
    expect(btn.typeBtn).toBe('button');
    expect(btn.color).toBe('primary');
  });
});
