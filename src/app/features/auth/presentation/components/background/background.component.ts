import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-background',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './background.component.html',
})
export class BackgroundComponent {}
