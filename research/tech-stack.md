# Technology Stack

## Overview
This is a collaborative notes application built with a modern TypeScript stack, featuring real-time-like collaboration with optimistic locking for conflict resolution.

---

## Frontend

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Vite | 7.x | Build tool and dev server |

### Routing
| Technology | Version | Purpose |
|------------|---------|---------|
| React Router | 7.x | Client-side routing |

### Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| Tailwind CSS | 4.x | Utility-first CSS |
| shadcn/ui | latest | Pre-built accessible components |
| tw-animate-css | latest | Animation utilities |
| @tailwindcss/typography | latest | Prose styling for markdown |

### UI/UX Libraries
| Technology | Version | Purpose |
|------------|---------|---------|
| Framer Motion | latest | Animations and transitions |
| Lucide React | latest | Icon library |
| Sonner | latest | Toast notifications |

### Utilities
| Technology | Version | Purpose |
|------------|---------|---------|
| date-fns | latest | Date formatting |
| react-markdown | latest | Markdown rendering |
| @dnd-kit/core | latest | Drag and drop |
| @dnd-kit/sortable | latest | Sortable lists |

---

## Backend

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 11.x | Server framework |
| TypeScript | 5.x | Type safety |
| Node.js | 20.x | Runtime |

### Database
| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 16 | Primary database |
| TypeORM | 0.3.x | Object-Relational Mapping |

### Validation
| Technology | Version | Purpose |
|------------|---------|---------|
| class-validator | latest | DTO validation decorators |
| class-transformer | latest | Object transformation |

### Configuration
| Technology | Version | Purpose |
|------------|---------|---------|
| @nestjs/config | latest | Environment configuration |

---

## Infrastructure

### Containerization
| Technology | Version | Purpose |
|------------|---------|---------|
| Docker | latest | Containerization |
| Docker Compose | latest | Multi-container orchestration |

### Production Serving
| Technology | Version | Purpose |
|------------|---------|---------|
| nginx | alpine | Static file serving, reverse proxy |

---

## Development Tools

### Code Quality
| Tool | Purpose |
|------|---------|
| TypeScript | Static type checking |
| ESLint | Linting |
| Prettier | Code formatting |

### Development Experience
| Tool | Purpose |
|------|---------|
| Vite HMR | Hot module replacement for frontend |
| nodemon | Auto-restart for backend |
| Docker volumes | Live code sync in containers |

---

## API Design

### REST Conventions
- `GET /notes` - List all notes
- `GET /notes/:id` - Get single note
- `POST /notes` - Create note
- `PUT /notes/:id` - Update note (with optimistic locking)
- `PATCH /notes/reorder` - Reorder notes
- `DELETE /notes/:id` - Delete note

### Conflict Resolution
- Uses `updatedAt` timestamp for optimistic locking
- Returns `409 Conflict` when concurrent edit detected
- Response includes current server state for resolution

---

## Environment Variables

### Backend
```env
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=notes
DB_SYNCHRONIZE=true
```

### Frontend
```env
VITE_API_URL=http://localhost:3000
```

---

## Ports

| Service | Development | Production |
|---------|-------------|------------|
| Frontend | 5173 | 80 |
| Backend | 3000 | 3000 |
| PostgreSQL | 5432 | (internal) |
