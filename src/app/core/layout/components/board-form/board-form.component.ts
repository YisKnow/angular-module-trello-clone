import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  form,
  schema,
  required,
  FormField,
  FormRoot,
} from '@angular/forms/signals';
import { Subject } from 'rxjs';

import { toAsyncSignal, errorMessageOf } from '@shared/utils/async-signal';
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

  private readonly createBoardSubject = new Subject<BoardFormModel>();

  readonly errorMessage = signal<string>('');
  readonly submitting = signal(false);

  readonly form = form(
    signal<BoardFormModel>({ title: '', backgroundColor: 'sky' }),
    schema((path) => {
      required(path.title);
      required(path.backgroundColor);
    }),
    {
      submission: {
        action: async () => {
          this.errorMessage.set('');
          this.createBoardSubject.next(this.form().value());
        },
      },
    },
  );

  // ponytail: AsyncSignal pattern — see shared/utils/async-signal.ts.
  private readonly _createBoardAsync = toAsyncSignal<BoardFormModel, { id: string }>({
    subject: this.createBoardSubject,
    action: ({ title, backgroundColor }) => this.boardFacade.createBoard(title, backgroundColor),
    onStart: () => this.submitting.set(true),
    onSuccess: (board) => {
      this.submitting.set(false);
      this.closeOverlay.emit(false);
      this.router.navigate(['/app/boards', board.id]);
    },
    onError: (err: unknown) => {
      this.submitting.set(false);
      const e = err as { error?: { message?: string }; status?: number };
      this.errorMessage.set(
        e?.error?.message ||
          (e?.status === 401
            ? 'Your session expired. Please log in again.'
            : 'Could not create the board. Please try again.'),
      );
    },
  });
}
