import { useEffect, useRef, useState } from 'react';
import { PRIORITY_LABEL, STATUS_LABEL } from '../utils/constants.js';

export default function TaskModal({ task, onClose, onSave }) {
  const dialogRef = useRef(null);
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'medium',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return setErrors({ title: 'Enter a title' });

    setSaving(true);
    try {
      await onSave({ ...form, title, description: form.description.trim(), dueDate: form.dueDate || null });
    } catch (err) {
      setErrors(err.details || { form: err.message });
      setSaving(false);
    }
  }

  const isEdit = Boolean(task?.id);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      aria-labelledby="task-modal-title"
      onClose={onClose}
      onClick={(e) => e.target === dialogRef.current && dialogRef.current.close()}
    >
      <form onSubmit={handleSubmit} noValidate className="modal-form">
        <h2 id="task-modal-title">{isEdit ? 'Edit task' : 'New task'}</h2>

        <div className="field">
          <label htmlFor="t-title">Title</label>
          <input id="t-title" value={form.title} onChange={set('title')} maxLength={120} autoFocus aria-invalid={Boolean(errors.title)} />
          {errors.title && <p className="field-error">{errors.title}</p>}
        </div>

        <div className="field">
          <label htmlFor="t-desc">Notes</label>
          <textarea id="t-desc" rows={3} value={form.description} onChange={set('description')} maxLength={2000} />
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="t-status">Status</label>
            <select id="t-status" value={form.status} onChange={set('status')}>
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="t-priority">Priority</label>
            <select id="t-priority" value={form.priority} onChange={set('priority')}>
              {Object.entries(PRIORITY_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="t-due">Due date</label>
            <input id="t-due" type="date" value={form.dueDate} onChange={set('dueDate')} />
            {errors.dueDate && <p className="field-error">{errors.dueDate}</p>}
          </div>
        </div>

        {errors.form && <p className="form-error" role="alert">{errors.form}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={() => dialogRef.current.close()}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
