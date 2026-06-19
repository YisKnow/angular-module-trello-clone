import { Component, Input } from '@angular/core';

// ponytail: lightweight visual placeholder for async content. Variants give
// callers a declarative shape (card/row/text/circle) without forcing them
// to hand-roll pulse rectangles everywhere.
@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <div
      data-testid="app-skeleton"
      class="animate-pulse-skeleton bg-gray-200 block"
      [class]="roundedClass"
      [style.width]="resolvedWidth"
      [style.height]="resolvedHeight"
    ></div>
  `,
})
export class SkeletonComponent {
  @Input() variant: 'card' | 'row' | 'text' | 'circle' = 'text';
  @Input() width: string | null = null;
  @Input() height: string | null = null;

  get roundedClass(): string {
    if (this.variant === 'circle') return 'rounded-full';
    if (this.variant === 'card') return 'rounded-lg';
    if (this.variant === 'row') return 'rounded-md';
    return 'rounded-md';
  }

  get resolvedWidth(): string {
    if (this.width) return this.width;
    return this.variant === 'circle' ? '3rem' : '100%';
  }

  get resolvedHeight(): string {
    if (this.height) return this.height;
    if (this.variant === 'card') return '6rem';
    if (this.variant === 'row') return '3rem';
    if (this.variant === 'circle') return '3rem';
    return '1rem';
  }
}
