import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  MessageSquareText,
  Settings,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const EMPLOYEE_NAV: NavItem[] = [
  { to: '/app/new', label: 'ثبت بازدیدکننده جدید', icon: UserPlus },
  { to: '/app/visitors', label: 'بازدیدکنندگان من', icon: Users },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'داشبورد مدیریتی', icon: LayoutDashboard, end: true },
  { to: '/admin/visitors', label: 'همه بازدیدکنندگان', icon: Users },
  { to: '/app/new', label: 'ثبت بازدیدکننده جدید', icon: UserPlus },
  { to: '/app/visitors', label: 'بازدیدکنندگان من', icon: Users },
  { to: '/admin/followups', label: 'مدیریت پیگیری', icon: ClipboardList },
  { to: '/admin/reports', label: 'گزارش‌ها و آمار', icon: BarChart3 },
  { to: '/admin/exhibitions', label: 'نمایشگاه‌ها', icon: Building2 },
  { to: '/admin/employees', label: 'کارمندان', icon: Users },
  { to: '/admin/templates', label: 'قالب‌های پیام', icon: MessageSquareText },
  { to: '/admin/connections', label: 'اتصال پیام‌رسان‌ها', icon: Link2 },
  { to: '/admin/settings', label: 'تنظیمات شرکت', icon: Settings },
];

export function AppShell() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = isAdmin ? ADMIN_NAV : EMPLOYEE_NAV;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
            aria-label="منو"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <Link to={isAdmin ? '/admin' : '/app/new'} className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-700 text-white">
              <FileText className="size-5" />
            </span>
            <span className="hidden sm:block">
              <span className="block text-sm font-bold text-slate-900">امن‌آفرینان</span>
              <span className="block text-xs text-slate-500">مدیریت بازدیدکنندگان نمایشگاه</span>
            </span>
          </Link>

          <div className="ms-auto flex items-center gap-2">
            <div className="hidden text-end sm:block">
              <p className="text-sm font-semibold text-slate-800">{user?.fullName}</p>
              <p className="text-xs text-slate-500">
                {isAdmin ? 'مدیر سیستم' : 'کارمند غرفه'}
                {user?.activeExhibition ? ' — ' + user.activeExhibition.name : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
              aria-label="خروج"
              title="خروج از حساب"
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-5 sm:px-6">
        <aside
          className={cn(
            'fixed inset-x-0 top-16 z-30 border-b border-slate-200 bg-white p-3 shadow-lg transition lg:sticky lg:top-20 lg:z-0 lg:h-fit lg:w-64 lg:shrink-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none',
            menuOpen ? 'block' : 'hidden lg:block',
          )}
        >
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-brand-700 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900',
                    )
                  }
                >
                  <Icon className="size-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-10">
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  );
}
