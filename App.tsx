
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Oracle from './components/Oracle';
import Audits from './components/Audits';
import SiteAudit from './components/SiteAudit';
import ContentBriefs from './components/ContentBriefs';
import Projects from './components/Projects';
import ProjectDetail from './components/ProjectDetail';
import Outreach from './components/Outreach';
import Auth from './components/Auth';
import { View, Session, Project } from './types';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [session, setSession] = useState<Session | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentView(View.PROJECT_DETAIL);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setCurrentView(View.PROJECTS);
  };

  const renderView = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard />;
      case View.PROJECTS:
        return <Projects onSelectProject={handleSelectProject} />;
      case View.PROJECT_DETAIL:
        return selectedProject ? <ProjectDetail project={selectedProject} onBack={handleBackToProjects} /> : <Projects onSelectProject={handleSelectProject} />;
      case View.ORACLE:
        return <Oracle />;
      case View.AUDITS:
        return <Audits />;
      case View.SITE_AUDIT:
        return <SiteAudit />;
      case View.CONTENT_BRIEFS:
        return <ContentBriefs />;
      case View.OUTREACH:
        return <Outreach />;
      default:
        return <Dashboard />;
    }
  };
  
  const viewTitles: Record<string, string> = {
    [View.DASHBOARD]: 'Command Center',
    [View.PROJECTS]: 'Project Management',
    [View.PROJECT_DETAIL]: selectedProject ? `Project: ${selectedProject.name}` : 'Project Details',
    [View.ORACLE]: 'The Oracle: Predictive SERP Simulator',
    [View.AUDITS]: 'Technical SEO Audit',
    [View.SITE_AUDIT]: 'Full Site Audit',
    [View.CONTENT_BRIEFS]: 'God-Mode Content Briefs',
    [View.OUTREACH]: 'Intelligent Outreach CRM',
  }
  
  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-navy-900 text-gray-200 font-sans">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={viewTitles[currentView]} 
          session={session} 
          handleSignOut={() => supabase.auth.signOut()}
          onMobileMenuClick={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-navy-900 p-4 sm:p-6 lg:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
