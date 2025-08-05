import React from 'react';
import { BellIcon, UserCircleIcon, ArrowRightOnRectangleIcon } from './icons/Icons';
import { Session } from '../types';

interface HeaderProps {
  title: string;
  session: Session | null;
  handleSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, session, handleSignOut }) => {
  return (
    <header className="flex items-center justify-between h-20 px-8 bg-navy-800 border-b border-navy-700 flex-shrink-0">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      <div className="flex items-center space-x-6">
        <button className="relative text-gray-400 hover:text-white transition-colors">
          <BellIcon />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center space-x-4">
           <UserCircleIcon />
           <span className="text-white font-medium text-sm">{session?.user?.email || 'User'}</span>
        </div>
        <button 
          onClick={handleSignOut}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Sign Out"
        >
          <ArrowRightOnRectangleIcon />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Header;