import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { Colors } from '@shared/models/colors.model';
import { COLORS } from '@shared/utils/colors.utils';

@Component({
  selector: 'app-btn',
  standalone: true,
  imports: [NgClass],
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  @Input() disabled = false;
  @Input() loading = false;
  @Input() typeBtn: 'reset' | 'submit' | 'button' = 'button';
  @Input() color: Colors = 'primary';

  mapColors = COLORS;

  get colors() {
    const colors = this.mapColors[this.color];
    if (colors) {
      return colors;
    }
    return {};
  }
}
