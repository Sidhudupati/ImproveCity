import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { useMemo, useState } from 'react';
import {
  RiFileAddLine,
  RiFileListLine,
  RiCheckboxCircleLine,
  RiShieldStarLine,
  RiMenuLine,
  RiCloseLine,
  RiLogoutBoxRLine,
  RiLoginBoxLine,
  RiTrophyLine,
} from 'react-icons/ri';

export function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  const navItems = useMemo(
    () =>
      [
        { to: '/report', label: 'Report Issue' },
        { to: '/my-issues', label: 'My Issues' },
        { to: '/resolved', label: 'Resolved' },
        { to: '/leaderboard', label: 'Leaderboard' },
        ...(user?.isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
      ] as { to: string; label: string }[],
    [user?.isAdmin]
  );

  const mobileNavItems = useMemo(
    () =>
      [
        { to: '/report', label: 'Report Issue', icon: RiFileAddLine },
        { to: '/my-issues', label: 'My Issues', icon: RiFileListLine },
        { to: '/resolved', label: 'Resolved', icon: RiCheckboxCircleLine },
        { to: '/leaderboard', label: 'Leaderboard', icon: RiTrophyLine },
        ...(user?.isAdmin ? [{ to: '/admin', label: 'Admin', icon: RiShieldStarLine }] : []),
      ] as { to: string; label: string; icon: any }[],
    [user?.isAdmin]
  );

  const NavLink = ({
    to,
    label,
    isMobile = false
  }: {
    to: string;
    label: string;
    isMobile?: boolean;
  }) => {
    const active = isActive(to);

    if (isMobile) {
      return (
        <Link
          to={to}
          onClick={() => setMobileMenuOpen(false)}
          className={`
            group relative inline-flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium
            transition-all duration-200 ease-in-out w-full
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
            ${active
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-foreground hover:bg-accent'
            }
          `}
        >
          <span>{label}</span>
          {active && (
            <span className="ml-auto h-2 w-2 rounded-full bg-primary-foreground" />
          )}
        </Link>
      );
    }

    return (
      <Link
        to={to}
        className={`
          relative inline-flex items-center px-3 py-2 text-sm font-medium
          transition-all duration-200 ease-in-out rounded-md
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
          ${active
            ? 'text-foreground font-semibold'
            : 'text-muted-foreground hover:text-foreground'
          }
        `}
      >
        <span>{label}</span>
        {active && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
        )}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/80 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
            >
              <img src='/logo.png' alt="Improve My City Logo" className="h-10 w-10" />
              <div className="hidden sm:block">
                <span className="text-lg uppercase font-extrabold tracking-tight text-foreground">
                  <span className='text-primary'>Urban</span> Connect
                </span>
              </div>
            </Link>

            {user && (
              <div className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    label={item.label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <ThemeSwitcher />

            {user ? (
              <>
                {/* User Avatar & Info (Desktop) */}
                <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-border">
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-semibold leading-none text-foreground">{user.name}</p>
                      {user.isAdmin && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center justify-end gap-1">
                          <RiShieldStarLine className="h-3 w-3" />
                          Admin
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <img
                        src={
                          `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}&mouth[]=smile&eyes[0]=happy`
                        }
                        alt={user.name || 'User avatar'}
                        className="h-9 w-9 rounded-full ring-2 ring-border transition-all hover:ring-primary/50"
                      />
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="gap-2"
                >
                  <RiLogoutBoxRLine className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>

                {/* Mobile Menu Toggle */}
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-nav"
                >
                  {mobileMenuOpen ? (
                    <RiCloseLine className="h-5 w-5" />
                  ) : (
                    <RiMenuLine className="h-5 w-5" />
                  )}
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm" className="gap-2 shadow-sm">
                  <RiLoginBoxLine className="h-4 w-4" />
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {user && (
          <div
            id="mobile-nav"
            className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen
              ? 'max-h-[500px] opacity-100 pb-4'
              : 'max-h-0 opacity-0'
              }`}
          >
            <div className="space-y-1.5 pt-2">
              {/* User Info Mobile */}
              <div className="sm:hidden mb-3 p-3 rounded-lg bg-accent/50 border border-border">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'user')}&mouth[]=smile&eyes[0]=happy`
                    }
                    alt={user.name || 'User avatar'}
                    className="h-10 w-10 rounded-full ring-2 ring-border"
                  />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{user.name}</p>
                    {user.isAdmin && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <RiShieldStarLine className="h-3 w-3" />
                        Admin
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Nav Links */}
              {mobileNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  isMobile
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
