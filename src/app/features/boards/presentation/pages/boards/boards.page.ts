import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { defer, from } from 'rxjs';

import { BoardSummary } from '@boards/domain/entities/board.entity';
import { Colors } from '@shared/models/colors.model';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';

import { ME_REPOSITORY } from '@features/auth/domain/repositories/me.repository';

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
  private readonly meRepository = inject(ME_REPOSITORY);

  readonly boards = rxResource({
    stream: () => defer(() => from(this.meRepository.getMeBoards())),
    defaultValue: [] as BoardSummary[],
  });

  isOpenOverlayCreateBoard = false;

  coverClass(color: Colors): Record<string, boolean> {
    const map: Record<Colors, string> = {
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
    return { [map[color] || 'bg-gray-100']: true };
  }
}
