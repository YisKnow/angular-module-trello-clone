import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HeaderComponent } from '@auth/components/header/header.component';
import { FooterComponent } from '@auth/components/footer/footer.component';
import { RecoveryFormComponent } from '@auth/components/recovery-form/recovery-form.component';
import { BackgroundComponent } from '@auth/components/background/background.component';

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
  templateUrl: './recovery.component.html',
})
export class RecoveryComponent {
}
