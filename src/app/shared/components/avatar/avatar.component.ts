import { Component, computed, input, signal } from '@angular/core';

import { avatarInitials, avatarUrl } from '@shared/utils/avatar.util';

// ponytail: wraps an <img> with deterministic fallback handling.
// On first load error, falls back to a pastel circle with the user's
// initials (always renders, no broken-image icon).
@Component({
  selector: 'app-avatar',
  standalone: true,
  // ponytail: :host sizing is critical because <app-avatar> is a
  // custom element. Without it the host falls back to `display:
  // inline` and inherits the parent's line-height — so a 32x32
  // avatar in a <td> collapses to a 16px-tall sliver.
  host: {
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.display]': '"inline-block"',
    '[style.line-height]': '0',
    '[style.font-size]': '0',
    '[style.vertical-align]': '"middle"',
  },
  template: `
    <span
      class="relative inline-flex items-center justify-center overflow-hidden rounded-full"
      [style.width.px]="size()"
      [style.height.px]="size()"
      [style.background-color]="errorState() ? fallbackBg() : 'transparent'"
      [attr.aria-label]="ariaLabel()"
      role="img"
    >
      @if (!errorState()) {
        <img
          [src]="resolvedUrl()"
          [alt]="altText()"
          [width]="size()"
          [height]="size()"
          class="w-full h-full object-cover block"
          loading="lazy"
          (error)="onError()"
        />
      } @else {
        <span
          class="font-semibold text-gray-900 select-none"
          [style.font-size.px]="fontSize()"
        >{{ initials() }}</span>
      }
    </span>
  `,
})
export class AvatarComponent {
  readonly seed = input<string | number | { id?: number | string; email?: string; name?: string } | null>(null);
  readonly alt = input<string>('');

  // ponytail: default 40px matches the existing users-table size.
  // The fallback initials rely on a fixed-size container so the
  // surrounding layout doesn't jump when the network image fails.
  readonly size = input<number>(40);

  protected readonly errorState = signal(false);

  readonly resolvedUrl = computed(() => avatarUrl(this.seed()));
  readonly initials = computed(() => {
    const s = this.seed();
    const name = typeof s === 'object' && s !== null ? s.name : null;
    return avatarInitials(name);
  });
  readonly altText = computed(() => this.alt() || 'User avatar');
  readonly ariaLabel = computed(() => this.alt() || 'User avatar');
  readonly fontSize = computed(() => Math.max(11, Math.round(this.size() * 0.4)));

  // ponytail: deterministic pastel color per seed so each user
  // gets a consistent, distinguishable background even on the
  // initials fallback (no two users look identical).
  readonly fallbackBg = computed(() => {
    const seedStr = String(this.seed() ?? '0');
    const palette = ['#E1F3FE', '#EDF3EC', '#FBF3DB', '#FDEBEC', '#F3E8FE', '#FFE4D6'];
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    return palette[Math.abs(hash) % palette.length];
  });

  onError(): void {
    this.errorState.set(true);
  }
}
