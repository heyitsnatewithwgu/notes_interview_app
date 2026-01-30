# Project Rules

## General Principles

### Code Quality
1. **TypeScript Everywhere** - All code must be written in TypeScript with strict mode enabled
2. **No `any` Types** - Avoid `any`; use proper types or `unknown` when necessary
3. **Consistent Formatting** - Follow Prettier defaults
4. **Meaningful Names** - Use descriptive variable, function, and file names

### Architecture
1. **Separation of Concerns** - Keep UI, business logic, and data access separate
2. **Single Responsibility** - Each module/component should do one thing well
3. **DRY (Don't Repeat Yourself)** - Extract reusable code into utilities/hooks
4. **KISS (Keep It Simple)** - Prefer simple solutions over clever ones

---

## Git Workflow

### Branch Naming
```
feature/<feature-name>
bugfix/<bug-description>
hotfix/<urgent-fix>
refactor/<what-is-changing>
```

### Commit Messages
```
<type>: <short description>

<optional body>

Types:
- feat: New feature
- fix: Bug fix
- refactor: Code refactoring
- docs: Documentation
- style: Formatting
- test: Tests
- chore: Maintenance
```

### PR Guidelines
1. Keep PRs small and focused
2. Include description of changes
3. Add screenshots for UI changes
4. Ensure all tests pass
5. Request review from at least one team member

---

## Frontend Rules

### Component Rules
1. **Functional Components Only** - No class components
2. **Hooks for State** - Use React hooks for all state management
3. **Props Interface** - Define TypeScript interface for all props
4. **Default Exports for Pages** - Named exports for components

### Styling Rules
1. **Tailwind First** - Use Tailwind classes, avoid custom CSS
2. **shadcn/ui Components** - Use existing components before creating new ones
3. **Dark Mode Support** - All components must support dark mode
4. **Mobile First** - Design for mobile, enhance for desktop

### State Rules
1. **Local State Preferred** - Use local state unless sharing is necessary
2. **No Prop Drilling** - Use context or composition for deep data
3. **Derived State** - Compute values in render, don't store redundantly

### Performance Rules
1. **Lazy Load Routes** - Use React.lazy for route components
2. **Memoize Expensive Computations** - Use useMemo/useCallback appropriately
3. **Optimize Re-renders** - Avoid unnecessary state updates

---

## Backend Rules

### API Design Rules
1. **RESTful Conventions** - Follow REST naming and HTTP method conventions
2. **Consistent Response Format** - Return consistent JSON structures
3. **Proper Status Codes** - Use appropriate HTTP status codes
4. **Validation on Input** - Validate all incoming data with DTOs

### Database Rules
1. **UUIDs for Primary Keys** - Use UUID instead of auto-increment
2. **Timestamps Required** - All entities must have createdAt/updatedAt
3. **Soft Deletes Optional** - Consider soft deletes for important data
4. **Index Frequently Queried Fields** - Add indexes for performance

### Security Rules
1. **Validate All Input** - Never trust client data
2. **Use Environment Variables** - No hardcoded secrets
3. **CORS Configuration** - Restrict to known origins
4. **Rate Limiting** - Implement for production

### Error Handling Rules
1. **Use NestJS Exceptions** - Throw built-in exceptions
2. **Meaningful Error Messages** - Return helpful error descriptions
3. **Log Errors** - Log all errors for debugging
4. **Don't Expose Stack Traces** - Hide internal details in production

---

## Testing Rules

### Frontend Testing
1. **Component Tests** - Test component rendering and interactions
2. **Hook Tests** - Test custom hooks in isolation
3. **Integration Tests** - Test page flows

### Backend Testing
1. **Unit Tests** - Test services in isolation
2. **Integration Tests** - Test controller endpoints
3. **Database Tests** - Test against test database

### Coverage Requirements
- Minimum 70% coverage for new code
- Critical paths must be tested

---

## Documentation Rules

### Code Documentation
1. **JSDoc for Public APIs** - Document public functions and types
2. **Inline Comments Sparingly** - Only for complex logic
3. **Self-Documenting Code** - Prefer clear names over comments

### Project Documentation
1. **Keep README Updated** - Update when setup changes
2. **Document Environment Variables** - List all required env vars
3. **API Documentation** - Document all endpoints

---

## Docker Rules

### Container Rules
1. **Multi-stage Builds** - Use for smaller production images
2. **Alpine Images** - Prefer alpine base images
3. **.dockerignore** - Exclude node_modules and build artifacts

### Compose Rules
1. **Health Checks** - Add health checks for dependencies
2. **Named Volumes** - Use for persistent data
3. **Network Isolation** - Use custom networks

---

## Collaboration Rules

### Code Review
1. **Be Constructive** - Focus on the code, not the person
2. **Explain Why** - Provide reasoning for suggestions
3. **Approve Promptly** - Don't block PRs unnecessarily

### Communication
1. **Document Decisions** - Record important technical decisions
2. **Ask Questions** - When in doubt, ask
3. **Share Knowledge** - Help team members learn

---

## Conflict Resolution (Technical)

When concurrent edits cause conflicts:
1. **Detect** - Check `updatedAt` matches expected value
2. **Inform** - Return 409 with current server state
3. **Present Options** - Show both versions to user
4. **Let User Decide** - User chooses which version to keep
5. **Retry** - Save with updated timestamp
