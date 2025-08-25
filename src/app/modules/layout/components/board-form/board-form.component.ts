import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators, FormControl } from '@angular/forms';

import { faCheck } from '@fortawesome/free-solid-svg-icons';

import { Colors } from '@models/colors.model';

import { BoardsService } from '@services/boards.service';

@Component({
  selector: 'app-board-form',
  templateUrl: './board-form.component.html',
})
export class BoardFormComponent {
  @Output() closeOverlay = new EventEmitter<boolean>();

  faCheck = faCheck;

  form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required]],
    backgroundColor: new FormControl<Colors>('sky', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(private readonly formBuilder: FormBuilder, private readonly boardsService: BoardsService, private readonly router: Router) { }

  doSave() {
    if (this.form.valid) {
      const { title, backgroundColor } = this.form.getRawValue();

      this.boardsService.createBoard(title, backgroundColor).subscribe({
        next: (board) => {
          this.closeOverlay.emit(false);
          this.router.navigate(['/app/boards', board.id]);
        }
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
