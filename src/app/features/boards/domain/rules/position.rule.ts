import { InjectionToken } from '@angular/core';

import { Card } from '../entities/card.entity';
import { List } from '../entities/list.entity';

// Pure domain rule. Returns the position value to assign to a card
// when it is being moved into a list at `currentIndex`.
//
// Buffer-space algorithm:
//   - Single-card list → bufferSpace (65535).
//   - First of many → half of the next card's position.
//   - Middle → average of neighbours.
//   - Last → previous position + bufferSpace.
//   - Empty → 0 (caller should treat as "no-op" or use bufferSpace).
//
// Extracted from the original BoardsService.getPosition so it can be
// unit-tested without Angular DI and reused by use cases.
export const BUFFER_SPACE = 65535;

export function getCardPosition(
  cards: Card[],
  currentIndex: number,
): number {
  if (cards.length === 1) {
    return BUFFER_SPACE;
  }

  if (cards.length > 1 && currentIndex === 0) {
    const onTopPosition = cards[1].position;
    return onTopPosition / 2;
  }

  const lastIndex = cards.length - 1;
  if (cards.length > 2 && currentIndex > 0 && currentIndex < lastIndex) {
    const prevPosition = cards[currentIndex - 1].position;
    const nextPosition = cards[currentIndex + 1].position;
    return (prevPosition + nextPosition) / 2;
  }

  if (cards.length > 1 && currentIndex === lastIndex) {
    const onBottomPosition = cards[lastIndex - 1].position;
    return onBottomPosition + BUFFER_SPACE;
  }

  return 0;
}

// Position for a new card or list appended at the end of a list.
// Empty list → bufferSpace; otherwise last position + bufferSpace.
export function getPositionForNewItem(
  elements: Card[] | List[],
): number {
  if (elements.length === 0) {
    return BUFFER_SPACE;
  }

  const lastIndex = elements.length - 1;
  const onBottomPosition = elements[lastIndex].position;
  return onBottomPosition + BUFFER_SPACE;
}
