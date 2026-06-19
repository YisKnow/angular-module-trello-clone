import { Component, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { NAVBAR_BACKGROUNDS } from '@shared/utils/colors.utils';

import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { ButtonComponent } from '@shared/components/button/button.component';
import { BoardFormComponent } from '@layout/components/board-form/board-form.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    NgClass,
    OverlayModule,
    ButtonComponent,
    BoardFormComponent,
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  isOpenOverlayAvatar = false;
  isOpenOverlayBoards = false;
  isOpenOverlayCreateBoard = false;

  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  user = this.authFacade.user;
  navBarColors = NAVBAR_BACKGROUNDS;

  // Background color is sourced from the board feature; the navbar
  // reads it via shared route state in the boards page. For now we
  // default to 'sky' until the boards facade is wired in.
  navBarBackgroundColor = computed(() => 'sky' as const);

  colors = computed(() => {
    return this.navBarColors[this.navBarBackgroundColor()] || {};
  });

  logout() {
    this.authFacade.logout();
    this.router.navigate(['/login']);
  }

  close(event: boolean) {
    this.isOpenOverlayCreateBoard = event;
  }
}
