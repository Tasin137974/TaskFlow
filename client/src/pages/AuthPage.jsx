import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const SAMPLE = [
  { status: 'done', title: 'Set up the repository' },
  { status: 'in_progress', title: 'Build the task list' },
  { status: 'todo', title: 'Deploy and share the link' },
];

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    try {
      if (isRegister) await register(form);
      else await login({ email: form.email, password: form.password });
    } catch (err) {
      setErrors(err.details || { form: err.message });
      setPending(false);
    }
  }

  return (
    <div className="auth">
      <aside className="auth-hero" aria-hidden="true">
        <span className="brand brand-light">
          <span className="brand-mark" />
          TaskFlow
        </span>
        <div>
          <h2>Move every task from to do to done.</h2>
          <ul className="hero-list">
            {SAMPLE.map((s) => (
              <li key={s.title}>
                <span className="marker marker-static" data-status={s.status} />
                {s.title}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="auth-panel">
        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <h1>{isRegister ? 'Create your account' : 'Log in'}</h1>

          {isRegister && (
            <div className="field">
              <label htmlFor="name">Name</label>
              <input id="name" autoComplete="name" value={form.name} onChange={set('name')} aria-invalid={Boolean(errors.name)} />
              {errors.name && <p className="field-error">{errors.name}</p>}
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} aria-invalid={Boolean(errors.email)} />
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              value={form.password}
              onChange={set('password')}
              aria-invalid={Boolean(errors.password)}
            />
            {isRegister && !errors.password && <p className="hint">Use at least 8 characters.</p>}
            {errors.password && <p className="field-error">{errors.password}</p>}
          </div>

          {errors.form && <p className="form-error" role="alert">{errors.form}</p>}

          <button className="btn btn-primary btn-block" disabled={pending}>
            {pending ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>

          <p className="auth-switch muted">
            {isRegister ? 'Already have an account?' : 'New to TaskFlow?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create an account'}</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
