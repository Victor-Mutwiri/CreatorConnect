import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, User as UserIcon, LogOut, Settings, LayoutDashboard, FileText, Sun, Moon, Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from './Button';
import { NAV_ITEMS, APP_NAME } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserRole } from '../types';
import { mockContractService } from '../services/mockContract';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hasUnreadNotes, setHasUnreadNotes] = useState(false);
  
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkNotes = async () => {
      if (user) {
        const notes = await mockContractService.getNotifications(user.id);
        setHasUnreadNotes(notes.some(n => !n.read));
      }
    };
    checkNotes();
    // Poll for notifications occasionally
    const interval = setInterval(checkNotes, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsOpen(false);
    setUserMenuOpen(false);
  };

  const isCreator = user?.role === UserRole.CREATOR;
  const isClient = user?.role === UserRole.CLIENT;

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm py-4' 
          : 'bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to={user ? (isCreator ? "/creator/dashboard" : "/client/dashboard") : "/"} className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <Sparkles size={20} fill="currentColor" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {!user && NAV_ITEMS.map((item) => (
              <a 
                key={item.label} 
                href={item.href}
                className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
            
            {user && (
              <>
                 <Link to={isCreator ? "/creator/dashboard" : "/client/dashboard"} className="text-slate-600 dark:text-slate-300 hover:text-brand-600 font-medium">
                   Dashboard
                 </Link>
                 <Link to="/notifications" className="text-slate-600 dark:text-slate-300 hover:text-brand-600 font-medium relative">
                   Notifications
                   {hasUnreadNotes && (
                     <span className="absolute -top-1 -right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                   )}
                 </Link>
              </>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {user ? (
              <div className="relative">
                 <button 
                   onClick={() => setUserMenuOpen(!userMenuOpen)}
                   className="flex items-center space-x-2 focus:outline-none"
                 >
                   <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold border border-brand-200 overflow-hidden">
                     {user.avatarUrl ? (
                       <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                     ) : (
                       user.name.charAt(0)
                     )}
                   </div>
                   <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden lg:block">{user.name}</span>
                 </button>

                 {/* Dropdown */}
                 {userMenuOpen && (
                   <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 animate-in fade-in slide-in-from-top-2">
                     <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-800">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        {user.clientProfile?.clientType && (
                           <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full mt-1 inline-block">
                             {user.clientProfile.clientType}
                           </span>
                        )}
                     </div>
                     
                     <Link 
                       to="/notifications"
                       className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                       onClick={() => setUserMenuOpen(false)}
                     >
                       <Bell size={16} className="mr-2 text-slate-400" />
                       Notifications
                       {hasUnreadNotes && <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>}
                     </Link>

                     {isCreator && (
                       <>
                         <Link 
                            to="/creator/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <LayoutDashboard size={16} className="mr-2 text-slate-400" />
                            Dashboard
                          </Link>
                          <Link 
                            to="/creator/contracts"
                            className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <FileText size={16} className="mr-2 text-slate-400" />
                            My Contracts
                          </Link>
                          <Link 
                            to={user.profile?.username ? `/p/${user.profile.username}` : (user.profile ? `/profile/${user.id}` : '/creator/onboarding')}
                            className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <UserIcon size={16} className="mr-2 text-slate-400" />
                            Public Profile
                          </Link>
                       </>
                     )}

                     {isClient && (
                        <>
                          <Link 
                            to="/client/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <LayoutDashboard size={16} className="mr-2 text-slate-400" />
                            Dashboard
                          </Link>
                          <Link 
                            to={`/client/profile/${user.id}`}
                            className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <UserIcon size={16} className="mr-2 text-slate-400" />
                            Public Profile
                          </Link>
                        </>
                     )}
                     
                     <Link 
                       to={isCreator ? "/creator/settings" : "/client/settings"}
                       className="flex w-full items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                       onClick={() => setUserMenuOpen(false)}
                     >
                       <Settings size={16} className="mr-2 text-slate-400" />
                       Settings
                     </Link>
                     <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                     <button 
                       onClick={handleSignOut}
                       className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                     >
                       <LogOut size={16} className="mr-2" />
                       Sign Out
                     </button>
                   </div>
                 )}
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400"
            >
              {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
            </button>
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-700 dark:text-slate-200 hover:text-brand-600 focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-xl p-4 animate-in slide-in-from-top-5 h-screen overflow-y-auto">
          <div className="flex flex-col space-y-4">
            {!user && NAV_ITEMS.map((item) => (
              <a 
                key={item.label} 
                href={item.href}
                className="text-slate-600 dark:text-slate-300 hover:text-brand-600 font-medium px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col space-y-3">
              {user ? (
                <>
                  <Link 
                    to={isCreator ? "/creator/dashboard" : "/client/dashboard"}
                    className="flex items-center space-x-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                     <LayoutDashboard size={20} className="text-slate-500" />
                     <span className="font-medium text-slate-900 dark:text-white">Dashboard</span>
                  </Link>
                   <Link 
                    to="/notifications"
                    className="flex items-center space-x-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                     <Bell size={20} className="text-slate-500" />
                     <span className="font-medium text-slate-900 dark:text-white">Notifications</span>
                     {hasUnreadNotes && <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>}
                  </Link>
                   <Link 
                    to={isCreator ? "/creator/settings" : "/client/settings"}
                    className="flex items-center space-x-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                     <Settings size={20} className="text-slate-500" />
                     <span className="font-medium text-slate-900 dark:text-white">Settings</span>
                  </Link>
                  <Button variant="outline" className="w-full justify-center" onClick={handleSignOut}>Sign Out</Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full justify-center">Log in</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)}>
                    <Button variant="primary" className="w-full justify-center">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;