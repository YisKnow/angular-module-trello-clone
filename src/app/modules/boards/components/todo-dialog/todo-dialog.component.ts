import { Component, Inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { Card } from '@models/card.model';

import { ButtonComponent } from '@shared/components/button/button.component';

interface InputData {
  card: Card;
}

interface OutputData {
  rta: boolean;
}

@Component({
  selector: 'app-todo-dialog',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './todo-dialog.component.html',
})
export class TodoDialogComponent {
  card: Card;

  constructor(
    private readonly dialogRef: DialogRef<OutputData>,
    @Inject(DIALOG_DATA) data: InputData,
  ) {
    this.card = data.card;
  }

  close() {
    this.dialogRef.close();
  }

  closeWithRta(rta: boolean) {
    this.dialogRef.close({ rta });
  }
}
