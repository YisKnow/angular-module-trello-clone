// ponytail: the Fake Trello API uses lorem.space for avatars which is
// frequently offline. Use a deterministic, always-on service
// (i.pravatar.cc) keyed by a stable seed so each user keeps a
// consistent face across the app.
//
// If the resolved URL itself fails to load, the consumer should
// also wire an onerror handler to swap to initialsAvatar() as a
// last-resort fallback (see avatarFallbackUrl).

const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
      <rect width="80" height="80" fill="#E1F3FE"/>
      <text x="40" y="50" text-anchor="middle" font-family="system-ui" font-size="32" font-weight="600" fill="#1F6C9F">?</text>
    </svg>`,
  );

/**
 * Resolve an avatar URL from any of: a string URL, a number/string seed,
 * or a User-shaped object with id/email/name. Returns a working URL that
 * points at a deterministic, always-on avatar service.
 */
export function avatarUrl(seed: string | number | { id?: number | string; email?: string; name?: string } | null | undefined): string {
  if (seed == null) return FALLBACK_AVATAR;
  if (typeof seed === 'object') {
    // ponytail: prefer the email (more stable across renames) then id
    const s = seed.email || seed.id || seed.name;
    if (!s) return FALLBACK_AVATAR;
    return `https://i.pravatar.cc/150?u=${encodeURIComponent(String(s))}`;
  }
  if (typeof seed === 'string') {
    // Already a URL? Use it. Otherwise treat as a seed.
    if (/^https?:\/\//i.test(seed)) return seed;
    return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed)}`;
  }
  return `https://i.pravatar.cc/150?u=${seed}`;
}

/**
 * Last-resort fallback (a generic "?" glyph on a pastel background).
 * Use as the onerror handler when the resolved avatar URL fails.
 */
export const avatarFallbackUrl = FALLBACK_AVATAR;

/**
 * Build a 2-letter initials string from a user's name.
 * Used by the onerror handler as a CSS background fallback.
 */
export function avatarInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
