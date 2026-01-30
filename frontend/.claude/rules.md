# Frontend Development Rules

## Technology Stack
- **Framework**: React 18+ with TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Animations**: Framer Motion
- **State**: React hooks (no external state management)
- **API**: Fetch with custom error handling

## Component Guidelines

### File Structure
```
src/
├── api/          # API client functions
├── components/   # Reusable UI components
│   └── ui/       # shadcn/ui components (do not modify directly)
├── hooks/        # Custom React hooks
├── lib/          # Utilities (cn, etc.)
├── pages/        # Route page components
└── types/        # TypeScript interfaces
```

### Naming Conventions
- **Components**: PascalCase (`NoteCard.tsx`, `ColorPicker.tsx`)
- **Hooks**: camelCase with `use` prefix (`use-dark-mode.ts`, `use-debounce.ts`)
- **Types**: PascalCase for interfaces, UPPER_CASE for constants
- **API functions**: camelCase verbs (`fetchNotes`, `createNote`, `updateNote`)

### Component Patterns
1. **Use functional components** with hooks exclusively
2. **Prefer composition** over prop drilling
3. **Extract custom hooks** for reusable stateful logic
4. **Use `cn()` utility** for conditional Tailwind classes
5. **Wrap animations** with Framer Motion's `motion` components

### Styling Rules
1. **Use Tailwind classes** - avoid inline styles
2. **Use shadcn/ui components** from `@/components/ui/`
3. **Dark mode**: Use `dark:` variant for dark mode styles
4. **Responsive**: Mobile-first approach with `sm:`, `md:`, `lg:` breakpoints
5. **Colors**: Use CSS variables from the theme (`bg-background`, `text-foreground`)

### State Management
1. **Local state**: `useState` for component-specific state
2. **Derived state**: Compute in render, avoid redundant state
3. **Side effects**: `useEffect` with proper dependency arrays
4. **Memoization**: `useCallback` for functions passed to children, `useMemo` for expensive computations
5. **Refs**: `useRef` for DOM access and mutable values that don't trigger re-renders

### API Integration
1. **All API calls** go through `src/api/notes.ts`
2. **Handle errors** with try/catch and toast notifications
3. **Show loading states** during async operations
4. **Use optimistic updates** where appropriate

### Accessibility
1. Include proper `aria-` attributes
2. Ensure keyboard navigation works
3. Use semantic HTML elements
4. Provide `sr-only` text for icon-only buttons

## Adding New Features

### New Component Checklist
1. Create file in appropriate directory
2. Define TypeScript props interface
3. Add loading/error states if async
4. Include animations with Framer Motion
5. Support dark mode
6. Add keyboard accessibility

### New Page Checklist
1. Create in `src/pages/`
2. Add route in `App.tsx`
3. Include loading skeleton
4. Handle error states
5. Add page-level keyboard shortcuts if needed
