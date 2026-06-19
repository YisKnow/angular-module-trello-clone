# TrelloAuth

A Trello clone built with Angular 22, featuring board management, card drag-drop,
and JWT-based authentication.

## Quick start

```bash
npm ci
npm start        # dev server at http://localhost:4200
npm test         # Vitest (82 tests)
npm run lint     # angular-eslint
npm run build    # production build to dist/trello-auth
```

## Features

- **Auth**: Login, register, forgot-password, recovery with JWT tokens in cookies
- **Boards**: Create, view, and drag-drop cards between lists
- **Profile**: View account info
- **Users**: User directory with CDK table

## Architecture

Clean Architecture per feature (4 layers):
- `domain/` — entities, repository contracts, rules
- `application/` — facades, DTOs, mappers
- `infrastructure/` — HTTP repository implementations
- `presentation/` — components, pages

Cross-cutting concerns in `core/` (guards, interceptors, layout, token service).
Shared UI in `shared/` (button, card-color components, models, utils).

## API

Configured in `src/environments/environment.ts` — defaults to `https://fake-trello-api.herokuapp.com`.
