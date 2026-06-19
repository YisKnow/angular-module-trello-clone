import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  form,
  schema,
  required,
  FormField,
  FormRoot,
} from '@angular/forms/signals';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, exhaustMap, from, of, tap } from 'rxjs';

import { Colors } from '@shared/models/colors.model';

import { ButtonComponent } from '@shared/components/button/button.component';
import { BoardFacade } from '@boards/application/facades/board.facade';

type BoardFormModel = { title: string; backgroundColor: Colors };

@Component({
  selector: 'app-board-form',
  standalone: true,
  imports: [FormField, FormRoot, ButtonComponent],
  templateUrl: './board-form.component.html',
})
export class BoardFormComponent {
  @Output() closeOverlay = new EventEmitter<boolean>();

  private readonly boardFacade = inject(BoardFacade);
  private readonly router = inject(Router);

  private readonly createBoardSubject = new Subject<{
    title: string;
    backgroundColor: Colors;
  }>();

  readonly createBoardResult = toSignal(
    this.createBoardSubject.pipe(
      exhaustMap(({ title, backgroundColor }) =>
        from(this.boardFacade.createBoard(title, backgroundColor)).pipe(
          tap({
            next: (board) => {
              this.closeOverlay.emit(false);
              this.router.navigate(['/app/boards', board.id]);
            },
          }),
          catchError(() => of(null)),
        ),
      ),
    ),
    { initialValue: null },
  );

  readonly form = form(
    signal<BoardFormModel>({ title: '', backgroundColor: 'sky' }),
    schema((path) => {
      required(path.title);
      required(path.backgroundColor);
    }),
    {
      submission: {
        action: async () => {
          this.createBoardSubject.next(this.form().value());
        },
      },
    },
  );
}
