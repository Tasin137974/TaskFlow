import { useState } from 'react';
import { NEXT_STATUS, PRIORITY_LABEL, STATUS_LABEL } from '../utils/constants.js';
import { formatDue, isOverdue } from '../utils/date.js';

export default function TaskItem({ task, onCycle, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const overdue = task.dueDate && task.status !== 'done' && isOverdue(task.dueDate);

  return (
    <li className={`task ${task.status === 'done' ? 'is-done' : ''}`}>
      <button
        className="marker"
        data-status={task.status}
        onClick={() => onCycle(task)}
        aria-label={`${task.title}: ${STATUS_LABEL[task.status]}. Mark as ${STATUS_LABEL[NEXT_STATUS[task.status]]}`}
        title={`Mark as ${STATUS_LABEL[NEXT_STATUS[task.status]]}`}
      />

      <div className="task-body">
        <p className="task-title">{task.title}</p>
        {task.description && <p className="task-desc">{task.description}</p>}
        <p className="task-meta">
          <span className={`priority priority-${task.priority}`}>{PRIORITY_LABEL[task.priority]} priority</span>
          <span>{STATUS_LABEL[task.status]}</span>
          {task.dueDate && (
            <span className={overdue ? 'overdue' : ''}>
              {overdue ? 'Overdue: ' : 'Due '}
              {formatDue(task.dueDate)}
            </span>
          )}
        </p>
      </div>

      <div className="task-actions">
        {confirming ? (
          <>
            <button className="btn btn-danger" onClick={() => onDelete(task)}>
              Delete task
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirming(false)}>
              Keep
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={() => onEdit(task)}>
              Edit
            </button>
            <button className="btn btn-ghost" onClick={() => setConfirming(true)}>
              Delete
            </button>
          </>
        )}
      </div>
    </li>
  );
}
