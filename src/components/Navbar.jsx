import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Calendar,
  Bell,
  LogOut,
  Stethoscope,
  ShieldAlert,
  CalendarCheck,
  Menu,
  X,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isPatient, isDoctor, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, requestBrowserPermission } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';
  const roleParam = new URLSearchParams(location.search).get('role');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-md border-b border-blue-900/40 shadow-sm shadow-blue-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25">
              <Stethoscope className="w-4.5 h-4.5" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">DocCare</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/doctors" className="hover:text-white transition-colors">Find Doctors</Link>
            {isPatient && (
              <Link to="/patient" className="hover:text-sky-300 transition-colors flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-sky-400" />
                My Appointments
              </Link>
            )}
            {isDoctor && (
              <Link to="/doctor" className="hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-cyan-400" />
                Doctor Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="hover:text-purple-300 transition-colors flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                Admin Console
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-full transition-colors focus:outline-none"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0c1a30] rounded-2xl shadow-2xl border border-blue-900/50 p-4 z-50">
                      <div className="flex items-center justify-between border-b border-blue-900/40 pb-3 mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="text-xs bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-semibold">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-sky-400 hover:text-sky-300 font-medium">
                              Mark all read
                            </button>
                          )}
                          <button onClick={requestBrowserPermission} className="text-slate-400 hover:text-slate-200" title="Enable Browser Notifications">
                            🔔
                          </button>
                        </div>
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-blue-900/30 space-y-1">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-sm text-slate-400">No notifications yet</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id}
                              onClick={() => !n.isRead && markAsRead(n._id)}
                              className={`p-2.5 rounded-xl cursor-pointer transition-colors text-left ${
                                n.isRead ? 'opacity-60 hover:bg-white/[0.03]' : 'bg-sky-500/[0.08] hover:bg-sky-500/[0.14]'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-xs text-white">{n.title}</span>
                                {!n.isRead && <span className="w-2 h-2 rounded-full bg-sky-400 mt-1 flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{n.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to={isDoctor ? '/doctor' : isAdmin ? '/admin' : '/patient'}
                  className="hidden sm:flex items-center gap-2 pl-2 border-l border-blue-900/40 hover:opacity-85 transition-opacity"
                  title="Go to dashboard"
                >
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold text-xs ring-1 ring-sky-500/40">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                    <span className="text-[10px] text-sky-400 capitalize font-medium">{user.role || (isDoctor ? 'doctor' : 'patient')}</span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/[0.08] rounded-lg transition-colors ml-1"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-blue-950/50 border border-blue-900/40">
                <Link
                  to={roleParam ? `/login?role=${roleParam}` : '/login'}
                  className={`text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-lg transition-all ${
                    isLoginPage
                      ? 'text-white bg-gradient-to-r from-sky-500 to-blue-600 shadow-md shadow-sky-500/25 border border-sky-400/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  Log In
                </Link>
                <Link
                  to={roleParam ? `/register?role=${roleParam}` : '/register'}
                  className={`text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-lg transition-all ${
                    isRegisterPage || (!isLoginPage && !isRegisterPage)
                      ? 'text-white bg-gradient-to-r from-sky-500 to-blue-600 shadow-md shadow-sky-500/25 border border-sky-400/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  Register
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:bg-white/[0.08] rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-blue-900/40 bg-[#091526] px-4 pt-2 pb-4 space-y-1">
          {[
            { to: '/', label: 'Home' },
            { to: '/doctors', label: 'Find Doctors' },
            ...(isPatient ? [{ to: '/patient', label: 'My Appointments' }] : []),
            ...(isDoctor ? [{ to: '/doctor', label: 'Doctor Dashboard' }] : []),
            ...(isAdmin ? [{ to: '/admin', label: 'Admin Console' }] : []),
            ...(!user ? [
              { to: roleParam ? `/login?role=${roleParam}` : '/login', label: 'Log In' },
              { to: roleParam ? `/register?role=${roleParam}` : '/register', label: 'Register' },
            ] : []),
          ].map(({ to, label }) => {
            const isActive = location.pathname === to.split('?')[0];
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2.5 px-3 rounded-xl font-medium text-sm transition-colors ${
                  isActive
                    ? 'text-white bg-sky-500/20 border border-sky-500/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
