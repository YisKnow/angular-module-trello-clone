import { Component, OnInit } from '@angular/core';

import { faBox, faWaveSquare, faClock, faAngleUp, faAngleDown, faHeart, faBorderAll, faUsers, faGear } from '@fortawesome/free-solid-svg-icons';
import { faTrello } from '@fortawesome/free-brands-svg-icons';

import { Board } from '@models/board.model';

import { MeService } from '@services/me.service';

@Component({
  selector: 'app-boards',
  templateUrl: './boards.component.html'
})
export class BoardsComponent implements OnInit {
  boards: Board[] = [];

  faTrello = faTrello;
  faBox = faBox;
  faWaveSquare = faWaveSquare;
  faClock = faClock;
  faAngleUp = faAngleUp;
  faAngleDown = faAngleDown;
  faHeart = faHeart;
  faBorderAll = faBorderAll;
  faUsers = faUsers;
  faGear = faGear;

  constructor(private readonly meService: MeService) { }

  ngOnInit() {
    this.getMyBoards();
  }

  getMyBoards() {
    this.meService.getMeBoards().subscribe(boards => {
      this.boards = boards;
    });
  }
}
