// Injection tokens for the boards feature's repository contracts.
//
// The tokens live in the application layer, not the domain layer, so
// the domain stays free of Angular imports. The infrastructure layer
// provides concrete implementations through these tokens.

import { InjectionToken } from '@angular/core';

import {
  BoardRepository,
  CardRepository,
  ListRepository,
  MeBoardSummary,
} from '../contracts/board-contracts';

export const BOARD_REPOSITORY = new InjectionToken<BoardRepository>('BOARD_REPOSITORY');

export const CARD_REPOSITORY = new InjectionToken<CardRepository>('CARD_REPOSITORY');

export const LIST_REPOSITORY = new InjectionToken<ListRepository>('LIST_REPOSITORY');

export const BOARDS_MY_BOARDS_REPOSITORY = new InjectionToken<MeBoardSummary>(
  'BOARDS_MY_BOARDS_REPOSITORY',
);
