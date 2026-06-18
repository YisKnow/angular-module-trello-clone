import { Component, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { NAVBAR_BACKGROUNDS } from '@models/colors.model';

import { AuthService } from '@services/auth.service';
import { BoardsService } from '@services/boards.service';
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

  private readonly authService = inject(AuthService);
  private readonly boardsService = inject(BoardsService);
  private readonly router = inject(Router);

  user = this.authService.user;
  navBarBackgroundColor = this.boardsService.backgroundColor;
  navBarColors = NAVBAR_BACKGROUNDS;

  colors = computed(() => {
    return this.navBarColors[this.navBarBackgroundColor()] || {};
  });

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  close(event: boolean) {
    this.isOpenOverlayCreateBoard = event;
  }
}
