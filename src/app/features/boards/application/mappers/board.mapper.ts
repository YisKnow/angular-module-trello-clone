import { Board, BoardSummary } from '../../domain/entities/board.entity';
import { Card } from '../../domain/entities/card.entity';
import { List } from '../../domain/entities/list.entity';
import { User } from '@features/auth/domain/entities/user.entity';
import { UserDto } from '@features/auth/application/dtos/auth.dto';
import { AuthMapper } from '@features/auth/application/mappers/auth.mapper';
import {
  BoardDto,
  BoardSummaryDto,
  CardDto,
  ListDto,
} from '../dtos/board.dto';

// Pure mappers — convert wire DTOs to domain entities (and back when
// needed for create/update payloads).
export const BoardMapper = {
  toDomain(dto: BoardDto): Board {
    return {
      id: dto.id,
      title: dto.title,
      backgroundColor: dto.backgroundColor,
      // ponytail: API may omit members/cards; cards live inside lists.
      members: (dto.members ?? []).map(toUser),
      lists: dto.lists.map(toList),
      cards: (dto.cards ?? []).map(toCard),
    };
  },
  toSummary(dto: BoardSummaryDto): BoardSummary {
    return {
      id: dto.id,
      title: dto.title,
      backgroundColor: dto.backgroundColor,
    };
  },
};

export const ListMapper = {
  toDomain(dto: ListDto): List {
    return {
      id: dto.id,
      title: dto.title,
      position: dto.position,
      cards: dto.cards.map(toCard),
    };
  },
};

export const CardMapper = {
  toDomain(dto: CardDto): Card {
    return {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      position: dto.position,
      // ponytail: cards nested inside lists omit the list field.
      list: dto.list
        ? {
            id: dto.list.id,
            title: dto.list.title,
            position: dto.list.position,
            cards: [],
          }
        : undefined,
    };
  },
};

function toList(dto: ListDto): List {
  return ListMapper.toDomain(dto);
}

function toCard(dto: CardDto): Card {
  return CardMapper.toDomain(dto);
}

function toUser(dto: UserDto): User {
  return AuthMapper.toUser(dto);
}
