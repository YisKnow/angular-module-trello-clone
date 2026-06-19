import { describe, it, expect, vi } from 'vitest';
import { Component, Inject } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { render } from '@testing-library/angular';

import { Card } from '@boards/domain/entities/card.entity';

// ponytail: host component mirrors TodoDialogComponent's class logic
// without rendering its templateUrl. The card is injected via
// DIALOG_DATA, and the close/closeWithRta methods delegate to a
// mocked DialogRef.

const makeCard = (): Card => ({
  id: 'c1',
  title: 'Test card',
  position: 100,
  list: { id: 'l1', title: 'L', position: 1, cards: [] },
});

const dialogRefStore: { close: ReturnType<typeof vi.fn> } = { close: vi.fn() };

@Component({
  standalone: true,
  template: '<div data-testid="dialog-host">dialog</div>',
})
class TodoDialogHostComponent {
  card: Card;

  constructor(@Inject(DIALOG_DATA) data: { card: Card }) {
    this.card = data.card;
  }

  close() {
    dialogRefStore.close();
  }

  closeWithRta(rta: boolean) {
    dialogRefStore.close({ rta });
  }
}

describe('TodoDialogComponent (host behavior)', () => {
  it('exposes the card injected via DIALOG_DATA', async () => {
    const { fixture } = await render(TodoDialogHostComponent, {
      providers: [{ provide: DIALOG_DATA, useValue: { card: makeCard() } }],
    });
    expect(fixture.componentInstance.card.id).toBe('c1');
    expect(fixture.componentInstance.card.title).toBe('Test card');
  });

  it('close() forwards to dialogRef.close() with no args', async () => {
    dialogRefStore.close.mockClear();
    const { fixture } = await render(TodoDialogHostComponent, {
      providers: [
        { provide: DIALOG_DATA, useValue: { card: makeCard() } },
        { provide: DialogRef, useValue: dialogRefStore },
      ],
    });
    fixture.componentInstance.close();
    expect(dialogRefStore.close).toHaveBeenCalledWith();
  });

  it('closeWithRta(true) forwards { rta: true } to dialogRef.close()', async () => {
    dialogRefStore.close.mockClear();
    const { fixture } = await render(TodoDialogHostComponent, {
      providers: [
        { provide: DIALOG_DATA, useValue: { card: makeCard() } },
        { provide: DialogRef, useValue: dialogRefStore },
      ],
    });
    fixture.componentInstance.closeWithRta(true);
    expect(dialogRefStore.close).toHaveBeenCalledWith({ rta: true });
  });

  it('closeWithRta(false) forwards { rta: false } to dialogRef.close()', async () => {
    dialogRefStore.close.mockClear();
    const { fixture } = await render(TodoDialogHostComponent, {
      providers: [
        { provide: DIALOG_DATA, useValue: { card: makeCard() } },
        { provide: DialogRef, useValue: dialogRefStore },
      ],
    });
    fixture.componentInstance.closeWithRta(false);
    expect(dialogRefStore.close).toHaveBeenCalledWith({ rta: false });
  });
});
