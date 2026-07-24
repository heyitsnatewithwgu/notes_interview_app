import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from '../../src/notes/entities/note.entity';
import { NotesModule } from '../../src/notes/notes.module';

/**
 * Boots a full NestApplication for E2E tests against an in-memory SQLite
 * database. It wires the real NotesModule (controller + service + repository)
 * and replicates the global ValidationPipe configured in `main.ts`, so the
 * HTTP behaviour matches production — the only difference is the database
 * driver (better-sqlite3 instead of Postgres) for hermetic, fast tests.
 *
 * Production uses Postgres; the real Postgres path is exercised end-to-end by
 * the Playwright suite. See docs/guides/TESTING.md.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRoot({
        type: 'better-sqlite3',
        database: ':memory:',
        dropSchema: true,
        entities: [Note],
        synchronize: true,
      }),
      NotesModule,
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}
