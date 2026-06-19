import { Component, inject } from '@angular/core';

import { ProfileFacade } from '@features/profile/application/facades/profile.facade';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  private readonly profileFacade = inject(ProfileFacade);
  readonly profile = this.profileFacade.profile;

  constructor() {
    void this.profileFacade.loadProfile();
  }
}
