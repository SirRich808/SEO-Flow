import React from 'react';
import { BellIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from './icons/Icons';
import { Session } from '../types';

interface HeaderProps {
  title: string;
  session: Session | null;
  handleSignOut: () => void;
  onMobileMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, session, handleSignOut, onMobileMenuClick }) => {
  return (
    <header className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8 bg-navy-800 border-b border-navy-700 flex-shrink-0">
      {/* Mobile menu button - visible only on mobile */}
      <div className="flex items-center lg:hidden">
        <button
          onClick={onMobileMenuClick}
          className="text-gray-400 hover:text-white transition-colors p-2 mr-3"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      {/* Title - responsive sizing */}
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">{title}</h1>
      
      {/* Header actions - responsive layout */}
      <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
        {/* Notification bell - hidden on small screens */}
        <button className="hidden sm:block relative text-gray-400 hover:text-white transition-colors">
          <BellIcon />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
        
        {/* User info - responsive */}
        <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
           <UserCircleIcon />
           <span className="text-white font-medium text-xs sm:text-sm max-w-[100px] lg:max-w-none truncate">
             {session?.user?.email || 'User'}
           </span>
        </div>
        
        {/* User icon only for mobile */}
        <div className="md:hidden">
           <UserCircleIcon />
        </div>
        
        {/* Sign out button - responsive */}
        <button 
          onClick={handleSignOut}
          className="flex items-center space-x-1 sm:space-x-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Sign Out"
        >
          <ArrowRightOnRectangleIcon />
          <span className="hidden sm:inline text-xs sm:text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Header;