# Frontend Skills

## /add-component
Create a new React component with proper TypeScript types, Tailwind styling, and Framer Motion animations.

**Usage**: `/add-component ComponentName`

**Template**:
```tsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ComponentNameProps {
  className?: string;
}

export function ComponentName({ className }: ComponentNameProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('', className)}
    >
      {/* Component content */}
    </motion.div>
  );
}
```

## /add-hook
Create a new custom React hook.

**Usage**: `/add-hook useHookName`

**Template**:
```tsx
import { useState, useEffect } from 'react';

export function useHookName() {
  const [state, setState] = useState();

  useEffect(() => {
    // Effect logic
  }, []);

  return { state };
}
```

## /add-page
Create a new page component with loading states, error handling, and proper routing.

**Usage**: `/add-page PageName`

Steps:
1. Create `src/pages/PageName.tsx`
2. Add route in `App.tsx`
3. Include skeleton loader
4. Add error boundary

## /add-shadcn
Add a new shadcn/ui component to the project.

**Usage**: `/add-shadcn component-name`

**Command**: `npx shadcn@latest add <component-name>`

Available components: https://ui.shadcn.com/docs/components

## /add-api-endpoint
Add a new API endpoint function to the notes API client.

**Usage**: `/add-api-endpoint functionName`

**Template**:
```tsx
export async function functionName(params: ParamsType): Promise<ReturnType> {
  const response = await fetch(`${API_BASE}/endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return handleResponse<ReturnType>(response);
}
```

## /fix-typescript
Fix TypeScript errors in the frontend.

**Command**: `cd frontend && npx tsc --noEmit`

## /lint-check
Run linting and formatting checks.

**Commands**:
```bash
cd frontend && npm run lint
cd frontend && npm run build
```

## /test-frontend
Run frontend tests and checks.

**Commands**:
```bash
cd frontend && npx tsc --noEmit
cd frontend && npm run build
```

## /update-theme
Modify the Tailwind theme colors in `src/index.css`.

The theme uses CSS variables defined in `:root` and `.dark` selectors.

## /add-animation
Add Framer Motion animation to a component.

**Common patterns**:
```tsx
// Fade in
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}

// Slide up
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}

// Scale
initial={{ scale: 0.8, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}

// Stagger children
transition={{ staggerChildren: 0.1 }}
```
