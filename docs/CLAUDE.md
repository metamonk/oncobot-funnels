# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OncoBot (oncobot-v3) is an AI-powered search engine built with Next.js 15, TypeScript, and multiple AI providers. It provides comprehensive search capabilities across web, academic papers, social media, entertainment, and more.

## Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Start development server with Turbopack
pnpm dev

# Build for production with Turbopack
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Analyze dependencies
pnpm knip

# Database migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
pnpm drizzle-kit studio  # Visual database browser
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.4.2 with App Router and Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with PostCSS
- **UI Components**: Shadcn/UI (built on Radix UI)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth (Polar's auth library)
- **AI Integration**: Vercel AI SDK with support for xAI, Anthropic, Google, OpenAI, Groq, and Mistral

### Key Directory Structure

- `/app`: Next.js App Router pages and API routes
  - `(auth)`: Authentication pages
  - `(search)`: Main search functionality
  - `api/`: API endpoints for various services
  - `search/[id]`: Dynamic search result pages

- `/components`: React components organized by purpose
  - UI components following Shadcn/UI patterns
  - Feature components for chat, search, maps, charts

- `/lib`: Core application logic
  - `auth.ts`: Authentication configuration
  - `db/`: Database schema and queries
  - `tools/`: AI tool implementations for search, analysis, etc.

- `/ai`: AI provider configurations

### AI Tools System

The application uses a modular tool system in `/lib/tools/` where each tool:
1. Implements a specific search or analysis capability
2. Returns structured data that can be rendered by corresponding components
3. Can be composed into search groups for different use cases

Key tools include:
- Web search (Exa, Tavily)
- Academic search
- Social media search (X/Twitter, Reddit)
- Code execution (Daytona sandbox)
- Financial data (stocks, currency)
- Location services (maps, weather)

### Database Schema

Database is managed with Drizzle ORM. Schema is defined in `/lib/db/schema.ts`. Use Drizzle Kit for migrations:
- Generate migrations: `pnpm drizzle-kit generate`
- Apply migrations: `pnpm drizzle-kit migrate`
- View database: `pnpm drizzle-kit studio`

### Environment Variables

Required environment variables are documented in `.env.example`. Key categories:
- AI provider API keys (XAI_API_KEY, OPENAI_API_KEY, etc.)
- Database connection (DATABASE_URL)
- Authentication (BETTER_AUTH_SECRET, OAuth client IDs)
- External services (search APIs, weather, maps, etc.)

### Component Patterns

- Components use TypeScript with proper type definitions
- Follow existing patterns for imports and exports
- UI components are built on Shadcn/UI primitives
- Use Tailwind CSS classes for styling
- Leverage existing utility functions in `/lib/utils.ts`

### API Routes

API routes in `/app/api/` handle:
- Authentication callbacks
- Tool executions
- External API integrations
- Streaming AI responses

### Testing

Currently no testing framework is configured. When implementing tests, consider the project's TypeScript and Next.js setup.