import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CdkTableModule } from '@angular/cdk/table';
import { defer, from } from 'rxjs';

import { AuthFacade } from '@features/auth/application/facades/auth.facade';
import { UsersFacade } from '@features/users/application/facades/users.facade';
import { AvatarComponent } from '@shared/components/avatar/avatar.component';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CdkTableModule, AvatarComponent],
  templateUrl: './users-table.component.html',
})
export class UsersTableComponent {
  private readonly usersFacade = inject(UsersFacade);
  readonly authFacade = inject(AuthFacade);

  columns: string[] = ['id', 'avatar', 'name', 'email'];

  // ponytail: rxResource replaces Subject+switchMap+toSignal, keeps service layer
  readonly users = rxResource({
    stream: () => defer(() => from(this.usersFacade.loadUsers())),
    defaultValue: [],
  });

  readonly user = this.authFacade.user;
}
