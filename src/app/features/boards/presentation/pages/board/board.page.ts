import {
  Component,
  OnDestroy,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NgClass } from '@angular/common';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';

import { BACKGROUNDS } from '@shared/utils/colors.utils';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogResult,
} from '@shared/components/confirm-dialog/confirm-dialog.component';
import { Card } from '@boards/domain/entities/card.entity';
import { List } from '@boards/domain/entities/list.entity';
import { BoardFacade } from '@boards/application/facades/board.facade';
import { TodoDialogComponent } from '@boards/presentation/components/todo-dialog/todo-dialog.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
    DragDropModule,
    DialogModule,
    SkeletonComponent,
  ],
  templateUrl: './board.page.html',
  styles: [
    `
      .cdk-drop-list-dragging .cdk-drag {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
      .cdk-drag-animating {
        transition: transform 300ms cubic-bezier(0, 0, 0.2, 1);
      }
    `,
  ],
})
export class BoardPage implements OnDestroy {
  private readonly dialog = inject(Dialog);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly boardFacade = inject(BoardFacade);

  private readonly paramMap = toSignal(this.activatedRoute.paramMap);

  inputCard = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  inputList = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  showListForm = false;
  colorBackgrounds = BACKGROUNDS;

  // Expose the facade's signals to the template.
  readonly board = this.boardFacade.board;
  readonly backgroundColor = this.boardFacade.backgroundColor;

  constructor() {
    // React to paramMap changes and load the board via the facade.
    effect(() => {
      const boardId = this.paramMap()?.get('boardId');
      if (boardId) {
        void this.boardFacade.loadBoard(boardId);
      }
    });
  }

  ngOnDestroy() {
    this.boardFacade.resetBackgroundColor();
  }

  get colors() {
    return this.colorBackgrounds[this.backgroundColor()] || {};
  }

  drop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
    const card = event.container.data[event.currentIndex];
    void this.boardFacade.moveCard(card, event.currentIndex, event.container.id);
  }

  addList() {
    const title = this.inputList.value;
    if (this.inputList.valid && title) {
      void this.boardFacade.createList(title);
      this.inputList.setValue('');
      this.showListForm = false;
    }
  }

  async openDialog(card: Card) {
    const dialogRef = this.dialog.open<{ rta: boolean; description?: string }>(
      TodoDialogComponent,
      {
        minWidth: '300px',
        maxWidth: '50%',
        data: { card },
      },
    );
    try {
      const result = await firstValueFrom(dialogRef.closed);
      if (result && typeof result.description === 'string') {
        await this.boardFacade.updateCardDescription(card.id, result.description);
      }
    } catch {
      /* dialog dismissed without data */
    }
  }

  // ponytail: confirm-then-delete pattern. The card/list is removed
  // locally because the fake Trello API has no delete endpoints — see
  // BoardFacade.deleteCardLocally/deleteListLocally.
  async confirmDeleteCard(card: Card, list: List) {
    const confirmed = await this.askConfirm({
      title: 'Delete card?',
      message: `“${card.title}” will be removed from this list. This can't be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (confirmed) {
      this.boardFacade.deleteCardLocally(card.id);
    }
  }

  async confirmDeleteList(list: List) {
    const cardCount = list.cards.length;
    const confirmed = await this.askConfirm({
      title: 'Delete list?',
      message: `“${list.title}”${cardCount ? ` and its ${cardCount} card${cardCount === 1 ? '' : 's'}` : ''} will be removed. This can't be undone.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (confirmed) {
      this.boardFacade.deleteListLocally(list.id);
    }
  }

  private async askConfirm(data: {
    title: string;
    message: string;
    confirmLabel: string;
    destructive?: boolean;
  }): Promise<boolean> {
    const ref = this.dialog.open<ConfirmDialogResult>(ConfirmDialogComponent, {
      data,
    });
    try {
      const result = await firstValueFrom(ref.closed);
      return !!result?.confirmed;
    } catch {
      return false;
    }
  }

  openFormCard(list: List) {
    this.boardFacade.openCardForm(list.id);
  }

  createCard(list: List) {
    const title = this.inputCard.value;
    if (this.inputCard.valid && title) {
      void this.boardFacade.createCard(list, title);
      this.inputCard.setValue('');
    }
  }

  closeCardForm() {
    this.boardFacade.closeCardForm();
  }

  isCardFormOpen(list: List): boolean {
    return this.boardFacade.isCardFormOpen(list.id);
  }
}
