import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, from, of } from 'rxjs';
import { RouterOutlet } from '@angular/router';

import { User } from '@features/auth/domain/entities/user.entity';

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

  // Fire the profile fetch on init; the auth facade updates its user signal.
  readonly profileResult = toSignal(
    from(this.authFacade.getProfile()).pipe(
      catchError(() => of(null as User | null)),
    ),
    { initialValue: null as User | null },
  );
}
