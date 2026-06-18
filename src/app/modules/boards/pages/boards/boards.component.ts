import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CdkAccordionModule } from '@angular/cdk/accordion';

import { Board } from '@models/board.model';

import { CardColorComponent } from '@shared/components/card-color/card-color.component';
import { MeService } from '@services/me.service';

@Component({
  selector: 'app-boards',
  standalone: true,
  imports: [
    RouterLink,
    CdkAccordionModule,
    CardColorComponent,
  ],
  templateUrl: './boards.component.html',
})
export class BoardsComponent {
  private readonly meService = inject(MeService);

  // ponytail: rxResource replaces Subject+switchMap+toSignal, keeps service layer
  readonly boards = rxResource({
    stream: () => this.meService.getMeBoards(),
    defaultValue: [] as Board[],
  });
}
