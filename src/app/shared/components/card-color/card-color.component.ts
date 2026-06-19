import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

import { Colors } from '@shared/models/colors.model';
import { COLORS } from '@shared/utils/colors.utils';

@Component({
  selector: 'app-card-color',
  standalone: true,
  imports: [NgClass],
  templateUrl: './card-color.component.html',
})
export class CardColorComponent {
  @Input() color: Colors = 'sky';

  mapColors = COLORS;

  get colors() {
    const clases = this.mapColors[this.color];
    return clases || [];
  }
}
