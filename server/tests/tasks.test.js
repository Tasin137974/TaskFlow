const { app, request, signUp } = require('./helpers');

const makeTask = (agent, overrides = {}) => agent.post('/api/tasks').send({ title: 'Write tests', ...overrides });

describe('authentication', () => {
  it('blocks every task route without a session', async () => {
    for (const [method, path] of [['get', '/api/tasks'], ['post', '/api/tasks'], ['get', '/api/tasks/stats']]) {
      const res = await request(app)[method](path);
      expect(res.status).toBe(401);
    }
  });
});

describe('CRUD', () => {
  it('creates a task with defaults', async () => {
    const { agent } = await signUp();
    const res = await makeTask(agent);
    expect(res.status).toBe(201);
    expect(res.body.task).toMatchObject({ title: 'Write tests', status: 'todo', priority: 'medium', dueDate: null });
  });

  it('validates input', async () => {
    const { agent } = await signUp();
    const res = await makeTask(agent, { title: '   ', status: 'archived' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.title).toBeDefined();
    expect(res.body.error.details.status).toBeDefined();
  });

  it('updates and deletes a task', async () => {
    const { agent } = await signUp();
    const { body } = await makeTask(agent);
    const id = body.task.id;

    const patched = await agent.patch(`/api/tasks/${id}`).send({ status: 'done', dueDate: '2030-01-15' });
    expect(patched.status).toBe(200);
    expect(patched.body.task.status).toBe('done');
    expect(patched.body.task.dueDate).toMatch(/^2030-01-15/);

    const cleared = await agent.patch(`/api/tasks/${id}`).send({ dueDate: null });
    expect(cleared.body.task.dueDate).toBeNull();

    expect((await agent.delete(`/api/tasks/${id}`)).status).toBe(204);
    expect((await agent.delete(`/api/tasks/${id}`)).status).toBe(404);
  });

  it('rejects an empty update and a malformed id', async () => {
    const { agent } = await signUp();
    const { body } = await makeTask(agent);
    expect((await agent.patch(`/api/tasks/${body.task.id}`).send({})).status).toBe(400);
    expect((await agent.patch('/api/tasks/not-an-id').send({ title: 'x' })).status).toBe(400);
  });
});

describe('ownership isolation', () => {
  it("user B cannot read, update or delete user A's task", async () => {
    const a = await signUp();
    const b = await signUp();
    const { body } = await makeTask(a.agent, { title: 'Private' });
    const id = body.task.id;

    expect((await b.agent.patch(`/api/tasks/${id}`).send({ title: 'Hacked' })).status).toBe(404);
    expect((await b.agent.delete(`/api/tasks/${id}`)).status).toBe(404);

    const listB = await b.agent.get('/api/tasks');
    expect(listB.body.data).toHaveLength(0);

    const listA = await a.agent.get('/api/tasks');
    expect(listA.body.data[0].title).toBe('Private');
  });
});

describe('listing', () => {
  it('filters by status and searches title/description', async () => {
    const { agent } = await signUp();
    await makeTask(agent, { title: 'Buy milk', status: 'done' });
    await makeTask(agent, { title: 'Ship release', description: 'Includes milk-run fixes' });
    await makeTask(agent, { title: 'Plan trip' });

    const done = await agent.get('/api/tasks?status=done');
    expect(done.body.data.map((t) => t.title)).toEqual(['Buy milk']);

    const search = await agent.get('/api/tasks?search=milk');
    expect(search.body.meta.total).toBe(2);
  });

  it('treats search input as plain text, not a regex', async () => {
    const { agent } = await signUp();
    await makeTask(agent, { title: 'Regular task' });
    const res = await agent.get('/api/tasks').query({ search: '.*' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('paginates', async () => {
    const { agent } = await signUp();
    for (let i = 1; i <= 5; i++) await makeTask(agent, { title: `Task ${i}` });

    const res = await agent.get('/api/tasks?limit=2&page=3');
    expect(res.body.meta).toMatchObject({ page: 3, limit: 2, total: 5, pages: 3 });
    expect(res.body.data).toHaveLength(1);
  });

  it('sorts by due date with undated tasks last', async () => {
    const { agent } = await signUp();
    await makeTask(agent, { title: 'No date' });
    await makeTask(agent, { title: 'Later', dueDate: '2031-06-01' });
    await makeTask(agent, { title: 'Sooner', dueDate: '2031-01-01' });

    const res = await agent.get('/api/tasks?sort=due');
    expect(res.body.data.map((t) => t.title)).toEqual(['Sooner', 'Later', 'No date']);
  });

  it('paginates the due-date sort across the dated/undated boundary', async () => {
    const { agent } = await signUp();
    await makeTask(agent, { title: 'Undated A' });
    await makeTask(agent, { title: 'Undated B' });
    await makeTask(agent, { title: 'Due 3', dueDate: '2031-03-01' });
    await makeTask(agent, { title: 'Due 1', dueDate: '2031-01-01' });
    await makeTask(agent, { title: 'Due 2', dueDate: '2031-02-01' });

    const titles = async (page) =>
      (await agent.get(`/api/tasks?sort=due&limit=2&page=${page}`)).body.data.map((t) => t.title);

    expect(await titles(1)).toEqual(['Due 1', 'Due 2']);
    expect(await titles(2)).toEqual(['Due 3', 'Undated B']);
    expect(await titles(3)).toEqual(['Undated A']);
  });

  it('returns per-status counts', async () => {
    const { agent } = await signUp();
    await makeTask(agent, { status: 'done' });
    await makeTask(agent, { status: 'done' });
    await makeTask(agent);
    const res = await agent.get('/api/tasks/stats');
    expect(res.body.stats).toEqual({ todo: 1, in_progress: 0, done: 2, total: 3 });
  });
});
