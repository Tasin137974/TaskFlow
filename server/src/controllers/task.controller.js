const Task = require('../models/Task');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const serialize = (t) => ({
  id: String(t._id),
  title: t.title,
  description: t.description,
  status: t.status,
  priority: t.priority,
  dueDate: t.dueDate,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

function buildFilter(userId, { status, priority, search }) {
  const filter = { user: userId };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }
  return filter;
}

/**
 * "Due soonest" ordering: tasks with a due date first (earliest first), then tasks without one (newest first).
 * Uses two plain queries instead of a computed sort key, so it behaves the same on any MongoDB-compatible server.
 */
async function listByDueDate(filter, skip, limit) {
  const dated = { ...filter, dueDate: { $ne: null } };
  const datedCount = await Task.countDocuments(dated);
  const items = [];

  if (skip < datedCount) {
    items.push(...(await Task.find(dated).sort({ dueDate: 1, _id: 1 }).skip(skip).limit(limit).lean()));
  }

  const remaining = limit - items.length;
  if (remaining > 0) {
    const undated = { ...filter, dueDate: null };
    const undatedSkip = Math.max(0, skip - datedCount);
    items.push(...(await Task.find(undated).sort({ createdAt: -1, _id: -1 }).skip(undatedSkip).limit(remaining).lean()));
  }
  return items;
}

exports.list = asyncHandler(async (req, res) => {
  const { sort, page, limit } = req.query;
  const filter = buildFilter(req.user._id, req.query);
  const skip = (page - 1) * limit;

  const itemsPromise =
    sort === 'due'
      ? listByDueDate(filter, skip, limit)
      : Task.find(filter)
          .sort({ createdAt: sort === 'oldest' ? 1 : -1, _id: sort === 'oldest' ? 1 : -1 })
          .skip(skip)
          .limit(limit)
          .lean();

  const [items, total] = await Promise.all([itemsPromise, Task.countDocuments(filter)]);

  res.json({
    data: items.map(serialize),
    meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

exports.stats = asyncHandler(async (req, res) => {
  const rows = await Task.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const stats = { todo: 0, in_progress: 0, done: 0, total: 0 };
  for (const row of rows) {
    stats[row._id] = row.count;
    stats.total += row.count;
  }
  res.json({ stats });
});

exports.create = asyncHandler(async (req, res) => {
  const task = await Task.create({ ...req.body, user: req.user._id });
  res.status(201).json({ task: serialize(task) });
});

// Every lookup includes `user`, so another user's task is indistinguishable from a missing one (404, not 403).
exports.update = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!task) throw new AppError(404, 'Task not found');
  res.json({ task: serialize(task) });
});

exports.remove = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) throw new AppError(404, 'Task not found');
  res.status(204).end();
});
