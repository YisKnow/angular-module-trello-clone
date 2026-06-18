import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

import { COLORS, Colors } from '@models/colors.model';

@Component({
  selector: 'app-card-color',
  standalone: true,
  imports: [NgClass],
  templateUrl: './card-color.component.html',
  styles: [
  ]
})
export class CardColorComponent {
  @Input() color: Colors = 'sky';

  mapColors = COLORS;

  get colors() {
    const clases = this.mapColors[this.color];
    return clases || [];
  }
}
