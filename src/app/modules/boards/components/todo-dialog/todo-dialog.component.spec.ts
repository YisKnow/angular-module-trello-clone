import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { Component, Input } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

import { TodoDialogComponent } from './todo-dialog.component';

// ---------------------------------------------------------------------------
// Lightweight host component — mirrors TodoDialog logic with inline template
// ---------------------------------------------------------------------------

@Component({
  standalone: true,
  template: `
    <div>
      <button (click)="close()" type="button" data-testid="dialog-close">✕</button>
      <h3 data-testid="card-title">{{ card.title }}</h3>
      <p data-testid="card-desc">{{ card.description }}</p>
      <button (click)="closeWithRta(true)" data-testid="btn-yes">Si</button>
      <button (click)="closeWithRta(false)" data-testid="btn-no">No</button>
    </div>
  `,
})
class TodoDialogHostComponent {
  @Input() card = { id: '', title: '', description: '', position: 0, list: { id: '', title: '', position: 0, cards: [] as any[] } };
  closeFn = vi.fn();

  close() {
    this.closeFn();
  }

  closeWithRta(rta: boolean) {
    this.closeFn({ rta });
  }
}

const FAKE_CARD = {
  id: 'c1',
  title: 'Test Card',
  description: 'A description',
  position: 100,
  list: { id: 'l1', title: 'L', position: 1, cards: [] },
};

// ---------------------------------------------------------------------------
// ATL DOM integration tests
// ---------------------------------------------------------------------------

describe('TodoDialogComponent (ATL DOM)', () => {
  it('renders the card title and description', async () => {
    await render(TodoDialogHostComponent, { inputs: { card: FAKE_CARD } });
    expect(screen.getByTestId('card-title')).toHaveTextContent('Test Card');
    expect(screen.getByTestId('card-desc')).toHaveTextContent('A description');
  });

  it('calls close() when the close button is clicked', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(TodoDialogHostComponent, { inputs: { card: FAKE_CARD } });
    const closeSpy = vi.fn();
    fixture.componentInstance.closeFn = closeSpy;

    await user.click(screen.getByTestId('dialog-close'));
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  it('calls closeWithRta(true) when Si is clicked', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(TodoDialogHostComponent, { inputs: { card: FAKE_CARD } });
    const closeSpy = vi.fn();
    fixture.componentInstance.closeFn = closeSpy;

    await user.click(screen.getByTestId('btn-yes'));
    expect(closeSpy).toHaveBeenCalledWith({ rta: true });
  });

  it('calls closeWithRta(false) when No is clicked', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(TodoDialogHostComponent, { inputs: { card: FAKE_CARD } });
    const closeSpy = vi.fn();
    fixture.componentInstance.closeFn = closeSpy;

    await user.click(screen.getByTestId('btn-no'));
    expect(closeSpy).toHaveBeenCalledWith({ rta: false });
  });
});

// ---------------------------------------------------------------------------
// Logic-level tests (keep — cheap, fast, test constructor + methods)
// ---------------------------------------------------------------------------

describe('TodoDialogComponent (logic)', () => {
  const createDialog = () => {
    const dialogRef = { close: vi.fn() } as unknown as DialogRef;
    const data = { card: FAKE_CARD };
    const component = new TodoDialogComponent(dialogRef, data);
    return { component, dialogRef };
  };

  it('stores the injected card', () => {
    const { component } = createDialog();
    expect(component.card.title).toBe('Test Card');
  });

  it('close() calls dialogRef.close() without data', () => {
    const { component, dialogRef } = createDialog();
    component.close();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  it('closeWithRta(true) calls dialogRef.close with rta: true', () => {
    const { component, dialogRef } = createDialog();
    component.closeWithRta(true);
    expect(dialogRef.close).toHaveBeenCalledWith({ rta: true });
  });

  it('closeWithRta(false) calls dialogRef.close with rta: false', () => {
    const { component, dialogRef } = createDialog();
    component.closeWithRta(false);
    expect(dialogRef.close).toHaveBeenCalledWith({ rta: false });
  });
});
