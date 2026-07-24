import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { Note } from '../src/notes/entities/note.entity';
import { createTestApp } from './utils/create-test-app';

/**
 * End-to-end tests: real HTTP requests through the full Nest stack
 * (controller -> service -> repository) against an in-memory database.
 * Covers the happy-path CRUD + reorder journeys and their status codes.
 */
describe('Notes (e2e)', () => {
  let app: INestApplication;
  let repo: Repository<Note>;

  beforeAll(async () => {
    app = await createTestApp();
    repo = app.get(getRepositoryToken(Note));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await repo.createQueryBuilder().delete().execute();
  });

  const server = () => app.getHttpServer();
  const create = (body: object) => request(server()).post('/notes').send(body);

  it('GET /notes returns an empty list initially', async () => {
    const res = await request(server()).get('/notes').expect(200);
    expect(res.body).toEqual([]);
  });

  it('POST /notes creates a note with defaults at position 0', async () => {
    const res = await create({ title: 'First' }).expect(201);
    expect(res.body).toMatchObject({
      title: 'First',
      body: '',
      color: 'default',
      position: 0,
    });
    expect(res.body.id).toEqual(expect.any(String));
    expect(res.body.updatedAt).toEqual(expect.any(String));
  });

  it('GET /notes/:id returns a note, or 404 when missing', async () => {
    const { body: created } = await create({ title: 'Fetch me' }).expect(201);
    await request(server()).get(`/notes/${created.id}`).expect(200);
    await request(server()).get('/notes/00000000-0000-0000-0000-000000000000').expect(404);
  });

  it('PUT /notes/:id updates when expectedUpdatedAt matches', async () => {
    const { body: created } = await create({ title: 'Original' }).expect(201);
    // Read the canonical persisted updatedAt back before sending it as the lock token.
    const { body: current } = await request(server()).get(`/notes/${created.id}`).expect(200);

    const res = await request(server())
      .put(`/notes/${created.id}`)
      .send({ title: 'Updated', color: 'green', expectedUpdatedAt: current.updatedAt })
      .expect(200);

    expect(res.body).toMatchObject({ title: 'Updated', color: 'green' });
  });

  it('PATCH /notes/reorder rewrites positions to the given order', async () => {
    const a = (await create({ title: 'A' }).expect(201)).body;
    const b = (await create({ title: 'B' }).expect(201)).body;

    const res = await request(server())
      .patch('/notes/reorder')
      .send({ noteIds: [b.id, a.id] })
      .expect(200);

    const positionById: Record<string, number> = Object.fromEntries(
      res.body.map((n: Note) => [n.id, n.position]),
    );
    expect(positionById[b.id]).toBe(0);
    expect(positionById[a.id]).toBe(1);
  });

  it('DELETE /notes/:id removes a note (204), or 404 when missing', async () => {
    const { body: created } = await create({ title: 'Delete me' }).expect(201);
    await request(server()).delete(`/notes/${created.id}`).expect(204);
    await request(server()).get(`/notes/${created.id}`).expect(404);
    await request(server()).delete('/notes/00000000-0000-0000-0000-000000000000').expect(404);
  });
});
