# Personal Digital Assistant WebApp

## Overview

A browser-based personal productivity dashboard that integrates Microsoft Outlook (email, calendar), AI assistance, to-do management, and notes into a single unified interface. The application is designed as a personal assistant tool that consolidates daily digital tasks and provides AI-powered suggestions and summaries.

The core purpose is to eliminate context-switching between different productivity tools by providing:
- Outlook calendar and email integration via Microsoft Graph API
- GPT-powered AI assistant for text generation and task suggestions
- Local to-do and notes management with PostgreSQL storage
- Clean, minimalist dashboard interface

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state and caching
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Animations**: Framer Motion for smooth UI transitions
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a widget-based dashboard pattern where each major feature (calendar, mail, todos, assistant) is encapsulated in its own widget component under `client/src/components/widgets/`.

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints under `/api/` prefix
- **Development**: Hot module replacement via Vite middleware in development

The server acts as a proxy for external services (Microsoft Graph, OpenAI) and manages local data persistence. Routes are registered in `server/routes.ts`.

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command
- **Tables**: Users, Todos, Notes, ErpCategories, ErpPrograms, ErpProgramHistory with timestamps

Schema validation uses Zod via drizzle-zod for type-safe insert operations.

### File Storage (Object Storage)
- **Provider**: Replit Object Storage (Google Cloud Storage backend)
- **Purpose**: Persistent storage for uploaded files that survives server restarts
- **Used for**:
  - Company logos (contacts widget)
  - Todo attachments (any file type)
- **Location**: `server/replit_integrations/object_storage/`
- **URLs**: Files are served via `/objects/...` paths
- **Deletion**: Files are automatically deleted from Object Storage when records are deleted

### Authentication & External Services
- **Microsoft Integration**: OAuth2 via Replit Connectors for Outlook access
- **Outlook Client**: Microsoft Graph API client (`@microsoft/microsoft-graph-client`)
- **AI Integration**: OpenAI GPT-4o-mini via user's own API key
- **Token Management**: Access tokens retrieved from Replit Connectors API with automatic refresh

### Build & Deployment
- **Development**: `npm run dev` starts Express with Vite middleware
- **Production Build**: Custom esbuild script bundles server, Vite builds client
- **Output**: Server bundle to `dist/index.cjs`, client assets to `dist/public/`

## External Dependencies

### Microsoft Graph API
- Used for Outlook email reading (`/mailFolders`, `/messages`)
- Calendar event management (`/calendar`, `/events`)
- OneDrive file storage (`/me/drive`)
- Authentication via Replit Connectors OAuth2 flow

### OpenAI API
- Model: GPT-4o-mini for chat completions
- Used for AI assistant chat, email drafting, and content summarization
- Accessed via user's own OpenAI API key (direct API)

### PostgreSQL Database
- Connection via `DATABASE_URL` environment variable
- Uses `pg` driver with Drizzle ORM
- Session storage with `connect-pg-simple`

### Required Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: User's own OpenAI API key
- `MICROSOFT_CLIENT_ID`: Azure AD app client ID for Outlook integration
- `MICROSOFT_CLIENT_SECRET`: Azure AD app client secret for Outlook integration

## ERP Programs Widget

A documentation system for ERP programs with the following features:

### Data Model
- **ErpCategories**: Categories/areas for organizing programs (name, description, color)
- **ErpPrograms**: Individual ERP programs with:
  - programNumber (unique identifier code)
  - title (program name)
  - description (what the program does)
  - instruction (text-based work instructions)
  - instructionUrl (link to external documentation)
  - categoryId (reference to category)
  - lastModifiedBy (user who last changed)
- **ErpProgramHistory**: Change log tracking all modifications with timestamp and user

### API Endpoints
- `GET/POST/PATCH/DELETE /api/erp-categories` - Category management
- `GET/POST/PATCH/DELETE /api/erp-programs` - Program CRUD operations
- `GET /api/erp-programs/search?q=` - Full-text search across programs
- `GET /api/erp-programs/:id/history` - View change history

### Widget Features
- List view with search and category filter
- Detail view showing program information
- Create/Edit form for managing programs
- Change history display with timestamps