# Guide: Testing

This project has a full, enforced test suite across four layers. **Every change ships with tests**, and the repository ruleset gates merges on **≥70% code coverage** (see [../platform/BRANCH_PROTECTION.md](../platform/BRANCH_PROTECTION.md)). Coverage today: backend ~89%, frontend ~91%.

## The four test layers

| Layer | Where | Tool | What it proves |
|-------|-------|------|----------------|
| **Unit** | `backend/src/**/*.spec.ts`, `frontend/src/**/*.test.ts(x)` | Jest / Vitest | One unit (service, hook, component, util) in isolation with mocked deps |
| **Regression** | `backend/test/regression.e2e-spec.ts`, page tests in `frontend/src/pages` | Jest / Vitest | Documented, contract-critical invariants can't silently change |
| **E2E** | `backend/test/*.e2e-spec.ts` (API), `e2e/tests/*.spec.ts` (browser) | supertest / Playwright | The stack works together, through real HTTP / a real browser |
| **Smoke** | `backend/test/smoke.e2e-spec.ts`, `e2e/tests/smoke.spec.ts` (`@smoke`) | Jest / Playwright | The fastest "is it alive?" check |

## Backend (Jest)

Config: [backend/jest.config.js](../../backend/jest.config.js). One config runs both layers; coverage is aggregated and emitted as Cobertura XML.

```bash
cd backend
npm test           # all tests (unit + e2e)
npm run test:unit  # src/**/*.spec.ts only
npm run test:e2e   # test/**/*.e2e-spec.ts only
npm run test:cov   # all + coverage (fails under 70%)
npm run test:watch
```

- **Unit** ([notes.service.spec.ts](../../backend/src/notes/notes.service.spec.ts), [notes.controller.spec.ts](../../backend/src/notes/notes.controller.spec.ts)) mock the TypeORM repository via `getRepositoryToken(Note)` — no database. This is where the optimistic-lock branches, `position = MAX+1`, and reorder logic are pinned down.
  ```typescript
  const moduleRef = await Test.createTestingModule({
    providers: [NotesService, { provide: getRepositoryToken(Note), useValue: mockRepo }],
  }).compile();
  ```
- **E2E / regression / smoke** ([test/](../../backend/test/)) boot the full Nest app over **in-memory SQLite** via [create-test-app.ts](../../backend/test/utils/create-test-app.ts) and drive it with `supertest`. Hermetic and fast — no external Postgres. (Production runs Postgres; the real Postgres path is covered by Playwright.)
  ```typescript
  const app = await createTestApp();
  await request(app.getHttpServer()).post('/notes').send({ title: 'x' }).expect(201);
  ```
- The **regression suite** locks the documented invariants: the exact `409 { message, currentNote }` shape, `MAX(position)+1`, `whitelist` stripping unknown fields, `@IsIn` color validation, required fields, and `204` on delete.

## Frontend (Vitest + Testing Library)

Config: the `test` block in [frontend/vite.config.ts](../../frontend/vite.config.ts); setup (jsdom polyfills for Radix + matchMedia, jest-dom matchers) in [src/test/setup.ts](../../frontend/src/test/setup.ts). Tests are colocated next to source as `*.test.ts(x)`.

```bash
cd frontend
npm test           # vitest run
npm run test:cov   # + coverage (fails under 70%)
npm run test:watch
```

- **Unit** — hooks ([use-debounce](../../frontend/src/hooks/use-debounce.test.ts), [use-dark-mode](../../frontend/src/hooks/use-dark-mode.test.ts)), `cn`, note helpers, and the **API client** ([api/notes.test.ts](../../frontend/src/api/notes.test.ts)) with `global.fetch` mocked to assert the 409/error/204 branches.
- **Component** — each feature component rendered and interacted with (`@testing-library/user-event`). Radix overlays (Popover/Dialog) work thanks to the pointer-capture polyfills in the setup file.
- **Page / regression** — [NotesList.test.tsx](../../frontend/src/pages/NotesList.test.tsx) and [NoteEdit.test.tsx](../../frontend/src/pages/NoteEdit.test.tsx) mock `@/api/notes` and cover loading/error/empty, search, create+navigate, autosave, and the **conflict-resolution dialog** (the signature flow):
  ```typescript
  vi.mock('@/api/notes', async (orig) => ({ ...(await orig()), updateNote: vi.fn() }));
  vi.mocked(api.updateNote).mockRejectedValue(new api.ConflictException({ message, currentNote }));
  // ...assert the "Conflict Detected" dialog appears and can adopt the server version
  ```
  Keep the real `ConflictException` (partial mock) so `instanceof` works.

## E2E (Playwright) — full stack in a real browser

Lives in [e2e/](../../e2e/) as its own package. Runs against the **running stack**, not mocks.

```bash
# 1. Start the stack (separate terminal)
docker compose -f docker-compose.dev.yml up

# 2. Run the browser tests
cd e2e
npm ci
npm run install:browsers   # first time only (downloads Chromium)
npm test                   # full suite  (E2E_BASE_URL defaults to http://localhost:5173)
npm run test:smoke         # @smoke subset only
```

Specs: [smoke.spec.ts](../../e2e/tests/smoke.spec.ts) (tagged `@smoke`), [notes-crud.spec.ts](../../e2e/tests/notes-crud.spec.ts) (create → autosave → delete), [conflict.spec.ts](../../e2e/tests/conflict.spec.ts) (two browser contexts → 409 → resolution dialog). CI runs `@smoke` on every PR and the full suite on push to `main` — see [CI_CD.md](../platform/CI_CD.md).

## Coverage & the 70% gate

- Thresholds are set to **70%** in both runners (`coverageThreshold` in jest.config.js; `test.coverage.thresholds` in vite.config.ts), so `test:cov` fails locally exactly like the merge gate.
- Both emit **Cobertura XML** (`<pkg>/coverage/cobertura-coverage.xml`), which CI uploads to GitHub Code Quality for the ruleset to evaluate.
- **Excluded from the frontend denominator** (documented, honest): generated `src/components/ui/**` (shadcn primitives) and entrypoints (`main.tsx`). **Backend** excludes only `main.ts`. Playwright E2E is a separate quality signal and does **not** contribute to these unit-coverage numbers.

## Rules (also in the CLAUDE.md files)

1. **Every new unit ships with tests.** New endpoint/service method → unit + an e2e assertion; new component/hook/page → a Vitest test; new user-facing flow → a Playwright spec.
2. **Never lower a coverage threshold** to make a change pass — add tests.
3. **Mock at the boundary** — repository (backend) / API client (backend `global.fetch`, frontend `@/api/notes`). No real DB or network in unit/component tests.
4. **Guard the conflict contract** — the 409 shape and the resolution dialog have regression tests on both sides; keep them.
5. Components using router hooks are wrapped in `MemoryRouter`; keep the real `ConflictException` when testing conflict handling.
6. Run `npm run test:cov` (both packages) before opening a PR — see [SUBMITTING_PR.md](SUBMITTING_PR.md).

## Adding tests for a new feature

- Backend logic → add a `*.spec.ts` next to it (mock the repo) **and** an assertion in `test/notes.e2e-spec.ts`; add a contract to `test/regression.e2e-spec.ts` if it's a documented invariant.
- Frontend → add a `*.test.tsx` next to the component/page (mock `@/api/notes`); cover loading/error/empty for data views.
- New user journey → add a Playwright spec in `e2e/tests/` (tag it `@smoke` if it belongs in the fast set).
