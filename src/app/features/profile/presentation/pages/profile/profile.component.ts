import { Component, inject } from '@angular/core';

import { ProfileFacade } from '@features/profile/application/facades/profile.facade';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SkeletonComponent, AvatarComponent],
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  private readonly profileFacade = inject(ProfileFacade);
  readonly profile = this.profileFacade.profile;

  constructor() {
    void this.profileFacade.loadProfile();
  }

  // ponytail: show a human-readable "June 18, 2026" instead of the raw
  // ISO timestamp. Falls back to the original string if the date is
  // unparseable (the API sometimes returns null or malformed dates).
  formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
