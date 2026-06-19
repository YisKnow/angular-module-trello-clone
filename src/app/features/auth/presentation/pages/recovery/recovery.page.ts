import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '@features/auth/presentation/components/header/header.component';
import { FooterComponent } from '@features/auth/presentation/components/footer/footer.component';
import { RecoveryFormComponent } from '@features/auth/presentation/components/recovery-form/recovery-form.component';
import { BackgroundComponent } from '@features/auth/presentation/components/background/background.component';

@Component({
  selector: 'app-recovery',
  standalone: true,
  imports: [
    RouterLink,
    HeaderComponent,
    FooterComponent,
    RecoveryFormComponent,
    BackgroundComponent,
  ],
  templateUrl: './recovery.page.html',
})
export class RecoveryPage {}
