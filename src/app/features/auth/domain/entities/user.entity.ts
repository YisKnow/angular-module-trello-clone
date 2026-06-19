// Domain User. Backend DTO uses `creationAt` (Spanish-flavored typo).
// Domain uses `createdAt` — mappers convert between the two.
export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}
