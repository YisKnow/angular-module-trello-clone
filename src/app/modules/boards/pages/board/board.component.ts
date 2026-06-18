import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
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
import {
  Subject,
  catchError,
  exhaustMap,
  firstValueFrom,
  of,
  tap,
} from 'rxjs';

import { Card } from '@models/card.model';
import { Board } from '@models/board.model';
import { List } from '@models/list.model';
import { BACKGROUNDS } from '@models/colors.model';

import { ButtonComponent } from '@shared/components/button/button.component';
import { TodoDialogComponent } from '@boards/components/todo-dialog/todo-dialog.component';
import { BoardsService } from '@services/boards.service';
import { CardsService } from '@services/cards.service';
import { ListService } from '@services/list.service';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
    DragDropModule,
    DialogModule,
    ButtonComponent,
  ],
  templateUrl: './board.component.html',
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
export class BoardComponent implements OnDestroy {
  private readonly dialog = inject(Dialog);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly boardsService = inject(BoardsService);
  private readonly cardsService = inject(CardsService);
  private readonly listService = inject(ListService);

  private readonly paramMap = toSignal(this.activatedRoute.paramMap);
  private readonly listAdd$ = new Subject<void>();
  private readonly cardAdd$ = new Subject<List>();
  private readonly cardUpdate$ = new Subject<{
    card: Card;
    position: number;
    listId: string | number;
  }>();

  readonly board = signal<Board | null>(null);

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

  constructor() {
    // React to paramMap changes and load the board
    effect(() => {
      const pm = this.paramMap();
      const boardId = pm?.get('boardId');
      if (!boardId) return;
      void this.loadBoard(boardId);
    });

    // Add list to current board
    toSignal(
      this.listAdd$.pipe(
        exhaustMap(() => {
          const title = this.inputList.value;
          if (this.inputList.valid && this.board()) {
            return this.listService
              .create({
                title,
                boardId: this.board()!.id,
                position: this.boardsService.getPositionNewItem(
                  this.board()!.lists,
                ),
              })
              .pipe(
                tap((list) => {
                  const current = this.board();
                  if (current) {
                    this.board.set({
                      ...current,
                      lists: [...current.lists, { ...list, cards: [] }],
                    });
                  }
                  this.inputList.setValue('');
                  this.showListForm = false;
                }),
                catchError(() => of(null)),
              );
          }
          return of(null);
        }),
      ),
      { initialValue: null },
    );

    // Create a new card in a list
    toSignal(
      this.cardAdd$.pipe(
        exhaustMap((list) => {
          const title = this.inputCard.value;
          if (this.board() && this.inputCard.valid) {
            return this.cardsService
              .create({
                title,
                listId: list.id,
                boardId: this.board()!.id,
                position: this.boardsService.getPositionNewItem(list.cards),
              })
              .pipe(
                tap((card) => {
                  list.cards.push(card);
                  this.inputCard.setValue('');
                  list.showCardForm = false;
                }),
                catchError(() => of(null)),
              );
          }
          return of(null);
        }),
      ),
      { initialValue: null },
    );

    // Update a card's position
    toSignal(
      this.cardUpdate$.pipe(
        exhaustMap(({ card, position, listId }) =>
          this.cardsService.update(card.id, { position, listId }).pipe(
            tap((cardUpdate) => {
              console.log('Card updated', cardUpdate);
            }),
            catchError(() => of(null)),
          ),
        ),
      ),
      { initialValue: null },
    );
  }

  ngOnDestroy() {
    this.boardsService.setBackgroundColor('sky');
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

    const rta = this.boardsService.getPosition(
      event.container.data,
      event.currentIndex,
    );
    const card = event.container.data[event.currentIndex];
    const listId = event.container.id;
    this.cardUpdate$.next({ card, position: rta, listId });
  }

  addList() {
    this.listAdd$.next();
  }

  async openDialog(card: Card) {
    const dialogRef = this.dialog.open(TodoDialogComponent, {
      minWidth: '300px',
      maxWidth: '50%',
      data: {
        card,
      },
    });
    try {
      const output = await firstValueFrom(dialogRef.closed);
      console.log(output);
    } catch {
      /* dialog dismissed without data */
    }
  }

  openFormCard(list: List) {
    const current = this.board();
    if (current?.lists) {
      this.board.set({
        ...current,
        lists: current.lists.map((iteratorList) => ({
          ...iteratorList,
          showCardForm: iteratorList.id === list.id,
        })),
      });
    }
  }

  createCard(list: List) {
    this.cardAdd$.next(list);
  }

  closeCardForm(list: List) {
    list.showCardForm = false;
  }

  get colors() {
    const current = this.board();
    if (current) {
      const classes = this.colorBackgrounds[current.backgroundColor] || {};
      return classes;
    }
    return {};
  }

  private async loadBoard(boardId: string) {
    try {
      const board = await firstValueFrom(
        this.boardsService.getBoards(boardId),
      );
      this.board.set(board);
    } catch (err) {
      console.error('Failed to load board', err);
    }
  }
}
