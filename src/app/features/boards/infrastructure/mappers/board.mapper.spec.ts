import { describe, it, expect } from 'vitest';

import { BoardMapper } from '@boards/infrastructure/mappers/board.mapper';

describe('BoardMapper', () => {
  it('toDomain maps a wire BoardDto to a Board entity', () => {
    const dto = {
      id: 'b1',
      title: 'Test Board',
      backgroundColor: 'green' as const,
      members: [
        {
          id: 1,
          name: 'Alice',
          email: 'a@b.com',
          avatar: 'pic.png',
          creationAt: '2024-01-01',
          updatedAt: '2024-01-02',
        },
      ],
      lists: [
        {
          id: 'l1',
          title: 'ToDo',
          position: 1,
          cards: [
            {
              id: 'c1',
              title: 'Card 1',
              position: 100,
              list: { id: 'l1', title: 'ToDo', position: 1, cards: [] },
            },
          ],
        },
      ],
      cards: [],
    };
    const board = BoardMapper.toDomain(dto);
    expect(board.id).toBe('b1');
    expect(board.backgroundColor).toBe('green');
    expect(board.members).toHaveLength(1);
    expect(board.members[0].createdAt).toBe('2024-01-01');
    expect(board.lists).toHaveLength(1);
    expect(board.lists[0].cards).toHaveLength(1);
  });

  it('toDomain handles empty lists and empty members', () => {
    const dto = {
      id: 'b2',
      title: 'Empty Board',
      backgroundColor: 'sky' as const,
      members: [],
      lists: [],
      cards: [],
    };
    const board = BoardMapper.toDomain(dto);
    expect(board.members).toEqual([]);
    expect(board.lists).toEqual([]);
  });
});
