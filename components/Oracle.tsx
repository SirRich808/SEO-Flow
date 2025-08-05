
import React, { useState, useCallback, useEffect } from 'react';
import { runSerpSimulation } from '../services/geminiService';
import { SerpSimulationResult, Project, StoredSimulation } from '../types';
import { SparklesIcon, LightBulbIcon, CheckCircleIcon, ExclamationTriangleIconSolid, ArrowUpIcon, ArrowDownIcon } from './icons/Icons';
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

const ResultDisplay: React.FC<{ result: SerpSimulationResult, keyword: string }> = ({ result, keyword }) => (
    <div className="bg-navy-800 border border-navy-700 rounded-lg p-8 space-y-8 mt-8">
        <div>
            <h2 className="text-2xl font-bold text-white">Oracle Simulation: <span className="text-command-blue">{keyword}</span></h2>
        </div>

        <div className="text-center bg-navy-900/50 p-6 rounded-lg border border-navy-600">
            <p className="text-lg text-gray-400">Predicted Rank</p>
            <p className="text-5xl font-extrabold text-light-blue mt-2">{result.predicted_rank}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-green-400 flex items-center">
                    <ArrowUpIcon /> <span className="ml-2">Strengths</span>
                </h3>
                <ul className="list-none space-y-2">
                    {result.strengths.map((item, i) => (
                        <li key={i} className="flex items-start">
                            <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-gray-300">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
             <div className="space-y-3">
                <h3 className="text-lg font-semibold text-yellow-400 flex items-center">
                    <ArrowDownIcon /> <span className="ml-2">Weaknesses</span>
                </h3>
                <ul className="list-none space-y-2">
                    {result.weaknesses.map((item, i) => (
                        <li key={i} className="flex items-start">
                            <ExclamationTriangleIconSolid className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-gray-300">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>

        <div className="border-t border-navy-700 pt-6">
            <h3 className="text-lg font-semibold text-light-blue flex items-center"><LightBulbIcon /> <span className="ml-2">Actionable Recommendations</span></h3>
            <ul className="mt-4 space-y-3 list-none">
                 {result.recommendations.map((item, i) => (
                    <li key={i} className="p-3 bg-navy-900/70 rounded-md border border-navy-600 text-gray-300">{item}</li>
                ))}
            </ul>
        </div>
    </div>
);


const Oracle: React.FC = () => {
    const [keyword, setKeyword] = useState('');
    const [draftContent, setDraftContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<SerpSimulationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const [projects, setProjects] = useState<Pick<Project, 'id' | 'name'>[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [savedSimulations, setSavedSimulations] = useState<StoredSimulation[]>([]);
    const [isFetchingSimulations, setIsFetchingSimulations] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error } = await supabase
                    .from('projects')
                    .select('id, name')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    setError('Failed to fetch projects.');
                } else if (data) {
                    const projectData = (data as unknown as Pick<Project, 'id' | 'name'>[]) || [];
                    setProjects(projectData);
                    if (projectData.length > 0) {
                        setSelectedProjectId(projectData[0].id);
                    }
                }
            }
        };
        fetchProjects();
    }, []);

    const fetchSimulationsForProject = useCallback(async (projectId: string) => {
        if (!projectId) return;
        setIsFetchingSimulations(true);
        const { data, error } = await supabase
            .from('serp_simulations')
            .select('*, projects ( name )')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        
        if (error) {
            setError(`Failed to fetch simulations: ${error.message}`);
        } else {
            setSavedSimulations((data as unknown as StoredSimulation[]) || []);
        }
        setIsFetchingSimulations(false);
    }, []);

    useEffect(() => {
        fetchSimulationsForProject(selectedProjectId);
    }, [selectedProjectId, fetchSimulationsForProject]);

    const handleAnalyze = useCallback(async () => {
        const trimmedKeyword = keyword.trim();
        const trimmedContent = draftContent.trim();

        if (!trimmedKeyword || !trimmedContent) {
            setError('Keyword and draft content are required.');
            return;
        }
        if (!selectedProjectId) {
            setError('Please select a project first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const result = await runSerpSimulation(trimmedKeyword, trimmedContent);
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated.");

            const newSimulation = {
                project_id: selectedProjectId,
                user_id: user.id,
                target_keyword: trimmedKeyword,
                input_draft_content: trimmedContent,
                simulation_report: result as unknown as Json,
            };

            const { error: insertError } = await supabase.from('serp_simulations').insert([newSimulation]);

            if (insertError) {
                throw new Error(`Failed to save simulation: ${insertError.message}`);
            }

            setAnalysisResult(result);
            await fetchSimulationsForProject(selectedProjectId); // Refresh list
        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [keyword, draftContent, selectedProjectId, fetchSimulationsForProject]);
    
    const showSavedSimulation = (sim: StoredSimulation) => {
      setKeyword(sim.target_keyword);
      setDraftContent(sim.input_draft_content);
      setAnalysisResult(sim.simulation_report as unknown as SerpSimulationResult);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return (
        <div className="max-w-6xl mx-auto">
             {analysisResult && <ResultDisplay result={analysisResult} keyword={keyword} />}

            <div className="bg-navy-800 p-8 rounded-lg border border-navy-700 text-center shadow-2xl mt-8">
                <SparklesIcon className="mx-auto h-12 w-12 text-yellow-400" />
                <h2 className="mt-4 text-3xl font-extrabold text-white">The Oracle: Predictive SERP Simulator</h2>
                <p className="mt-2 text-lg text-gray-400">Don't just publish and pray. See the future. Predict your rank and get the exact changes needed to win.</p>
                <div className="mt-6 flex flex-col gap-4 max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                            placeholder="Target Keyword"
                            className="md:col-span-2 flex-grow bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-command-blue"
                            disabled={isLoading}
                        />
                    </div>
                    <textarea
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        placeholder="Paste your draft article content here..."
                        className="w-full bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-command-blue h-60 resize-y"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !selectedProjectId || !keyword || !draftContent}
                        className="bg-command-blue hover:bg-command-blue-dark text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Consulting The Oracle...' : 'Predict My Rank'}
                    </button>
                </div>
            </div>

            <div className="mt-8">
                {isLoading && <LoadingSpinner text="The Oracle is consulting the digital ether..." />}
                {error && !isLoading && <ErrorDisplay message={error} />}
                 <div className="bg-navy-800 border border-navy-700 rounded-lg p-6 mt-8">
                    <h3 className="text-xl font-bold text-white mb-4">Past Simulations for "{projects.find(p => p.id === selectedProjectId)?.name}"</h3>
                    {isFetchingSimulations ? (
                        <LoadingSpinner text="Fetching simulations..." />
                    ) : savedSimulations.length > 0 ? (
                        <div className="space-y-3">
                            {savedSimulations.map(sim => (
                                <button key={sim.id} onClick={() => showSavedSimulation(sim)} className="w-full text-left bg-navy-900/70 p-4 rounded-lg border border-navy-600 flex items-center justify-between hover:border-command-blue transition-colors">
                                    <div>
                                        <p className="font-bold text-white">{sim.target_keyword}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Created: {new Date(sim.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className="font-semibold text-light-blue">Rank: {(sim.simulation_report as unknown as SerpSimulationResult).predicted_rank}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                         <p className="text-gray-400 text-center py-4">No simulations found for this project.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Oracle;
