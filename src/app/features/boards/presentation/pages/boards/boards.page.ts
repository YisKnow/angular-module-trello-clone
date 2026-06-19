import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CdkAccordionModule } from '@angular/cdk/accordion';
import { defer, from } from 'rxjs';

import { BoardSummary } from '@boards/domain/entities/board.entity';
import { CardColorComponent } from '@shared/components/card-color/card-color.component';

import { ME_REPOSITORY } from '@features/auth/domain/repositories/me.repository';

@Component({
  selector: 'app-boards',
  standalone: true,
  imports: [
    RouterLink,
    CdkAccordionModule,
    CardColorComponent,
  ],
  templateUrl: './boards.page.html',
})
export class BoardsPage {
  private readonly meRepository = inject(ME_REPOSITORY);

  // ponytail: rxResource replaces Subject+switchMap+toSignal
  readonly boards = rxResource({
    stream: () => defer(() => from(this.meRepository.getMeBoards())),
    defaultValue: [] as BoardSummary[],
  });
}
