const request = require('supertest');
const createApp = require('../src/app');

const app = createApp();
let counter = 0;

/** Registers a fresh user and returns a supertest agent that carries the session cookie. */
async function signUp(overrides = {}) {
  const agent = request.agent(app);
  const body = { name: 'Test User', email: `user${++counter}@example.com`, password: 'password123', ...overrides };
  const res = await agent.post('/api/auth/register').send(body);
  return { agent, user: res.body.user, body };
}

module.exports = { app, request, signUp };
