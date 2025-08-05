
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Project, OutreachProspect } from '../types';
import { generateOutreachEmail } from '../services/geminiService';
import { MegaphoneIcon, PlusIcon, SparklesIcon, ClipboardIcon, ClipboardDocumentCheckIcon } from './icons/Icons';

const Outreach: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [prospects, setProspects] = useState<OutreachProspect[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newProspect, setNewProspect] = useState({ name: '', website: '', email: '', status: 'Identified' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [generatingEmailFor, setGeneratingEmailFor] = useState<string | null>(null);
    const [generatedEmail, setGeneratedEmail] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const prospectStatuses = ['Identified', 'Contacted', 'Replied', 'Link Acquired', 'Rejected'];

    const fetchProjects = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) {
                setError('Failed to fetch projects.');
            } else if (data) {
                const projectData = (data as unknown as Project[]) || [];
                setProjects(projectData);
                if (projectData.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(projectData[0].id);
                }
            }
        }
    }, [selectedProjectId]);

    const fetchProspects = useCallback(async (projectId: string) => {
        if (!projectId) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('outreach_prospects')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            setError(error.message);
        } else {
            setProspects((data as unknown as OutreachProspect[]) || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        if (selectedProjectId) {
            fetchProspects(selectedProjectId);
        }
    }, [selectedProjectId, fetchProspects]);
    
    const handleCreateProspect = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const trimmedName = newProspect.name.trim();
        const trimmedWebsite = newProspect.website.trim();

        if (!trimmedName || !trimmedWebsite) {
            setError('Prospect name and website are required.');
            return;
        }
        
        setIsSubmitting(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const prospectToInsert = {
                name: trimmedName,
                website: trimmedWebsite,
                email: newProspect.email.trim(),
                status: newProspect.status,
                project_id: selectedProjectId,
                user_id: user.id,
            };

            const { error: insertError } = await supabase.from('outreach_prospects').insert([prospectToInsert]);

            if (insertError) {
                setError(insertError.message);
            } else {
                setNewProspect({ name: '', website: '', email: '', status: 'Identified' });
                await fetchProspects(selectedProjectId); // Refresh the list
            }
        }
        setIsSubmitting(false);
    };

    const handleGenerateEmail = async (prospect: OutreachProspect) => {
        setGeneratingEmailFor(prospect.id);
        setGeneratedEmail(null);
        setError(null);
        const project = projects.find(p => p.id === prospect.project_id);
        if (!project) {
            setError("Could not find associated project.");
            setGeneratingEmailFor(null);
            return;
        }

        try {
            const emailText = await generateOutreachEmail(prospect.name, prospect.website, project.site_url);
            setGeneratedEmail(emailText);
        } catch (e) {
            if (e instanceof Error) setError(e.message);
            else setError("An unknown error occurred while generating the email.");
        } finally {
            setGeneratingEmailFor(null);
        }
    };
    
    const handleCopyEmail = () => {
        if(generatedEmail){
            navigator.clipboard.writeText(generatedEmail);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }
    
    const statusColor = (status: string) => {
        switch (status) {
            case 'Link Acquired': return 'bg-green-500/30 text-green-300 border-green-500/50';
            case 'Contacted': return 'bg-blue-500/30 text-blue-300 border-blue-500/50';
            case 'Replied': return 'bg-purple-500/30 text-purple-300 border-purple-500/50';
            case 'Rejected': return 'bg-red-500/30 text-red-300 border-red-500/50';
            default: return 'bg-navy-700 text-gray-300 border-navy-600';
        }
    };

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <MegaphoneIcon />
                        <span className="ml-3">Outreach Pipeline</span>
                    </h2>
                     <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="mt-4 sm:mt-0 max-w-xs bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-command-blue"
                        disabled={projects.length === 0}
                    >
                        {projects.length === 0 ? (
                             <option>Create a project first</option>
                        ) : (
                           projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                        )}
                    </select>
                </div>
                <div className="bg-navy-800 border border-navy-700 rounded-lg p-6">
                    {loading ? (
                        <p className="text-gray-400 text-center py-8">Loading prospects...</p>
                    ) : prospects.length === 0 ? (
                         <div className="text-center py-8">
                            <h3 className="text-xl font-semibold text-white">No Prospects Yet</h3>
                            <p className="text-gray-400 mt-2">Add your first outreach prospect to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {prospects.map(prospect => (
                                <div key={prospect.id} className="bg-navy-900/70 p-4 rounded-lg border border-navy-600">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h3 className="font-bold text-white">{prospect.name}</h3>
                                            <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="text-sm text-command-blue hover:underline truncate">{prospect.website}</a>
                                            <p className="text-sm text-gray-400">{prospect.email}</p>
                                        </div>
                                        <div className="flex items-center gap-4 mt-3 sm:mt-0">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColor(prospect.status)}`}>
                                                {prospect.status}
                                            </span>
                                            <button 
                                                onClick={() => handleGenerateEmail(prospect)}
                                                disabled={generatingEmailFor === prospect.id}
                                                className="bg-command-blue/80 hover:bg-command-blue text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center text-sm transition-all duration-200 disabled:opacity-50"
                                            >
                                                <SparklesIcon className="w-4 h-4 mr-2"/>
                                                {generatingEmailFor === prospect.id ? 'Generating...' : 'Email'}
                                            </button>
                                        </div>
                                    </div>
                                    {generatingEmailFor === prospect.id && !generatedEmail && (
                                         <div className="text-center text-sm text-gray-400 py-4">The Closer is drafting an email...</div>
                                    )}
                                    {generatedEmail && generatingEmailFor === null && (
                                         <div className="mt-4 p-4 bg-navy-800/70 border border-navy-600 rounded-md">
                                            <h4 className="font-semibold text-light-blue text-sm mb-2">Generated Email Draft:</h4>
                                            <textarea
                                                readOnly
                                                value={generatedEmail}
                                                className="w-full bg-navy-900/50 p-2 rounded text-gray-300 text-sm h-40 resize-y border border-navy-700"
                                            />
                                            <button onClick={handleCopyEmail} className="mt-2 flex items-center text-sm bg-green-500/20 text-green-300 font-semibold px-3 py-1 rounded-md hover:bg-green-500/40 transition-colors">
                                                {copied ? <ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" /> : <ClipboardIcon className="w-4 h-4 mr-2" />}
                                                {copied ? 'Copied!' : 'Copy Email'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <PlusIcon className="w-6 h-6" />
                    <span className="ml-3">Add New Prospect</span>
                </h2>
                <div className="bg-navy-800 border border-navy-700 rounded-lg p-6">
                    <form onSubmit={handleCreateProspect} className="space-y-4">
                        {/* Form fields */}
                        <div>
                            <label htmlFor="prospectName" className="block text-sm font-medium text-gray-300">Name</label>
                            <input id="prospectName" type="text" value={newProspect.name} onChange={(e) => setNewProspect({...newProspect, name: e.target.value})} placeholder="e.g., Jane Doe" className="mt-1 w-full bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-command-blue text-sm" required />
                        </div>
                        <div>
                             <label htmlFor="prospectWebsite" className="block text-sm font-medium text-gray-300">Website</label>
                            <input id="prospectWebsite" type="url" value={newProspect.website} onChange={(e) => setNewProspect({...newProspect, website: e.target.value})} placeholder="https://www.prospectsite.com" className="mt-1 w-full bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-command-blue text-sm" required />
                        </div>
                         <div>
                             <label htmlFor="prospectEmail" className="block text-sm font-medium text-gray-300">Email (Optional)</label>
                            <input id="prospectEmail" type="email" value={newProspect.email} onChange={(e) => setNewProspect({...newProspect, email: e.target.value})} placeholder="jane@prospectsite.com" className="mt-1 w-full bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-command-blue text-sm" />
                        </div>
                         <div>
                            <label htmlFor="prospectStatus" className="block text-sm font-medium text-gray-300">Status</label>
                            <select id="prospectStatus" value={newProspect.status} onChange={(e) => setNewProspect({...newProspect, status: e.target.value})} className="mt-1 w-full bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-command-blue text-sm">
                                {prospectStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                        {error && <p className="text-sm text-red-400">{error}</p>}
                        <button type="submit" disabled={isSubmitting || !selectedProjectId} className="w-full flex justify-center items-center bg-command-blue hover:bg-command-blue-dark text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Adding...' : 'Add Prospect'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Outreach;
