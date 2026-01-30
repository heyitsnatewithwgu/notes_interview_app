# 📝 Collaborative Notes App

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?logo=nestjs)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A modern, feature-rich collaborative notes application built with React, NestJS, and PostgreSQL. Features real-time-like collaboration with optimistic locking, drag-and-drop organization, markdown support, and a beautiful dark mode UI.

---

## 📑 Table of Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Development Setup](#-development-setup)
- [Project Requirements](#-project-requirements)
- [Development Journey](#-development-journey)
- [Documentation](#-documentation)
- [Tech Stack](#-tech-stack)
- [API Reference](#-api-reference)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Functionality
- ✅ Create, edit, and delete notes
- ✅ Rich markdown editor with live preview
- ✅ Auto-save with visual status indicator
- ✅ Optimistic locking for concurrent edit handling
- ✅ Conflict resolution UI with side-by-side comparison

### Organization
- 🎨 8 customizable note colors
- 🔀 Drag-and-drop reordering
- 🔍 Real-time search and filtering
- 📊 Character and word count

### User Experience
- 🌙 Dark mode with persistence
- ⚡ Smooth animations (Framer Motion)
- 🔔 Toast notifications
- ⌨️ Keyboard shortcuts (`Ctrl+N`, `Ctrl+S`)
- 📱 Fully responsive design
- ⏱️ Relative timestamps ("2 minutes ago")

### Infrastructure
- 🐳 Fully Dockerized (dev & production)
- 🗄️ PostgreSQL with TypeORM
- 🔄 Hot reload in development
- 🚀 Production-ready with nginx

---

## 📸 Screenshots

> *Screenshots coming soon*

| Light Mode | Dark Mode |
|------------|-----------|
| ![Light Mode](docs/screenshots/light-mode.png) | ![Dark Mode](docs/screenshots/dark-mode.png) |

| Note Editor | Conflict Resolution |
|-------------|---------------------|
| ![Editor](docs/screenshots/editor.png) | ![Conflict](docs/screenshots/conflict.png) |

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Docker Compose Network                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │   ┌─────────────┐      ┌─────────────┐      ┌─────────┐  │  │
│  │   │   Frontend  │      │   Backend   │      │ Postgres│  │  │
│  │   │   (React)   │─────▶│  (NestJS)   │─────▶│   DB    │  │  │
│  │   │   :5173     │      │   :3000     │      │  :5432  │  │  │
│  │   └─────────────┘      └─────────────┘      └─────────┘  │  │
│  │         │                    │                    │      │  │
│  │         │              REST API              TypeORM     │  │
│  │         │            (JSON/HTTP)           (SQL/TCP)     │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React App                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │    Pages    │    │ Components  │    │    Hooks    │        │
│   ├─────────────┤    ├─────────────┤    ├─────────────┤        │
│   │ • NotesList │    │ • NoteCard  │    │• useDarkMode│        │
│   │ • NoteEdit  │    │ • ColorPick │    │• useDebounce│        │
│   │             │    │ • ThemeTogg │    │             │        │
│   │             │    │ • EmptyState│    │             │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│          │                  │                  │                │
│          └──────────────────┼──────────────────┘                │
│                             ▼                                    │
│                    ┌─────────────┐                              │
│                    │  API Client │                              │
│                    │  (fetch)    │                              │
│                    └─────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        NestJS App                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     NotesModule                          │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │   │
│   │  │  Controller  │  │   Service    │  │    Entity    │   │   │
│   │  │              │  │              │  │              │   │   │
│   │  │ GET /notes   │  │ • findAll()  │  │ • id         │   │   │
│   │  │ GET /:id     │─▶│ • findOne()  │─▶│ • title      │   │   │
│   │  │ POST /notes  │  │ • create()   │  │ • body       │   │   │
│   │  │ PUT /:id     │  │ • update()   │  │ • color      │   │   │
│   │  │ PATCH /reord │  │ • reorder()  │  │ • position   │   │   │
│   │  │ DELETE /:id  │  │ • delete()   │  │ • timestamps │   │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                             │                                    │
│                             ▼                                    │
│                    ┌─────────────┐                              │
│                    │   TypeORM   │                              │
│                    │ Repository  │                              │
│                    └─────────────┘                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Conflict Resolution

```
┌────────┐          ┌────────┐          ┌────────┐
│ User A │          │ Server │          │ User B │
└───┬────┘          └───┬────┘          └───┬────┘
    │                   │                   │
    │  GET /notes/1     │                   │
    │──────────────────▶│                   │
    │  {updatedAt: T1}  │                   │
    │◀──────────────────│                   │
    │                   │   GET /notes/1    │
    │                   │◀──────────────────│
    │                   │  {updatedAt: T1}  │
    │                   │──────────────────▶│
    │                   │                   │
    │                   │   PUT /notes/1    │
    │                   │   expected: T1    │
    │                   │◀──────────────────│
    │                   │  ✓ {updatedAt:T2} │
    │                   │──────────────────▶│
    │                   │                   │
    │  PUT /notes/1     │                   │
    │  expected: T1     │                   │
    │──────────────────▶│                   │
    │  ✗ 409 Conflict   │                   │
    │  {currentNote}    │                   │
    │◀──────────────────│                   │
    │                   │                   │
    │  [User resolves]  │                   │
    │                   │                   │
    │  PUT /notes/1     │                   │
    │  expected: T2     │                   │
    │──────────────────▶│                   │
    │  ✓ {updatedAt:T3} │                   │
    │◀──────────────────│                   │
    │                   │                   │
```

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) (v20+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2+)

### Run with Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd "notes app - interview"

# Start all services (PostgreSQL, Backend, Frontend)
docker-compose -f docker-compose.dev.yml up --build

# Access the app
# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
```

### Stop Services

```bash
docker-compose -f docker-compose.dev.yml down
```

---

## 🛠️ Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose (for PostgreSQL)

### Option 1: Full Docker Development (Recommended)

Best for: Quick setup, consistent environment

```bash
# Start all services with hot reload
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Rebuild after package.json changes
docker-compose -f docker-compose.dev.yml up --build
```

### Option 2: Local Development with Docker DB

Best for: Faster iteration, IDE integration

```bash
# 1. Start only PostgreSQL
docker-compose -f docker-compose.dev.yml up postgres -d

# 2. Start Backend
cd backend
npm install
npm run start:dev
# Runs on http://localhost:3000

# 3. Start Frontend (new terminal)
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Environment Variables

Create `.env` in the root directory:

```env
# Database
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=notes

# Frontend
VITE_API_URL=http://localhost:3000
```

### Useful Commands

```bash
# Check TypeScript (Frontend)
cd frontend && npx tsc --noEmit

# Check TypeScript (Backend)
cd backend && npx tsc --noEmit

# Access PostgreSQL
docker exec -it notesapp-interview-postgres-1 psql -U postgres -d notes

# View all tables
\dt

# Query notes
SELECT * FROM notes;
```

---

## 📋 Project Requirements

This application was built as a technical interview challenge. Below are the original requirements:

### Challenge Overview

> **Challenge #1: Collaborative Notes App**
>
> **Time:** 60 minutes
> **Format:** Live coding with screen sharing
> **Tech:** Your choice (any language, framework, or tooling); Claude Code/Codex/Cursor/etc. use highly encouraged.

### Problem Statement

> Build a small notes app where users can create, edit, and view notes.
> Assume that the same note may be edited concurrently (e.g., two browser tabs, two devices). You do not need to implement real-time collaboration, but you should handle concurrent edits gracefully, at least at the API and UX level.

### Core Requirements

#### Backend (or equivalent server logic)
> Implement a notes resource with at least the following fields:
> - `id`
> - `title`
> - `body`
> - `updatedAt`
>
> Minimum API behavior:
> - List notes
> - Fetch a single note
> - Create a note
> - Update a note
> - (Delete is optional)
>
> Persistence is not required (in-memory storage is fine).

#### Frontend (or equivalent client)
> - A list of notes
> - An edit view for a single note
> - A way to save changes (save button or autosave)
>
> The UI should:
> - Handle loading and error states
> - React sensibly if a save fails due to a conflict
>   - e.g. show a warning, refresh, or ask the user what to do

### Expectations & Guidance

> - Focus on clarity, correctness, and tradeoffs, not polish.
> - You may scaffold quickly, use libraries, or keep things minimal.
> - If you run out of time, explain what you would do next.
> - Talking through your approach is encouraged.

---

## 🛤️ Development Journey

This section documents the phases and decisions made while building this application.

### Phase 1: Project Setup & Architecture
*Foundation and scaffolding*

| Step | Description |
|------|-------------|
| 1.1 | Created monorepo structure (`/backend`, `/frontend`) |
| 1.2 | Initialized NestJS backend with TypeScript |
| 1.3 | Initialized React frontend with Vite and TypeScript |
| 1.4 | Configured Tailwind CSS v4 and shadcn/ui |
| 1.5 | Set up React Router v7 for client-side routing |

### Phase 2: Core API Development
*RESTful backend with conflict handling*

| Step | Description |
|------|-------------|
| 2.1 | Created Note entity with TypeScript interface |
| 2.2 | Implemented in-memory storage (initial approach) |
| 2.3 | Built CRUD endpoints (GET, POST, PUT, DELETE) |
| 2.4 | Added optimistic locking via `updatedAt` comparison |
| 2.5 | Implemented 409 Conflict responses with current state |

### Phase 3: Basic Frontend
*Functional UI with core features*

| Step | Description |
|------|-------------|
| 3.1 | Created NotesList page with card layout |
| 3.2 | Created NoteEdit page with form inputs |
| 3.3 | Built API client with error handling |
| 3.4 | Implemented conflict resolution dialog |
| 3.5 | Added loading and error states |

### Phase 4: Dockerization & PostgreSQL
*Production-ready infrastructure*

| Step | Description |
|------|-------------|
| 4.1 | Added TypeORM with PostgreSQL driver |
| 4.2 | Migrated Note entity to TypeORM decorators |
| 4.3 | Created multi-stage Dockerfiles (dev & prod) |
| 4.4 | Set up docker-compose for development |
| 4.5 | Configured nginx for production frontend serving |
| 4.6 | Added environment variable configuration |

### Phase 5: Enhanced User Experience
*Polish and advanced features*

| Step | Description |
|------|-------------|
| 5.1 | Added Framer Motion animations throughout |
| 5.2 | Implemented dark mode with localStorage persistence |
| 5.3 | Added toast notifications (Sonner) |
| 5.4 | Built skeleton loaders for better perceived performance |
| 5.5 | Created empty state with illustration |
| 5.6 | Added keyboard shortcuts (Ctrl+N, Ctrl+S) |

### Phase 6: Advanced Features
*Rich functionality beyond requirements*

| Step | Description |
|------|-------------|
| 6.1 | Added note colors (8 options) with color picker |
| 6.2 | Implemented drag-and-drop reordering (dnd-kit) |
| 6.3 | Built real-time search/filter functionality |
| 6.4 | Added auto-save with debouncing and status indicator |
| 6.5 | Implemented markdown editor with live preview |
| 6.6 | Added character and word count |
| 6.7 | Added relative timestamps with date-fns |

### Phase 7: Documentation
*Project documentation and Claude integration*

| Step | Description |
|------|-------------|
| 7.1 | Created frontend `.claude/` configuration |
| 7.2 | Created backend `.claude/` configuration |
| 7.3 | Built research documentation (tech stack, outline, rules) |
| 7.4 | Created comprehensive README |

---

## 📚 Documentation

### Directory Structure

```
notes app - interview/
├── 📁 frontend/
│   ├── 📁 .claude/              # Frontend-specific Claude docs
│   │   ├── settings.json        # Project configuration
│   │   ├── rules.md             # Development rules & patterns
│   │   └── skills.md            # Available skills/commands
│   └── 📁 src/                  # Source code
├── 📁 backend/
│   ├── 📁 .claude/              # Backend-specific Claude docs
│   │   ├── settings.json        # Project configuration
│   │   ├── rules.md             # Development rules & patterns
│   │   └── skills.md            # Available skills/commands
│   └── 📁 src/                  # Source code
├── 📁 research/                 # General project documentation
│   ├── tech-stack.md            # Technology documentation
│   ├── project-outline.md       # Features & architecture
│   └── project-rules.md         # Coding standards & guidelines
└── 📄 README.md                 # This file
```

### Using Claude Documentation

The `.claude/` directories contain context for AI-assisted development:

#### Frontend Skills (`frontend/.claude/skills.md`)
```
/add-component   - Create a new React component
/add-hook        - Create a custom React hook
/add-page        - Create a new page with routing
/add-shadcn      - Add a shadcn/ui component
/add-animation   - Add Framer Motion animations
```

#### Backend Skills (`backend/.claude/skills.md`)
```
/add-module      - Create a new NestJS module
/add-entity      - Add a TypeORM entity
/add-endpoint    - Add a REST endpoint
/test-api        - Test API with curl commands
/check-db        - Access PostgreSQL database
```

### Research Documentation

| File | Purpose |
|------|---------|
| `research/tech-stack.md` | Complete technology versions and purposes |
| `research/project-outline.md` | Feature checklist, architecture, data model |
| `research/project-rules.md` | Git workflow, testing, code standards |

---

## 🔧 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Vite | 7.x | Build tool |
| React Router | 7.x | Routing |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | latest | UI components |
| Framer Motion | latest | Animations |
| Sonner | latest | Toast notifications |
| date-fns | latest | Date formatting |
| react-markdown | latest | Markdown rendering |
| @dnd-kit | latest | Drag and drop |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 11.x | Server framework |
| TypeScript | 5.x | Type safety |
| TypeORM | 0.3.x | ORM |
| PostgreSQL | 16 | Database |
| class-validator | latest | Validation |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Orchestration |
| nginx | Static serving & reverse proxy |

---

## 📡 API Reference

### Base URL
```
http://localhost:3000
```

### Endpoints

#### List Notes
```http
GET /notes
```
**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "title": "Note Title",
    "body": "Note content...",
    "color": "default",
    "position": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Get Note
```http
GET /notes/:id
```
**Response:** `200 OK` or `404 Not Found`

#### Create Note
```http
POST /notes
Content-Type: application/json

{
  "title": "New Note",
  "body": "Content",
  "color": "blue"
}
```
**Response:** `201 Created`

#### Update Note
```http
PUT /notes/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "body": "Updated content",
  "color": "green",
  "expectedUpdatedAt": "2024-01-01T00:00:00.000Z"
}
```
**Response:** `200 OK` or `409 Conflict`

#### Reorder Notes
```http
PATCH /notes/reorder
Content-Type: application/json

{
  "noteIds": ["uuid1", "uuid2", "uuid3"]
}
```
**Response:** `200 OK`

#### Delete Note
```http
DELETE /notes/:id
```
**Response:** `204 No Content` or `404 Not Found`

---

## 🤝 Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and type checking
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow the rules in `frontend/.claude/rules.md` and `backend/.claude/rules.md`
- Use TypeScript strict mode
- Write meaningful commit messages (conventional commits)
- Add tests for new features
- Update documentation as needed

### Commit Message Format

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
Scope: frontend, backend, docker, docs
```

### Code Style

- **Frontend:** Follow React/TypeScript best practices, use Tailwind for styling
- **Backend:** Follow NestJS conventions, use decorators for validation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components
- [NestJS](https://nestjs.com/) for the excellent backend framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Framer Motion](https://www.framer.com/motion/) for smooth animations

---

<div align="center">

**Built with ❤️ using Claude Code**

[Report Bug](issues) · [Request Feature](issues)

</div>
