import { describe, it, expect } from 'vitest';

import {
  BUFFER_SPACE,
  getCardPosition,
  getPositionForNewItem,
} from '@features/boards/domain/rules/position.rule';
import { Card } from '@features/boards/domain/entities/card.entity';
import { List } from '@features/boards/domain/entities/list.entity';

const makeCard = (id: string, position: number): Card => ({
  id,
  title: `card-${id}`,
  position,
  list: { id: 'l1', title: 'L', position: 1, cards: [] },
});

const makeList = (id: string, position: number): List => ({
  id,
  title: `list-${id}`,
  position,
  cards: [],
});

describe('position.rule', () => {
  // ---------------------------------------------------------------------
  // getCardPosition
  // ---------------------------------------------------------------------

  it('getCardPosition: single card returns bufferSpace', () => {
    const cards = [makeCard('c1', 100)];
    expect(getCardPosition(cards, 0)).toBe(BUFFER_SPACE);
  });

  it('getCardPosition: first card of many returns half of next position', () => {
    const cards = [makeCard('c1', 100), makeCard('c2', 200)];
    expect(getCardPosition(cards, 0)).toBe(100);
  });

  it('getCardPosition: middle card returns average of neighbours', () => {
    const cards = [makeCard('c1', 100), makeCard('c2', 200), makeCard('c3', 300)];
    // (100 + 300) / 2 = 200
    expect(getCardPosition(cards, 1)).toBe(200);
  });

  it('getCardPosition: last card returns prev + bufferSpace', () => {
    const cards = [makeCard('c1', 100), makeCard('c2', 200), makeCard('c3', 300)];
    expect(getCardPosition(cards, 2)).toBe(200 + BUFFER_SPACE);
  });

  it('getCardPosition: empty array returns 0 (caller must guard)', () => {
    const cards: Card[] = [];
    expect(getCardPosition(cards, 0)).toBe(0);
  });

  // ---------------------------------------------------------------------
  // getPositionForNewItem
  // ---------------------------------------------------------------------

  it('getPositionForNewItem: empty array returns bufferSpace', () => {
    expect(getPositionForNewItem([])).toBe(BUFFER_SPACE);
  });

  it('getPositionForNewItem: non-empty returns last position + bufferSpace', () => {
    const cards = [makeCard('c1', 100), makeCard('c2', 200)];
    expect(getPositionForNewItem(cards)).toBe(200 + BUFFER_SPACE);
  });

  it('getPositionForNewItem: works with List[] as well', () => {
    const lists = [makeList('l1', 1000)];
    expect(getPositionForNewItem(lists)).toBe(1000 + BUFFER_SPACE);
  });

  it('getPositionForNewItem: single-element array returns position + bufferSpace', () => {
    const cards = [makeCard('c1', 500)];
    expect(getPositionForNewItem(cards)).toBe(500 + BUFFER_SPACE);
  });
});
