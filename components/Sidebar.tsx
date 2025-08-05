
import React from 'react';
import { View } from '../types';
import { HomeIcon, SparklesIcon, DocumentMagnifyingGlassIcon, PencilSquareIcon, MegaphoneIcon, CommandFlowIcon, GlobeMagnifyingGlassIcon, BriefcaseIcon } from './icons/Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const navItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: <HomeIcon /> },
    { id: View.PROJECTS, label: 'Projects', icon: <BriefcaseIcon /> },
    { id: View.ORACLE, label: 'The Oracle', icon: <SparklesIcon /> },
    { id: View.AUDITS, label: 'Technical Audit', icon: <DocumentMagnifyingGlassIcon /> },
    { id: View.SITE_AUDIT, label: 'Full Site Audit', icon: <GlobeMagnifyingGlassIcon /> },
    { id: View.CONTENT_BRIEFS, label: 'Content Briefs', icon: <PencilSquareIcon /> },
    { id: View.OUTREACH, label: 'Outreach', icon: <MegaphoneIcon /> },
  ];

  const handleNavClick = (viewId: View) => {
    setCurrentView(viewId);
    setIsMobileMenuOpen(false); // Close mobile menu when item is selected
  };

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:flex w-64 bg-navy-800 border-r border-navy-700 flex-col">
        <div className="flex items-center justify-center h-20 border-b border-navy-700">
          <CommandFlowIcon />
          <h1 className="text-2xl font-bold text-white ml-2">SEO-Flow</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.id);
              }}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentView === item.id
                  ? 'bg-command-blue text-white'
                  : 'text-gray-300 hover:bg-navy-700 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="ml-4 font-medium">{item.label}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar - Slides in from left */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-800 transform transition-transform duration-300 ease-in-out lg:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-20 px-4 border-b border-navy-700">
          <div className="flex items-center">
            <CommandFlowIcon />
            <h1 className="text-xl font-bold text-white ml-2">SEO-Flow</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-gray-400 hover:text-white transition-colors p-2"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.id);
              }}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentView === item.id
                  ? 'bg-command-blue text-white'
                  : 'text-gray-300 hover:bg-navy-700 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="ml-4 font-medium">{item.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
