// Use cases for the boards feature.
//
// Each use case is a plain class with constructor injection. The
// facade orchestrates them and exposes signals. The application layer
// depends only on repository contracts (no HTTP, no DTOs).

import { Colors } from '@shared/models/colors.model';

import { Board, BoardSummary } from '../../domain/entities/board.entity';
import { Card } from '../../domain/entities/card.entity';
import { List } from '../../domain/entities/list.entity';
import { getCardPosition, getPositionForNewItem } from '../../domain/rules/position.rule';
import {
  CardRepository,
  CreateCardInput,
  ListRepository,
  UpdateCardInput,
} from '../contracts/board-contracts';

export class LoadBoardUseCase {
  constructor(
    private readonly boardRepository: {
      getBoard(id: Board['id']): Promise<Board>;
    },
  ) {}

  execute(id: Board['id']): Promise<Board> {
    return this.boardRepository.getBoard(id);
  }
}

export class CreateBoardUseCase {
  constructor(
    private readonly boardRepository: {
      createBoard(title: string, backgroundColor: Colors): Promise<Board>;
    },
  ) {}

  execute(title: string, backgroundColor: Colors): Promise<Board> {
    return this.boardRepository.createBoard(title, backgroundColor);
  }
}

export class DeleteBoardUseCase {
  constructor(
    private readonly boardRepository: {
      deleteBoard(id: Board['id']): Promise<void>;
    },
  ) {}

  execute(id: Board['id']): Promise<void> {
    return this.boardRepository.deleteBoard(id);
  }
}

export class LoadMyBoardsUseCase {
  constructor(
    private readonly meRepository: {
      getMyBoards(): Promise<BoardSummary[]>;
    },
  ) {}

  execute(): Promise<BoardSummary[]> {
    return this.meRepository.getMyBoards();
  }
}

export class MoveCardUseCase {
  constructor(
    private readonly cardRepository: CardRepository,
    private readonly boardRepository: { getBoard(id: Board['id']): Promise<Board> },
  ) {}

  async execute(
    board: Board,
    card: Card,
    position: number,
    listId: string | number,
  ): Promise<{ next: Board; refresh: Board }> {
    // CDK's moveItemInArray/transferArrayItem already mutated the target
    // list's cards array in place. We must NOT splice the card back in —
    // doing so creates a duplicate. We only need to:
    //   1. Remove the card from any other list (cross-list cleanup)
    //   2. Recompute buffer-space positions on the already-moved array
    const updated: Board = {
      ...board,
      lists: board.lists.map((list) => {
        if (list.id === listId) {
          const newCards = list.cards.map((c, i) => ({
            ...c,
            position: getCardPosition(list.cards, i),
          }));
          return { ...list, cards: newCards };
        }
        return { ...list, cards: list.cards.filter((c) => c.id !== card.id) };
      }),
    };

    const targetList = updated.lists.find((l) => l.id === listId);
    const bufferPosition = targetList ? getCardPosition(targetList.cards, position) : position;

    try {
      await this.cardRepository.update(card.id, {
        position: bufferPosition,
        listId,
      } satisfies UpdateCardInput);
      return { next: updated, refresh: updated };
    } catch (err) {
      const refreshed = await this.boardRepository.getBoard(board.id);
      throw Object.assign(err as Error, { __board: refreshed });
    }
  }
}

export class UpdateCardDescriptionUseCase {
  constructor(private readonly cardRepository: CardRepository) {}

  execute(cardId: Card['id'], description: string): Promise<Card> {
    return this.cardRepository.update(cardId, { description });
  }
}

export class CreateCardUseCase {
  constructor(private readonly cardRepository: CardRepository) {}

  async execute(
    list: List,
    title: string,
    boardId: Board['id'],
  ): Promise<{ card: Card; position: number }> {
    const position = getPositionForNewItem(list.cards);
    const card = await this.cardRepository.create({
      title,
      position,
      listId: list.id,
      boardId,
    } satisfies CreateCardInput);
    return { card, position };
  }
}

export class CreateListUseCase {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(
    title: string,
    boardId: Board['id'],
    existingLists: List[],
  ): Promise<{ list: List; position: number }> {
    const position = getPositionForNewItem(existingLists);
    const list = await this.listRepository.create({
      title,
      position,
      boardId,
    });
    return { list, position };
  }
}
