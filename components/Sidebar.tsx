
import React from 'react';
import { View } from '../types';
import { HomeIcon, SparklesIcon, DocumentMagnifyingGlassIcon, PencilSquareIcon, MegaphoneIcon, CommandFlowIcon, GlobeMagnifyingGlassIcon, BriefcaseIcon } from './icons/Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  const navItems = [
    { id: View.DASHBOARD, label: 'Dashboard', icon: <HomeIcon /> },
    { id: View.PROJECTS, label: 'Projects', icon: <BriefcaseIcon /> },
    { id: View.ORACLE, label: 'The Oracle', icon: <SparklesIcon /> },
    { id: View.AUDITS, label: 'Technical Audit', icon: <DocumentMagnifyingGlassIcon /> },
    { id: View.SITE_AUDIT, label: 'Full Site Audit', icon: <GlobeMagnifyingGlassIcon /> },
    { id: View.CONTENT_BRIEFS, label: 'Content Briefs', icon: <PencilSquareIcon /> },
    { id: View.OUTREACH, label: 'Outreach', icon: <MegaphoneIcon /> },
  ];

  return (
    <div className="w-64 bg-navy-800 border-r border-navy-700 flex flex-col">
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
              setCurrentView(item.id);
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
  );
};

export default Sidebar;
