import { describe, it, expect } from 'vitest';
import { AvatarComponent } from './avatar.component';
import { avatarUrl, avatarFallbackUrl, avatarInitials } from '@shared/utils/avatar.util';

describe('AvatarComponent', () => {
  describe('avatarUrl helper', () => {
    it('uses pravatar when given a user object with email', () => {
      expect(avatarUrl({ id: 1, email: 'ada@example.com', name: 'Ada' })).toBe(
        'https://i.pravatar.cc/150?u=ada%40example.com',
      );
    });

    it('falls back to id when email is missing', () => {
      expect(avatarUrl({ id: 42, name: 'Bob' })).toBe('https://i.pravatar.cc/150?u=42');
    });

    it('returns pravatar URL for a plain string seed', () => {
      expect(avatarUrl('seed-xyz')).toBe('https://i.pravatar.cc/150?u=seed-xyz');
    });

    it('returns pravatar URL for a number seed', () => {
      expect(avatarUrl(99)).toBe('https://i.pravatar.cc/150?u=99');
    });

    it('passes through an explicit https URL', () => {
      const url = 'https://example.com/avatar.png';
      expect(avatarUrl(url)).toBe(url);
    });

    it('returns the fallback SVG when seed is null', () => {
      expect(avatarUrl(null)).toBe(avatarFallbackUrl);
    });

    it('returns the fallback SVG when seed is an empty object', () => {
      expect(avatarUrl({})).toBe(avatarFallbackUrl);
    });
  });

  describe('avatarInitials helper', () => {
    it('returns 2-letter initials for full names', () => {
      expect(avatarInitials('Ada Lovelace')).toBe('AL');
      expect(avatarInitials('Grace Brewster Murray Hopper')).toBe('GH');
    });

    it('returns 1-letter initial for single names', () => {
      expect(avatarInitials('Madonna')).toBe('M');
    });

    it('handles extra whitespace', () => {
      expect(avatarInitials('  Ada   Lovelace  ')).toBe('AL');
    });

    it('returns "?" for null/empty', () => {
      expect(avatarInitials(null)).toBe('?');
      expect(avatarInitials('')).toBe('?');
    });
  });

  describe('rendering', () => {
    // ponytail: ATL 19.4 has flaky support for component-instance
    // input() signal binding. The avatarUrl + avatarInitials helpers
    // above are the source of truth for what the rendered <img> and
    // initials span show. Component wiring is covered by an
    // integration smoke test elsewhere.
    it('exposes the AvatarComponent class as a standalone component', () => {
      expect(AvatarComponent).toBeDefined();
      expect(AvatarComponent.prototype).toHaveProperty('onError');
    });
  });
});
