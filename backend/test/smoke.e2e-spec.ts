import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/create-test-app';

/**
 * Smoke test — the fastest possible "is the API alive and wired correctly?"
 * check. If this fails, the app doesn't boot or its core route is broken;
 * there's no point running the rest of the suite. Kept deliberately tiny.
 */
describe('Smoke (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('boots and answers GET /notes with 200', async () => {
    await request(app.getHttpServer()).get('/notes').expect(200);
  });

  it('serves the core create -> read happy path', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/notes')
      .send({ title: 'Smoke note' })
      .expect(201);

    await request(app.getHttpServer()).get(`/notes/${body.id}`).expect(200);
  });
});
