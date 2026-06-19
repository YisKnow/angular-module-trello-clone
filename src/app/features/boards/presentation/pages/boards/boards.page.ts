import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { defer, from } from 'rxjs';

import { BoardSummary } from '@boards/domain/entities/board.entity';
import { Colors } from '@shared/models/colors.model';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { BACKGROUNDS } from '@shared/utils/colors.utils';

import { BoardFacade } from '@boards/application/facades/board.facade';

@Component({
  selector: 'app-boards',
  standalone: true,
  imports: [RouterLink, NgClass, SkeletonComponent],
  templateUrl: './boards.page.html',
})
export class BoardsPage {
  private readonly boardFacade = inject(BoardFacade);

  readonly boards = rxResource({
    stream: () => {
      this.boardFacade.boardsVersion();
      return defer(() => from(this.boardFacade.getMyBoards()));
    },
    defaultValue: [] as BoardSummary[],
  });

  isOpenOverlayCreateBoard = false;
  readonly backgrounds = BACKGROUNDS;

  coverClass(color: Colors): Record<string, boolean> {
    return this.backgrounds[color] || {};
  }

  async deleteBoard(id: BoardSummary['id']): Promise<void> {
    await this.boardFacade.deleteBoard(id);
  }
}
