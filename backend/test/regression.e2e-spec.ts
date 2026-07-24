import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { Note } from '../src/notes/entities/note.entity';
import { createTestApp } from './utils/create-test-app';

/**
 * Regression suite — locks in the documented, contract-critical invariants so
 * they can never silently change. Each test maps to a behaviour described in
 * docs/API_CONTRACTS.md / docs/backend/*.md. Breaking one here means breaking a
 * contract the frontend (or a security guarantee) relies on.
 */
describe('Regression: documented invariants', () => {
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

  // Contract: the 409 body is exactly { message, currentNote } — the frontend
  // ConflictException reads these two keys. (docs/backend/ERROR_HANDLING.md)
  it('409 conflict body is exactly { message, currentNote }', async () => {
    const { body: note } = await create({ title: 'x' }).expect(201);

    const res = await request(server())
      .put(`/notes/${note.id}`)
      .send({ title: 'y', expectedUpdatedAt: '2000-01-01T00:00:00.000Z' })
      .expect(409);

    expect(Object.keys(res.body).sort()).toEqual(['currentNote', 'message']);
    expect(res.body.message).toBe('Note has been modified by another user');
    expect(res.body.currentNote.id).toBe(note.id);
  });

  // Contract: new notes append at MAX(position) + 1. (docs/DATA_MODEL.md)
  it('new notes are appended at MAX(position) + 1', async () => {
    const a = (await create({ title: 'A' }).expect(201)).body;
    const b = (await create({ title: 'B' }).expect(201)).body;
    const c = (await create({ title: 'C' }).expect(201)).body;
    expect([a.position, b.position, c.position]).toEqual([0, 1, 2]);
  });

  // Security: ValidationPipe whitelist strips unknown / server-managed fields.
  it('ValidationPipe whitelist strips unknown and server-managed fields', async () => {
    const res = await create({
      title: 'Clean',
      hacker: 'should be stripped',
      id: 'forged-id',
      version: 99,
    }).expect(201);

    expect(res.body).not.toHaveProperty('hacker');
    expect(res.body.id).not.toBe('forged-id');
    expect(res.body.version).toBe(1);
  });

  // Contract: color is constrained to the NoteColor set via @IsIn.
  it('rejects an invalid color with 400', async () => {
    await create({ title: 'Bad', color: 'chartreuse' }).expect(400);
  });

  // Contract: title required on create; expectedUpdatedAt required on update.
  it('requires title on create and expectedUpdatedAt on update (400)', async () => {
    await create({ body: 'no title' }).expect(400);
    const { body: note } = await create({ title: 'ok' }).expect(201);
    await request(server()).put(`/notes/${note.id}`).send({ title: 'no lock token' }).expect(400);
  });

  // Contract: DELETE returns 204 with an empty body.
  it('DELETE responds 204 with an empty body', async () => {
    const { body: note } = await create({ title: 'z' }).expect(201);
    const res = await request(server()).delete(`/notes/${note.id}`).expect(204);
    expect(res.text).toBe('');
  });
});
