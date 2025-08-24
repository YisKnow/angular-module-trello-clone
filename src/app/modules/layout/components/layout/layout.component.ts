import { Component, OnInit } from '@angular/core';

import { User } from '@models/user.model';

import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit {
  user: User | null = null;

  constructor(private readonly authService: AuthService) {}

  ngOnInit() {
    this.authService.getProfile().subscribe();
  }
}
