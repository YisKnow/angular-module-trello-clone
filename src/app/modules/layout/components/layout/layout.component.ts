import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { RouterOutlet } from '@angular/router';

import { User } from '@models/user.model';

import { AuthService } from '@services/auth.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  private readonly authService = inject(AuthService);

  // Fire the profile fetch on init; the auth service updates its user signal via tap.
  readonly profileResult = toSignal(
    this.authService.getProfile().pipe(catchError(() => of(null as User | null))),
    { initialValue: null as User | null },
  );
}
