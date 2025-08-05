
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Project } from '../types';
import { BriefcaseIcon, PlusIcon, GlobeMagnifyingGlassIcon } from './icons/Icons';

interface ProjectsProps {
    onSelectProject: (project: Project) => void;
}

const Projects: React.FC<ProjectsProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectUrl, setNewProjectUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        console.error('Error fetching projects:', fetchError.message);
      } else {
        setProjects((data as unknown as Project[]) || []);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = newProjectName.trim();
    const trimmedUrl = newProjectUrl.trim();

    if (!trimmedName || !trimmedUrl) {
      setError('Project name and URL are required.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const newProject = {
        name: trimmedName,
        site_url: trimmedUrl,
        user_id: user.id,
      };

      const { error: insertError } = await supabase.from('projects').insert([newProject]);

      if (insertError) {
        setError(insertError.message);
      } else {
        setNewProjectName('');
        setNewProjectUrl('');
        await fetchProjects(); // Refresh the list
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Projects List */}
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <BriefcaseIcon />
            <span className="ml-3">Your Projects</span>
        </h2>
        <div className="bg-navy-800 border border-navy-700 rounded-lg p-6">
          {loading ? (
            <p className="text-gray-400">Loading projects...</p>
          ) : error && projects.length === 0 ? (
             <div className="text-center py-8">
                <p className="text-red-400">{error}</p>
             </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-xl font-semibold text-white">No Projects Yet</h3>
              <p className="text-gray-400 mt-2">Create your first project to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map(project => (
                <button 
                  key={project.id} 
                  onClick={() => onSelectProject(project)}
                  className="w-full text-left bg-navy-900/70 p-4 rounded-lg border border-navy-600 flex items-center justify-between hover:border-command-blue transition-all"
                >
                  <div>
                    <h3 className="font-bold text-white">{project.name}</h3>
                    <p className="text-sm text-gray-400 flex items-center mt-1">
                        <GlobeMagnifyingGlassIcon className="w-4 h-4 mr-2" />
                        {project.site_url}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Form */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <PlusIcon className="w-6 h-6" />
            <span className="ml-3">Create New Project</span>
        </h2>
        <div className="bg-navy-800 border border-navy-700 rounded-lg p-6">
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-300">
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g., Acme Corp Website"
                className="mt-1 w-full bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-command-blue transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="projectUrl" className="block text-sm font-medium text-gray-300">
                Site URL
              </label>
              <input
                id="projectUrl"
                type="url"
                value={newProjectUrl}
                onChange={(e) => setNewProjectUrl(e.target.value)}
                placeholder="https://www.example.com"
                className="mt-1 w-full bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-command-blue transition-all"
                required
              />
            </div>
             {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center bg-command-blue hover:bg-command-blue-dark text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Projects;
