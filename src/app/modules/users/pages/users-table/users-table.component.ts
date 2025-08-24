import { Component, OnInit } from '@angular/core';

import { DataSourceUser } from './data-source';

import { User } from '@models/user.model';

import { UsersService } from '@services/users.service';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-users-table',
  templateUrl: './users-table.component.html'
})
export class UsersTableComponent implements OnInit  {
  dataSource = new DataSourceUser();
  columns: string[] = ['id', 'avatar', 'name', 'email'];

  user: User | null = null;

  constructor(private readonly usersService: UsersService, private readonly authService: AuthService) {}

  ngOnInit() {
    this.getUsers();
    this.authService.user$.subscribe((user) => {
      this.user = user;
    });
  }

  getUsers() {
    this.usersService.getUsers().subscribe((users) => {
      this.dataSource.init(users);
    });
  }
}
