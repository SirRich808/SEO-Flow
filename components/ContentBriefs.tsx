
import React, { useState, useCallback, useEffect } from 'react';
import { generateContentBrief } from '../services/geminiService';
import { ContentBrief, Project, StoredBrief } from '../types';
import { PencilSquareIcon, LightBulbIcon, ListBulletIcon } from './icons/Icons';
import { supabase } from '../lib/supabaseClient';
import { Json } from '../types/supabase';

const LoadingSpinner: React.FC<{text: string}> = ({text}) => (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-command-blue"></div>
        <p className="text-lg text-gray-300">{text}</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center">
        <p className="font-bold">An Error Occurred</p>
        <p className="text-sm">{message}</p>
    </div>
);

const BriefDisplay: React.FC<{ brief: ContentBrief }> = ({ brief }) => (
    <div className="bg-navy-800 border border-navy-700 rounded-lg p-8 space-y-8 mt-8">
        <div>
            <h2 className="text-2xl font-bold text-white">Content Brief: <span className="text-command-blue">{brief.target_keyword}</span></h2>
        </div>

        <div className="border-t border-navy-700 pt-6">
            <h3 className="text-lg font-semibold text-light-blue flex items-center"><LightBulbIcon /> <span className="ml-2">Primary User Intent</span></h3>
            <p className="mt-2 text-gray-300">{brief.user_intent}</p>
        </div>

        <div className="border-t border-navy-700 pt-6">
            <h3 className="text-lg font-semibold text-light-blue flex items-center"><ListBulletIcon /> <span className="ml-2">Recommended Article Structure</span></h3>
            <div className="mt-4 space-y-4">
                {brief.recommended_structure.map((section, index) => (
                    <div key={index} className="pl-4 border-l-2 border-navy-600">
                        <h4 className="text-md font-bold text-white">H2: {section.h2}</h4>
                        {section.h3s && section.h3s.length > 0 && (
                             <ul className="mt-2 space-y-1 list-disc list-inside pl-4">
                                {section.h3s.map((h3, h3Index) => (
                                    <li key={h3Index} className="text-gray-400">
                                        <span className="font-semibold text-gray-300">H3:</span> {h3}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-navy-700 pt-6">
            <div>
                <h3 className="text-lg font-semibold text-light-blue">Key Entities & Topics</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                    {brief.key_entities.map((entity, index) => (
                        <span key={index} className="bg-navy-700 text-gray-300 text-sm font-medium px-3 py-1 rounded-full">{entity}</span>
                    ))}
                </div>
            </div>
             <div>
                <h3 className="text-lg font-semibold text-light-blue">Questions to Answer</h3>
                <ul className="mt-3 space-y-2 list-disc list-inside">
                     {brief.people_also_ask.map((question, index) => (
                        <li key={index} className="text-gray-300">{question}</li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
);


const ContentBriefs: React.FC = () => {
    const [keyword, setKeyword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [briefResult, setBriefResult] = useState<ContentBrief | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [savedBriefs, setSavedBriefs] = useState<StoredBrief[]>([]);
    const [isFetchingBriefs, setIsFetchingBriefs] = useState(false);


    useEffect(() => {
        const fetchProjects = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    setError('Failed to fetch projects.');
                } else {
                    const projectData = (data as unknown as Project[]) || [];
                    setProjects(projectData);
                    if (projectData.length > 0) {
                        setSelectedProjectId(projectData[0].id);
                    }
                }
            }
        };
        fetchProjects();
    }, []);

    const fetchBriefsForProject = useCallback(async (projectId: string) => {
        if (!projectId) return;
        setIsFetchingBriefs(true);
        const { data, error } = await supabase
            .from('content_briefs')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        
        if (error) {
            setError(`Failed to fetch briefs: ${error.message}`);
        } else {
            setSavedBriefs((data as unknown as StoredBrief[]) || []);
        }
        setIsFetchingBriefs(false);
    }, []);

    useEffect(() => {
        fetchBriefsForProject(selectedProjectId);
    }, [selectedProjectId, fetchBriefsForProject]);

    const handleGenerate = useCallback(async () => {
        const trimmedKeyword = keyword.trim();
        if (!trimmedKeyword) {
            setError('Please enter a keyword.');
            return;
        }
        if (!selectedProjectId) {
            setError('Please select a project first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setBriefResult(null);

        try {
            const result = await generateContentBrief(trimmedKeyword);
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated.");

            const newBrief = {
                project_id: selectedProjectId,
                user_id: user.id,
                target_keyword: result.target_keyword,
                brief_data: result as unknown as Json,
            };

            const { error: insertError } = await supabase.from('content_briefs').insert([newBrief]);

            if (insertError) {
                throw new Error(`Failed to save brief: ${insertError.message}`);
            }

            setBriefResult(result);
            await fetchBriefsForProject(selectedProjectId); // Refresh list
            setKeyword('');
        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [keyword, selectedProjectId, fetchBriefsForProject]);

    const showSavedBrief = (brief: StoredBrief) => {
      setBriefResult(brief.brief_data as unknown as ContentBrief);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <div className="max-w-5xl mx-auto">
             {briefResult && <BriefDisplay brief={briefResult} />}
            
            <div className="bg-navy-800 p-8 rounded-lg border border-navy-700 shadow-2xl mt-8">
                <div className="text-center">
                    <PencilSquareIcon className="mx-auto h-12 w-12 text-command-blue" />
                    <h2 className="mt-4 text-3xl font-extrabold text-white">God-Mode Content Briefs</h2>
                    <p className="mt-2 text-lg text-gray-400">Select a project and enter a keyword to generate a comprehensive, SEO-optimized content brief.</p>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                     <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="md:col-span-1 bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-command-blue"
                        disabled={isLoading || projects.length === 0}
                    >
                        {projects.length === 0 ? (
                             <option>Create a project first</option>
                        ) : (
                           projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                        )}
                    </select>
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        placeholder="e.g., 'content marketing roi'"
                        className="md:col-span-2 flex-grow bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-command-blue"
                        disabled={isLoading || !selectedProjectId}
                    />
                </div>
                 <div className="mt-4 max-w-3xl mx-auto">
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading || !selectedProjectId || !keyword}
                        className="w-full bg-command-blue hover:bg-command-blue-dark text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'The Architect is working...' : 'Create & Save Brief'}
                    </button>
                 </div>
            </div>

            <div className="mt-8">
                {isLoading && <LoadingSpinner text="The Architect is crafting your blueprint..." />}
                {error && !isLoading && <ErrorDisplay message={error} />}

                <div className="bg-navy-800 border border-navy-700 rounded-lg p-6 mt-8">
                    <h3 className="text-xl font-bold text-white mb-4">Saved Briefs for "{projects.find(p => p.id === selectedProjectId)?.name}"</h3>
                    {isFetchingBriefs ? (
                        <LoadingSpinner text="Fetching briefs..." />
                    ) : savedBriefs.length > 0 ? (
                        <div className="space-y-3">
                            {savedBriefs.map(brief => (
                                <button key={brief.id} onClick={() => showSavedBrief(brief)} className="w-full text-left bg-navy-900/70 p-4 rounded-lg border border-navy-600 flex items-center justify-between hover:border-command-blue transition-colors">
                                    <div>
                                        <p className="font-bold text-white">{brief.target_keyword}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Created: {new Date(brief.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                         <p className="text-gray-400 text-center py-4">No briefs found for this project.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentBriefs;
