import { Card } from './card.entity';

// List entity deliberately omits `showCardForm` — that is a UI concern
// that belongs in the facade/component, not the domain. See
// BoardFacade for the UI-state holder.
export interface List {
  id: string;
  title: string;
  position: number;
  cards: Card[];
}
