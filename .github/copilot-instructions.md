# AI Rules for {{project-name}}

{{project-description}}

## Tech Stack

- Astro 5
- TypeScript 5
- React 19
- Tailwind 4
- Shadcn/ui

## Developer Workflows

- **Run development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`
- **Run linter**: `npm run lint`
- **Fix lint issues**: `npm run lint:fix`

## Project Structure

When introducing changes to the project, always follow the directory structure below:

- `./src` - source code
- `./src/layouts` - Astro layouts
- `./src/pages` - Astro pages
- `./src/pages/api` - API endpoints
- `./src/middleware/index.ts` - Astro middleware
- `./src/db` - Supabase clients and types
- `./supabase/migrations` - Supabase database migrations
- `./src/types.ts` - Shared types for backend and frontend (Entities, DTOs)
- `./src/components` - Client-side components written in Astro (static) and React (dynamic)
- `./src/components/ui` - Client-side components from Shadcn/ui
- `./src/lib` - Services and helpers
- `./src/assets` - static internal assets
- `./public` - public assets

When modifying the directory structure, always update this section.

## Coding practices

### Guidelines for clean code

- Use feedback from linters to improve the code when making changes.
- Prioritize error handling and edge cases.
- Handle errors and edge cases at the beginning of functions.
- Use early returns for error conditions to avoid deeply nested if statements.
- Place the happy path last in the function for improved readability.
- Avoid unnecessary else statements; use if-return pattern instead.
- Use guard clauses to handle preconditions and invalid states early.
- Implement proper error logging and user-friendly error messages.
- Consider using custom error types or error factories for consistent error handling.

## Frontend

### General Guidelines

- Use Astro components (.astro) for static content and layout.
- Implement framework components in React only when interactivity is needed.

### Shadcn/ui Components

- Installed components are located in `src/components/ui`.
- Import components using the `@/components/ui/...` alias.
- To add new components, use the CLI: `npx shadcn@latest add [component-name]`.

### Guidelines for Styling (Tailwind)

- Use the `@layer` directive to organize styles into components, utilities, and base layers.
- Use arbitrary values with square brackets (e.g., `w-[123px]`) for precise one-off designs.
- Implement dark mode with the `dark:` variant.
- Use responsive variants (`sm:`, `md:`, `lg:`, etc.) for adaptive designs.

### Guidelines for Accessibility (ARIA)

- Use ARIA landmarks to identify regions of the page (`main`, `navigation`, `search`).
- Apply appropriate ARIA roles to custom interface elements.
- Use `aria-expanded` and `aria-controls` for expandable content.
- Use `aria-live` regions for dynamic content updates.

### Guidelines for Astro

- Leverage View Transitions API for smooth page transitions.
- Use content collections with type safety for structured content.
- For API routes (`src/pages/api`), use uppercase method names for handlers (e.g., `export function GET(...)`).
- Use `export const prerender = false` for dynamic API routes.
- Use Zod for input validation in API routes.
- Extract business logic into services in `src/lib/`.
- Use middleware (`src/middleware/index.ts`) for request/response modification.

### Guidelines for React

- Use functional components with hooks.
- Do not use Next.js specific directives like `"use client"`.
- Extract reusable logic into custom hooks in `src/components/hooks`.
- Use `React.memo()` for expensive components that render often with the same props.
- Use `useCallback` for event handlers passed to child components to prevent unnecessary re-renders.

## Backend and Database

### Supabase

- Use Supabase for backend services, including authentication and database.
- In Astro components and API routes, access the Supabase client via `context.locals.supabase` instead of importing `supabaseClient` directly. This is handled by middleware.
- Use Zod schemas to validate data exchanged with the backend.

### Database Migrations

- Create new migration files in the `supabase/migrations/` directory.
- File names must follow the format `YYYYMMDDHHmmss_short_description.sql`.
- Always enable Row Level Security (RLS) on new tables.
- Create granular RLS policies for each action (`select`, `insert`, `update`, `delete`) and role (`anon`, `authenticated`).