'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  BookOpen,
  Building2,
  Calendar,
  ChevronDown,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Menu,
  Settings,
  Shield,
  ShieldAlert,
  User,
  Users,
  X
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Propriétés', href: '/dashboard/properties', icon: Building2 },
  { name: 'Inventaires', href: '/dashboard/inventory', icon: FileText },
  { name: 'Guests', href: '/dashboard/guests', icon: Users },
  { name: 'Deposits', href: '/dashboard/deposits', icon: CreditCard },
  { name: 'Calendrier', href: '/dashboard/calendrier', icon: Calendar },
  { name: "Guides", href: '/dashboard/guidebook', icon: BookOpen },
  { name: 'Paramètres', href: '/dashboard/settings', icon: Settings, showOnMobile: false }
];

const SUPER_ADMIN_ITEM = {
  name: 'Super admin',
  href: '/dashboard/super-admin',
  icon: ShieldAlert
};

const buildNavigation = (role) => {
  if (role !== 'superadmin') {
    return [...NAV_ITEMS];
  }

  const [firstItem, ...rest] = NAV_ITEMS;
  return [firstItem, SUPER_ADMIN_ITEM, ...rest];
};

const isActivePath = (currentPath, targetPath) =>
  currentPath === targetPath ||
  (targetPath !== '/dashboard' && currentPath.startsWith(targetPath));

export default function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();
  const pathname = usePathname();

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth-token');

      if (!token) {
        setNotifications([]);
        return;
      }

      const response = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.filter((notification) => !notification.read));
        return;
      }

      if (response.status === 401) {
        console.warn('Unauthorized when fetching notifications');
      }

      setNotifications([]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
      fetchNotifications();
      return;
    }

    router.push('/auth/login');
  }, [fetchNotifications, router]);

  const navigation = useMemo(() => buildNavigation(user?.role), [user?.role]);
  const mobileNavigation = useMemo(
    () => navigation.filter((item) => item.showOnMobile !== false),
    [navigation]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  }, [router]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((previous) => !previous);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const toggleProfileDropdown = useCallback(() => {
    setIsProfileDropdownOpen((previous) => !previous);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white shadow-lg">
          {/* Logo */}
          <div className="flex h-16 flex-shrink-0 items-center px-6 border-b border-gray-200">
            <Shield className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold gradient-text">Checkinly</span>
          </div>
          
          {/* Navigation */}
          <nav className="mt-6 flex-1 space-y-1 px-4">
            {navigation.map(({ name, href, icon: Icon }) => {
              const active = isActivePath(pathname, href);

              return (
                <Link
                  key={name}
                  href={href}
                  className={`${
                    active
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center rounded-l-lg border-r-2 border-transparent px-3 py-2 text-sm font-medium transition-colors`}
                >
                  <Icon
                    className={`${
                      active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 h-5 w-5 flex-shrink-0`}
                  />
                  {name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className="relative">
              <button
                onClick={toggleProfileDropdown}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-pink-600">
                    {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user ? user.email : ''}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <Link
                    href="/settings/profile"
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={toggleProfileDropdown}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Mon profil
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={toggleProfileDropdown}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Paramètres
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-3 py-2 text-sm text-danger-600 hover:bg-danger-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="lg:hidden">
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black/50" onClick={closeMobileMenu} />
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={closeMobileMenu}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              <div className="flex h-16 flex-shrink-0 items-center px-4 border-b border-gray-200">
                <Shield className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold gradient-text">Checkinly</span>
              </div>
              
              <nav className="mt-6 flex-1 space-y-1 px-4">
                {navigation.map(({ name, href, icon: Icon }) => {
                  const active = isActivePath(pathname, href);

                  return (
                    <Link
                      key={name}
                      href={href}
                      className={`${
                        active
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center rounded-lg px-3 py-2 text-sm font-medium`}
                      onClick={closeMobileMenu}
                    >
                      <Icon
                        className={`${
                          active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                        } mr-3 h-5 w-5 flex-shrink-0`}
                      />
                      {name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="relative rounded-full p-2 text-gray-400 transition hover:text-gray-500">
                  <Bell className="h-6 w-6" />
                  {notifications.length > 0 && (
                    <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-center text-xs font-medium text-white">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Mobile profile */}
              <div className="lg:hidden">
                <button onClick={toggleProfileDropdown} className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 safe-bottom">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <div className="mobile-nav lg:hidden">
        <div className="flex justify-between">
          {mobileNavigation.map(({ name, href, icon: Icon }) => {
            const active = isActivePath(pathname, href);

            return (
              <Link
                key={name}
                href={href}
                className={`flex flex-col items-center  px-3 py-2 ${
                  active ? 'text-pink-600' : 'text-gray-500'
                }`}
              >
                <Icon className="mb-1 h-6 w-6" />
                <span className="text-[10px] uppercase">{name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}