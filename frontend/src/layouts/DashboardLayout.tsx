import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Users,
  MessageSquare,
  FileText,
  BarChart3,
  Network,
  LogOut,
  Sparkles,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'CRM / Leads', href: '/leads', icon: Users },
    { name: 'Communication / Inbox', href: '/inbox', icon: MessageSquare },
    { name: 'Document Intelligence', href: '/documents', icon: FileText },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    { name: 'Workflows', href: '/workflows', icon: Network },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex bg-zinc-950 text-zinc-100 font-sans">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-[128px] pointer-events-none"></div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800 bg-zinc-900/40 backdrop-blur-md z-20 shrink-0">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Ordinis AI</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-sm shadow-purple-500/5'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-purple-400' : 'text-zinc-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md z-30 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Ordinis AI</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setMobileMenuOpen(false)}>
          <aside
            className="w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col pt-20"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex-1 px-4 py-6 space-y-1.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-purple-400' : 'text-zinc-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-zinc-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pt-0 pt-16">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-900 bg-zinc-950/20 backdrop-blur-sm px-8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-zinc-400 hidden md:block">
              Welcome back, <span className="text-zinc-200 font-bold">{user?.email}</span>
            </h2>
          </div>

          {/* User profile dropdown */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-zinc-300">{user?.businessName}</span>
            </div>
          </div>
        </header>

        {/* Content Route Outlet */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
