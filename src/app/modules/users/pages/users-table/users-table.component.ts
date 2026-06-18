import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CdkTableModule } from '@angular/cdk/table';

import { User } from '@models/user.model';

import { UsersService } from '@services/users.service';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-users-table',
  standalone: true,
  imports: [CdkTableModule],
  templateUrl: './users-table.component.html',
})
export class UsersTableComponent {
  private readonly usersService = inject(UsersService);
  readonly authService = inject(AuthService);

  columns: string[] = ['id', 'avatar', 'name', 'email'];

  // ponytail: rxResource replaces Subject+switchMap+toSignal, keeps service layer
  readonly users = rxResource({
    stream: () => this.usersService.getUsers(),
    defaultValue: [] as User[],
  });

  readonly user = this.authService.user;
}
