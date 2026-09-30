const mongoose = require('mongoose');

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    status: { type: String, enum: STATUSES, default: 'todo' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, status: 1, createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);
Task.STATUSES = STATUSES;
Task.PRIORITIES = PRIORITIES;

module.exports = Task;
