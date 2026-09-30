// Creates a demo account with sample tasks: npm run seed
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Task = require('../models/Task');

const DEMO = { name: 'Demo User', email: 'demo@taskflow.dev', password: 'Demo1234!' };
const day = (n) => new Date(Date.now() + n * 86400000);

(async () => {
  await mongoose.connect(env.mongoUri);
  await User.deleteOne({ email: DEMO.email });
  const user = await User.create({
    name: DEMO.name,
    email: DEMO.email,
    passwordHash: await bcrypt.hash(DEMO.password, env.bcryptRounds),
  });
  await Task.deleteMany({ user: user._id });
  await Task.insertMany(
    [
      { title: 'Draft the project proposal', status: 'in_progress', priority: 'high', dueDate: day(2), description: 'Scope, timeline and budget.' },
      { title: 'Review pull requests', status: 'todo', priority: 'medium', dueDate: day(1) },
      { title: 'Book dentist appointment', status: 'todo', priority: 'low' },
      { title: 'Set up CI pipeline', status: 'done', priority: 'high', description: 'Run tests on every push.' },
      { title: 'Update portfolio screenshots', status: 'todo', priority: 'medium', dueDate: day(-1) },
      { title: 'Plan sprint retrospective', status: 'in_progress', priority: 'low', dueDate: day(5) },
      { title: 'Write API documentation', status: 'todo', priority: 'high', dueDate: day(7) },
      { title: 'Renew domain name', status: 'done', priority: 'medium' },
      { title: 'Refactor auth middleware', status: 'todo', priority: 'medium' },
      { title: 'Prepare demo for Friday', status: 'in_progress', priority: 'high', dueDate: day(3) },
      { title: 'Clean up old branches', status: 'todo', priority: 'low' },
      { title: 'Reply to recruiter emails', status: 'todo', priority: 'high', dueDate: day(0) },
    ].map((t) => ({ ...t, user: user._id }))
  );
  console.log(`Seeded ${DEMO.email} / ${DEMO.password}`);
  await mongoose.disconnect();
})();
