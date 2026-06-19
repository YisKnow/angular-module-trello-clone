import { Component, inject } from '@angular/core';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { NAVBAR_BACKGROUNDS } from '@shared/utils/colors.utils';
import { Colors } from '@shared/models/colors.model';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';

import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { BoardFacade } from '@boards/application/facades/board.facade';
import { BoardFormComponent } from '@layout/components/board-form/board-form.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    NgClass,
    NgOptimizedImage,
    OverlayModule,
    AvatarComponent,
    BoardFormComponent,
  ],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  isOpenOverlayAvatar = false;
  isOpenOverlayBoards = false;
  isOpenOverlayCreateBoard = false;
  isMobileMenuOpen = false;

  private readonly authFacade = inject(AuthFacade);
  private readonly boardFacade = inject(BoardFacade);
  private readonly router = inject(Router);

  user = this.authFacade.user;
  navBarColors = NAVBAR_BACKGROUNDS;

  // Reactive: follows the currently-loaded board's backgroundColor.
  // Falls back to 'sky' when no board is loaded (e.g. on /app/boards list).
  readonly navBarBackgroundColor = this.boardFacade.backgroundColor;

  get colors() {
    return this.navBarColors[this.navBarBackgroundColor()] || {};
  }

  logout() {
    this.authFacade.logout();
    this.router.navigate(['/login']);
  }

  close(event: boolean) {
    this.isOpenOverlayCreateBoard = event;
  }
}
