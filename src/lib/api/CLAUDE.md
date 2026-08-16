# AI Chat Project

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui

## Architecture

The application is a chat frontend.

React components should not make backend requests directly.

All chat API communication goes through:

src/lib/api/

The API contract is defined in:

src/lib/api/types.ts

The current implementation is:

src/lib/api/mock.ts

The selected API implementation is:

src/lib/api/client.ts

## API

The frontend currently uses a mock API so frontend development does not depend on the backend.

When the backend is ready, replace the mock implementation through the API layer rather than adding fetch calls directly to components.

The backend URL will eventually come from:

VITE_API_URL

## React guidelines

- Use functional components.
- Use TypeScript.
- Keep components small and focused.
- Avoid unnecessary global state.
- Keep API logic outside UI components.

## Styling

Use Tailwind CSS and shadcn/ui.

Prefer existing components and utilities before introducing new dependencies.

## Git

Use small, focused commits.

Use conventional-style commit messages such as:

- feat:
- fix:
- refactor:
- chore:
- docs:

## Important

Do not block frontend development waiting for the backend.

Use mock data until the real backend API is available.