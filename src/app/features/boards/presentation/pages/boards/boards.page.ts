import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { defer, from } from 'rxjs';

import { BoardSummary } from '@boards/domain/entities/board.entity';
import { Colors } from '@shared/models/colors.model';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

import { BoardFacade } from '@boards/application/facades/board.facade';

@Component({
  selector: 'app-boards',
  standalone: true,
  imports: [
    RouterLink,
    NgClass,
    SkeletonComponent,
  ],
  templateUrl: './boards.page.html',
})
export class BoardsPage {
  // ponytail: precomputed map reused on every call — no per-render allocation.
  private static readonly COVER_CLASS_MAP: Record<Colors, string> = {
    sky: 'bg-primary-200',
    yellow: 'bg-warning-100',
    green: 'bg-success-200',
    red: 'bg-danger-200',
    violet: 'bg-primary-100',
    gray: 'bg-gray-200',
    success: 'bg-success-200',
    primary: 'bg-primary-200',
    danger: 'bg-danger-200',
    light: 'bg-gray-100',
    info: 'bg-info-200',
  };

  private readonly boardFacade = inject(BoardFacade);

  // Re-fetch whenever the boards-list version changes (create/delete).
  readonly boards = rxResource({
    stream: () => {
      this.boardFacade.boardsVersion();
      return defer(() => from(this.boardFacade.getMyBoards()));
    },
    defaultValue: [] as BoardSummary[],
  });

  isOpenOverlayCreateBoard = false;

  async deleteBoard(id: BoardSummary['id']): Promise<void> {
    await this.boardFacade.deleteBoard(id);
  }

  coverClass(color: Colors): Record<string, boolean> {
    return { [BoardsPage.COVER_CLASS_MAP[color] || 'bg-gray-100']: true };
  }
}
