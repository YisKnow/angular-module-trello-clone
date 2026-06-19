import { Component, Inject, signal } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { ButtonComponent } from '@shared/components/button/button.component';
import { Card } from '@boards/domain/entities/card.entity';

interface InputData {
  card: Card;
}

interface OutputData {
  rta: boolean;
  description?: string;
}

@Component({
  selector: 'app-todo-dialog',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './todo-dialog.component.html',
})
export class TodoDialogComponent {
  card: Card;

  readonly editingDescription = signal(false);
  readonly descriptionDraft = signal('');
  readonly saving = signal(false);

  constructor(
    private readonly dialogRef: DialogRef<OutputData>,
    @Inject(DIALOG_DATA) data: InputData,
  ) {
    this.card = data.card;
  }

  asInputValue(event: Event): string {
    return (event.target as HTMLTextAreaElement).value;
  }

  startEditingDescription() {
    this.descriptionDraft.set(this.card.description ?? '');
    this.editingDescription.set(true);
  }

  cancelEditingDescription() {
    this.editingDescription.set(false);
    this.descriptionDraft.set('');
  }

  async saveDescription() {
    this.saving.set(true);
    try {
      // ponytail: emit a description update via dialog close so the
      // caller (board page) can persist through the facade.
      this.dialogRef.close({ rta: true, description: this.descriptionDraft() });
    } finally {
      this.saving.set(false);
    }
  }

  close() {
    this.dialogRef.close();
  }

  closeWithRta(rta: boolean) {
    this.dialogRef.close({ rta });
  }
}
