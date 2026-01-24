import { Link, useLocation } from 'react-router-dom';
import { Button } from '../ui';

interface HeaderProps {
  onThemeToggle: () => void;
  isDark: boolean;
  onLogout: () => void;
  onMobileMenuOpen: () => void;
}

const navLinks = [
  { path: '/', label: 'Dashboard' },
  { path: '/characters', label: 'Characters' },
  { path: '/gallery', label: 'Gallery' },
  { path: '/draw', label: 'Draw Editor' },
  { path: '/settings', label: 'Settings' },
];

export function Header({ onThemeToggle, isDark, onLogout, onMobileMenuOpen }: HeaderProps) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 h-12 px-4 flex items-center justify-between bg-white dark:bg-dark-panel border-b border-gray-200 dark:border-dark-border">
      {/* Logo */}
      <Link to="/" className="font-semibold text-gray-900 dark:text-gray-100">
        4K Studio
      </Link>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        {navLinks.map(link => {
          const isActive = location.pathname === link.path ||
            (link.path !== '/' && location.pathname.startsWith(link.path));

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`
                px-3 py-1.5 text-sm rounded-sm transition-colors
                ${isActive
                  ? 'bg-primary/10 text-primary dark:bg-primary/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-tertiary'
                }
              `}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-sm hover:bg-gray-100 dark:hover:bg-dark-tertiary transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Logout */}
        <Button variant="ghost" size="sm" onClick={onLogout}>
          Logout
        </Button>

        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}

// Mobile navigation drawer
interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const location = useLocation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute top-0 left-0 bottom-0 w-64 bg-white dark:bg-dark-panel border-r border-gray-200 dark:border-dark-border">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <span className="font-semibold text-gray-900 dark:text-gray-100">4K Studio</span>
        </div>
        <nav className="p-2">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path ||
              (link.path !== '/' && location.pathname.startsWith(link.path));

            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={`
                  block px-3 py-2 text-sm rounded-sm transition-colors
                  ${isActive
                    ? 'bg-primary/10 text-primary dark:bg-primary/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-dark-tertiary'
                  }
                `}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
