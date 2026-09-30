import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import useDebounce from '../hooks/useDebounce.js';
import TaskItem from '../components/TaskItem.jsx';
import TaskModal from '../components/TaskModal.jsx';
import Pagination from '../components/Pagination.jsx';
import { NEXT_STATUS, PAGE_SIZE } from '../utils/constants.js';

const TABS = [
  { value: '', label: 'All', key: 'total' },
  { value: 'todo', label: 'To do', key: 'todo' },
  { value: 'in_progress', label: 'In progress', key: 'in_progress' },
  { value: 'done', label: 'Done', key: 'done' },
];

export default function TasksPage() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  // Filters live in the URL, so a refresh or a shared link keeps the same view.
  const status = params.get('status') || '';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;

  const [search, setSearch] = useState(q);
  const debouncedSearch = useDebounce(search, 300);

  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(null); // null = closed, {} = new task, task object = edit

  const setParam = useCallback(
    (changes) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            const isDefault = value === '' || value == null || (key === 'page' && value === 1) || (key === 'sort' && value === 'newest');
            if (isDefault) next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true }
      ),
    [setParams]
  );

  useEffect(() => {
    if (debouncedSearch.trim() !== q) setParam({ q: debouncedSearch.trim(), page: 1 });
  }, [debouncedSearch, q, setParam]);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ page, limit: PAGE_SIZE, sort });
    if (status) query.set('status', status);
    if (q) query.set('search', q);

    setLoading(true);
    setError('');
    Promise.all([
      api.get(`/tasks?${query}`, { signal: controller.signal }),
      api.get('/tasks/stats', { signal: controller.signal }),
    ])
      .then(([list, s]) => {
        setItems(list.data);
        setMeta(list.meta);
        setStats(s.stats);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [status, q, sort, page, reloadKey]);

  // If the last task on a page is removed, step back to the previous page.
  useEffect(() => {
    if (!loading && page > meta.pages) setParam({ page: meta.pages });
  }, [loading, page, meta.pages, setParam]);

  const refresh = () => setReloadKey((k) => k + 1);

  async function saveTask(values) {
    if (editing?.id) {
      await api.patch(`/tasks/${editing.id}`, values);
      toast('Task updated');
    } else {
      await api.post('/tasks', values);
      toast('Task created');
    }
    setEditing(null);
    refresh();
  }

  async function cycleStatus(task) {
    try {
      await api.patch(`/tasks/${task.id}`, { status: NEXT_STATUS[task.status] });
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function deleteTask(task) {
    try {
      await api.del(`/tasks/${task.id}`);
      toast('Task deleted');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  const filtered = Boolean(status || q);
  const clearFilters = () => {
    setSearch('');
    setParams({}, { replace: true });
  };

  return (
    <>
      <div className="page-head">
        <h1>Your tasks</h1>
        <button className="btn btn-primary" onClick={() => setEditing({})}>
          New task
        </button>
      </div>

      <div className="tabs" role="tablist" aria-label="Filter by status">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            role="tab"
            aria-selected={status === tab.value}
            className={`tab ${status === tab.value ? 'is-active' : ''}`}
            onClick={() => setParam({ status: tab.value, page: 1 })}
          >
            {tab.label}
            {stats && <span className="tab-count">{stats[tab.key]}</span>}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="field grow">
          <label htmlFor="search" className="sr-only">
            Search tasks
          </label>
          <input id="search" type="search" placeholder="Search titles and notes" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="sort" className="sr-only">
            Sort tasks
          </label>
          <select id="sort" value={sort} onChange={(e) => setParam({ sort: e.target.value, page: 1 })}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="due">Due soonest</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="notice notice-error" role="alert">
          <span>{error}</span>
          <button className="btn btn-ghost" onClick={refresh}>
            Try again
          </button>
        </div>
      )}

      {loading && items.length === 0 && !error ? (
        <p className="empty muted" role="status">
          Loading tasks…
        </p>
      ) : items.length > 0 ? (
        <ul className={`task-list ${loading ? 'is-busy' : ''}`} aria-busy={loading}>
          {items.map((task) => (
            <TaskItem key={task.id} task={task} onCycle={cycleStatus} onEdit={setEditing} onDelete={deleteTask} />
          ))}
        </ul>
      ) : (
        !error && (
          <div className="empty">
            {filtered ? (
              <>
                <p>No tasks match these filters.</p>
                <button className="btn btn-ghost" onClick={clearFilters}>
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <p>You have no tasks yet.</p>
                <button className="btn btn-primary" onClick={() => setEditing({})}>
                  Create your first task
                </button>
              </>
            )}
          </div>
        )
      )}

      <Pagination page={meta.page} pages={meta.pages} onChange={(p) => setParam({ page: p })} />

      {editing && <TaskModal task={editing} onClose={() => setEditing(null)} onSave={saveTask} />}
    </>
  );
}
