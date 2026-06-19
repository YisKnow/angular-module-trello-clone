import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  private readonly authFacade = inject(AuthFacade);

  constructor() {
    void this.authFacade.getProfile();
  }
}
