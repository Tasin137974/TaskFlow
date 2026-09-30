const { app, request, signUp } = require('./helpers');

describe('POST /api/auth/register', () => {
  it('creates a user, sets an httpOnly cookie and never returns the password hash', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ada', email: 'ADA@Example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ name: 'Ada', email: 'ada@example.com' });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/token=.*HttpOnly/i);
  });

  it('rejects a duplicate email with 409', async () => {
    const { body } = await signUp();
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(409);
    expect(res.body.error.details.email).toBeDefined();
  });

  it('returns field errors for invalid input', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: '', email: 'nope', password: 'short' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const { body } = await signUp();
    const res = await request(app).post('/api/auth/login').send({ email: body.email, password: body.password });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('gives the same 401 for a wrong password and an unknown email', async () => {
    const { body } = await signUp();
    const wrongPassword = await request(app).post('/api/auth/login').send({ email: body.email, password: 'wrong-password' });
    const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'password123' });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });
});

describe('session', () => {
  it('GET /me returns the current user when logged in', async () => {
    const { agent, user } = await signUp();
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user.id);
  });

  it('GET /me returns 401 without a session', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('logout clears the session', async () => {
    const { agent } = await signUp();
    const out = await agent.post('/api/auth/logout');
    expect(out.status).toBe(204);
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a tampered token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'token=not.a.jwt');
    expect(res.status).toBe(401);
  });
});
