import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Dialog } from '@angular/cdk/dialog';
import { TodoDialogComponent } from '@boards/components/todo-dialog/todo-dialog.component';

import { Card } from '@models/card.model';
import { Board } from '@models/board.model';
import { List } from '@models/list.model';
import { BACKGROUNDS } from '@models/colors.model';

import { BoardsService } from '@services/boards.service';
import { CardsService } from '@services/cards.service';
import { ListService } from '@services/list.service';

@Component({
  selector: 'app-board',
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
export class BoardComponent implements OnInit, OnDestroy {
  board: Board | null = null;
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

  constructor(
    private readonly dialog: Dialog,
    private readonly activatedRoute: ActivatedRoute,
    private readonly boardsService: BoardsService,
    private readonly cardsService: CardsService,
    private readonly listService: ListService
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((params) => {
      const boardId = params.get('boardId');
      if (boardId) {
        this.getBoard(boardId);
      }
    });
  }

  ngOnDestroy() {
    this.boardsService.backgroundColor$.next('sky');
  }

  drop(event: CdkDragDrop<Card[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }

    const rta = this.boardsService.getPosition(event.container.data, event.currentIndex);
    const card = event.container.data[event.currentIndex];
    const listId = event.container.id;
    this.updateCard(card, rta, listId);
  }

  addList() {
    const title = this.inputList.value;

    if (this.inputList.valid && this.board) {
      this.listService.create({
        title,
        boardId: this.board.id,
        position: this.boardsService.getPositionNewItem(this.board.lists),
      }).subscribe((list) => {
        this.board?.lists.push({
          ...list,
          cards: [],
        });
        this.inputList.setValue('');
        this.showListForm = false;
      });
    }
  }

  openDialog(card: Card) {
    const dialogRef = this.dialog.open(TodoDialogComponent, {
      minWidth: '300px',
      maxWidth: '50%',
      data: {
        card,
      },
    });
    dialogRef.closed.subscribe((output) => {
      console.log(output);
    });
  }

  private getBoard(boardId: string) {
    this.boardsService.getBoards(boardId).subscribe((board) => {
      this.board = board;
    });
  }

  private updateCard(card: Card, position: number, listId: string | number) {
    this.cardsService.update(card.id, { position, listId }).subscribe((cardUpdate) => {
      console.log('Card updated', cardUpdate);
    });
  }

  openFormCard(list: List) {
    if (this.board?.lists) {
      this.board.lists = this.board.lists.map(iteratorList => ({
        ...iteratorList,
        showCardForm: iteratorList.id === list.id
      }));
    }
  }

  createCard(list: List) {
    const title = this.inputCard.value;

    if (this.board && this.inputCard.valid) {
      this.cardsService.create({
        title,
        listId: list.id,
        boardId: this.board?.id,
        position: this.boardsService.getPositionNewItem(list.cards),
      }).subscribe((card) => {
        list.cards.push(card);
        this.inputCard.setValue('');
        list.showCardForm = false;
      });
    }
  }

  closeCardForm(list: List) {
    list.showCardForm = false;
  }

  get colors() {
    if (this.board) {
      const classes = this.colorBackgrounds[this.board.backgroundColor] || {};
      return classes;
    }
    return {};
  }
}
