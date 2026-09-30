const { z } = require('zod');
const { STATUSES, PRIORITIES } = require('../models/Task');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const register = z.object({
  name: z.string({ required_error: 'Enter your name' }).trim().min(1, 'Enter your name').max(60, 'Use 60 characters or fewer'),
  email: z.string({ required_error: 'Enter your email' }).trim().toLowerCase().email('Enter a valid email address'),
  password: z
    .string({ required_error: 'Enter a password' })
    .min(8, 'Use at least 8 characters')
    .max(72, 'Use 72 characters or fewer'),
});

const login = z.object({
  email: z.string({ required_error: 'Enter your email' }).trim().toLowerCase().email('Enter a valid email address'),
  password: z.string({ required_error: 'Enter your password' }).min(1, 'Enter your password'),
});

const taskFields = z.object({
  title: z.string({ required_error: 'Enter a title' }).trim().min(1, 'Enter a title').max(120, 'Use 120 characters or fewer'),
  description: z.string().trim().max(2000, 'Use 2000 characters or fewer').optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: z.coerce.date({ invalid_type_error: 'Enter a valid date' }).nullable().optional(),
});

const createTask = taskFields;
const updateTask = taskFields
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update');

const listTasks = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(['newest', 'oldest', 'due']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const idParam = z.object({ id: objectId });

module.exports = { register, login, createTask, updateTask, listTasks, idParam };
