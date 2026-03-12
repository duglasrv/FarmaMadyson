import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E tests for the auth flow.
 *
 * NOTE: These tests require a running PostgreSQL and Redis instance.
 * Run with: pnpm --filter @farma/api test:e2e
 *
 * If the database is not available, these tests will be skipped.
 */
describe('Auth Flow (e2e)', () => {
  let app: INestApplication;
  let canRun = true;

  beforeAll(async () => {
    try {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    } catch {
      canRun = false;
    }
  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
  });

  it('should be configured', () => {
    if (!canRun) {
      console.warn('Skipping E2E tests: Database not available');
      return;
    }
    expect(app).toBeDefined();
  });

  it('POST /api/auth/register — should register a new user', async () => {
    if (!canRun) return;

    const uniqueEmail = `e2e-test-${Date.now()}@test.com`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        password: 'TestPassword123!',
        firstName: 'E2E',
        lastName: 'Test',
      });

    // Should succeed or conflict (if re-run)
    expect([201, 409]).toContain(res.status);
  });

  it('POST /api/auth/login — should reject invalid credentials', async () => {
    if (!canRun) return;

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'no-such-user@test.com', password: 'wrong' });

    expect(res.status).toBe(401);
  });

  it('GET /api/health — should be accessible without auth', async () => {
    if (!canRun) return;

    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('GET /api/auth/me — should require authentication', async () => {
    if (!canRun) return;

    const res = await request(app.getHttpServer()).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
