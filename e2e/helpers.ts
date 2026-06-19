import { Page } from '@playwright/test';

export function fakeJwt(expiresInSec = 3600): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: '1',
      email: 'test@example.com',
      name: 'Test User',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSec,
    }),
  );
  const sig = btoa('test-signature');
  return `${header}.${payload}.${sig}`;
}

// ponytail: shapes mirror the actual DTOs in
// src/app/features/auth/application/dtos/auth.dto.ts and
// src/app/features/boards/application/dtos/board.dto.ts.
const userDto = (overrides: Partial<{ name: string; email: string }> = {}) => ({
  id: 1,
  name: overrides.name ?? 'Test User',
  email: overrides.email ?? 'test@example.com',
  avatar: 'https://i.pravatar.cc/150?u=test',
  creationAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
});

const cardDto = (id: string, title: string, position: number, listId: string) => ({
  id,
  title,
  description: 'Card description',
  position,
  list: {
    id: listId,
    title: 'Todo',
    position: 65535,
    cards: [],
  },
});

const listDto = (id: string, title: string, position: number, cards: ReturnType<typeof cardDto>[]) => ({
  id,
  title,
  position,
  cards,
});

export interface ApiMockOptions {
  meBoards?: { id: string; title: string; backgroundColor: string }[];
  meProfile?: { id: number; name: string; email: string };
}

export async function mockApi(page: Page, options: ApiMockOptions = {}) {
  const boards = options.meBoards ?? [
    { id: 'b1', title: 'My roadmap', backgroundColor: 'primary' },
    { id: 'b2', title: 'Personal', backgroundColor: 'success' },
  ];
  const profile = options.meProfile ?? { id: 1, name: 'Test User', email: 'test@example.com' };

  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/auth/login') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: fakeJwt(),
          refresh_token: fakeJwt(86400),
        }),
      });
    }

    if (url.includes('/auth/register') && method === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json', body: 'null' });
    }

    if (url.includes('/me/profile') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(userDto(profile)),
      });
    }

    if (url.includes('/me/boards') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(boards),
      });
    }

    if (url.match(/\/boards\/\w+$/) && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'b1',
          title: 'My roadmap',
          backgroundColor: 'primary',
          members: [userDto(profile)],
          lists: [
            listDto('l1', 'Todo', 65535, [
              cardDto('c1', 'First card', 65535, 'l1'),
              cardDto('c2', 'Second card', 131070, 'l1'),
            ]),
            listDto('l2', 'Done', 131070, []),
          ],
          cards: [
            cardDto('c1', 'First card', 65535, 'l1'),
            cardDto('c2', 'Second card', 131070, 'l1'),
          ],
        }),
      });
    }

    if (url.match(/\/cards\/\w+$/) && method === 'PUT') {
      const reqBody = route.request().postDataJSON() ?? {};
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          cardDto('c1', reqBody.title ?? 'First card', reqBody.position ?? 65535, 'l1'),
        ),
      });
    }

    if (url.match(/\/boards\/\w+$/) && method === 'DELETE') {
      return route.fulfill({ status: 204, body: '' });
    }

    if (url.match(/\/boards$/) && method === 'POST') {
      const reqBody = route.request().postDataJSON() ?? {};
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'b-new',
          title: reqBody.title ?? 'New board',
          backgroundColor: reqBody.backgroundColor ?? 'sky',
          members: [],
          lists: [],
          cards: [],
        }),
      });
    }

    if (url.includes('/auth/refresh-token') && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ access_token: fakeJwt(), refresh_token: fakeJwt(86400) }),
      });
    }

    if (url.match(/\/users(\?|$)/) && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}
