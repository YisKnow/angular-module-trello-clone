import { Component, Inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { ButtonComponent } from '@shared/components/button/button.component';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface ConfirmDialogResult {
  confirmed: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <div class="p-6 bg-white rounded-2xl border border-[#EAEAEA] max-w-sm relative">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ data.title }}</h3>
      <p class="text-sm text-gray-600 mb-6">{{ data.message }}</p>
      <div class="flex items-center gap-2 justify-end">
        <app-btn
          typeBtn="button"
          color="light"
          data-testid="confirm-cancel"
          (click)="cancel()"
        >
          {{ data.cancelLabel ?? 'Cancel' }}
        </app-btn>
        <app-btn
          typeBtn="button"
          [color]="data.destructive ? 'danger' : 'primary'"
          data-testid="confirm-ok"
          (click)="confirm()"
        >
          {{ data.confirmLabel ?? 'Confirm' }}
        </app-btn>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  constructor(
    private readonly dialogRef: DialogRef<ConfirmDialogResult>,
    @Inject(DIALOG_DATA) readonly data: ConfirmDialogData,
  ) {}

  cancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  confirm(): void {
    this.dialogRef.close({ confirmed: true });
  }
}
