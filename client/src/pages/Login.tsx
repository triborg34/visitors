import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { FileText, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ApiRequestError } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Field, TextInput } from '../components/ui/Field';

export default function Login() {
  const { login, isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/app/new'} replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('نام کاربری و رمز عبور را وارد کنید.');
      return;
    }
    setSubmitting(true);
    try {
      const loggedInUser = await login(username.trim(), password);
      navigate(loggedInUser.role === 'ADMIN' ? '/admin' : '/app/new', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : 'ورود ناموفق بود. لطفاً دوباره تلاش کنید.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-bl from-brand-900 via-brand-800 to-slate-900 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <span className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <FileText className="size-8" />
          </span>
          <h1 className="text-xl font-bold">سامانه مدیریت بازدیدکنندگان</h1>
          <p className="mt-1 text-sm text-white/70">امن‌آفرینان — نمایشگاه‌ها و مشتریان</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <Field label="نام کاربری" htmlFor="username" required>
            <div className="relative">
              <User className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <TextInput
                id="username"
                dir="ltr"
                autoComplete="username"
                className="ps-9 text-start"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="admin"
              />
            </div>
          </Field>

          <Field label="رمز عبور" htmlFor="password" required>
            <div className="relative">
              <Lock className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <TextInput
                id="password"
                type="password"
                dir="ltr"
                autoComplete="current-password"
                className="ps-9 text-start"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>
          </Field>

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" fullWidth loading={submitting}>
            ورود به سامانه
          </Button>

          <p className="text-center text-xs leading-6 text-slate-500">
            در صورت فراموشی رمز عبور با مدیر سیستم تماس بگیرید.
          </p>
        </form>
      </div>
    </div>
  );
}
