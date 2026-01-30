# Project Outline

## Project Name
Collaborative Notes App

## Description
A modern notes application that allows users to create, edit, and organize notes with support for concurrent editing through optimistic locking conflict resolution.

---

## Core Features

### Note Management
- [x] Create new notes
- [x] Edit note title and body
- [x] Delete notes
- [x] List all notes
- [x] View single note

### Collaboration Features
- [x] Optimistic locking with `updatedAt` timestamp
- [x] Conflict detection (409 responses)
- [x] Conflict resolution UI (side-by-side comparison)
- [x] "Keep my changes" vs "Use server version" options

### Organization
- [x] Note colors (8 options)
- [x] Drag and drop reordering
- [x] Search/filter notes
- [x] Position-based ordering

### Editor Features
- [x] Auto-save (1 second debounce)
- [x] Save status indicator (Saved/Unsaved/Saving/Error)
- [x] Markdown support
- [x] Live markdown preview
- [x] Character count
- [x] Word count

### User Experience
- [x] Dark mode with persistence
- [x] Smooth animations (Framer Motion)
- [x] Toast notifications
- [x] Skeleton loaders
- [x] Empty state illustration
- [x] Keyboard shortcuts (Ctrl+N, Ctrl+S)
- [x] Relative timestamps ("2 minutes ago")
- [x] Responsive design

---

## Architecture

### Frontend Architecture
```
┌─────────────────────────────────────────────────────┐
│                    React App                         │
├─────────────────────────────────────────────────────┤
│  Pages          │  Components      │  Hooks         │
│  - NotesList    │  - NoteCard      │  - useDarkMode │
│  - NoteEdit     │  - ColorPicker   │  - useDebounce │
│                 │  - ThemeToggle   │                │
│                 │  - EmptyState    │                │
├─────────────────────────────────────────────────────┤
│                    API Client                        │
│  fetchNotes, createNote, updateNote, deleteNote     │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                   REST API                           │
└─────────────────────────────────────────────────────┘
```

### Backend Architecture
```
┌─────────────────────────────────────────────────────┐
│                   NestJS App                         │
├─────────────────────────────────────────────────────┤
│  NotesModule                                         │
│  ├── NotesController (REST endpoints)               │
│  ├── NotesService (business logic)                  │
│  ├── Note Entity (TypeORM)                          │
│  └── DTOs (validation)                              │
├─────────────────────────────────────────────────────┤
│                   TypeORM                            │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  PostgreSQL                          │
│  notes table                                         │
│  - id (UUID)                                         │
│  - title (VARCHAR)                                   │
│  - body (TEXT)                                       │
│  - color (VARCHAR)                                   │
│  - position (INT)                                    │
│  - createdAt (TIMESTAMP)                            │
│  - updatedAt (TIMESTAMP)                            │
│  - version (INT)                                     │
└─────────────────────────────────────────────────────┘
```

### Docker Architecture
```
┌─────────────────────────────────────────────────────┐
│              Docker Compose Network                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────┐    ┌─────────┐    ┌─────────────────┐ │
│  │Frontend │    │ Backend │    │   PostgreSQL    │ │
│  │ :5173   │───▶│  :3000  │───▶│     :5432       │ │
│  │ (Vite)  │    │(NestJS) │    │                 │ │
│  └─────────┘    └─────────┘    └─────────────────┘ │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Data Model

### Note Entity
```typescript
interface Note {
  id: string;          // UUID primary key
  title: string;       // Note title
  body: string;        // Note content (supports markdown)
  color: NoteColor;    // 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink'
  position: number;    // Sort order
  createdAt: Date;     // Creation timestamp
  updatedAt: Date;     // Last update timestamp
  version: number;     // Optimistic locking version
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notes | List all notes (sorted by position) |
| GET | /notes/:id | Get single note |
| POST | /notes | Create new note |
| PUT | /notes/:id | Update note (requires expectedUpdatedAt) |
| PATCH | /notes/reorder | Reorder notes (accepts array of IDs) |
| DELETE | /notes/:id | Delete note |

---

## Future Enhancements

### Potential Features
- [ ] User authentication
- [ ] Note sharing
- [ ] Real-time collaboration (WebSockets)
- [ ] Note folders/categories
- [ ] Note tags
- [ ] Full-text search
- [ ] Note export (PDF, Markdown)
- [ ] Note versioning/history
- [ ] Mobile app

### Technical Improvements
- [ ] Database migrations for production
- [ ] API rate limiting
- [ ] Caching layer
- [ ] Automated tests
- [ ] CI/CD pipeline
- [ ] Monitoring and logging
- [ ] API documentation (Swagger)
