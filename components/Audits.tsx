
import React, { useState, useCallback, useEffect } from 'react';
import { performTechnicalAudit } from '../services/geminiService';
import { TechnicalAuditResult, AuditCategory, AuditCheck, AuditStatus, Project } from '../types';
import { DocumentMagnifyingGlassIcon, CheckCircleIconSolid, ExclamationTriangleIconSolid, XCircleIconSolid, ChevronDownIcon } from './icons/Icons';
import { supabase } from '../lib/supabaseClient';
import { Json } from '../types/supabase';

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-command-blue"></div>
        <p className="text-lg text-gray-300">The Inspector is examining the page...</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center">
        <p className="font-bold">Audit Failed</p>
        <p className="text-sm">{message}</p>
    </div>
);

const StatusIcon: React.FC<{ status: AuditStatus }> = ({ status }) => {
    switch (status) {
        case 'PASS':
            return <CheckCircleIconSolid className="w-6 h-6 text-green-400" />;
        case 'WARN':
            return <ExclamationTriangleIconSolid className="w-6 h-6 text-yellow-400" />;
        case 'FAIL':
            return <XCircleIconSolid className="w-6 h-6 text-red-400" />;
        default:
            return null;
    }
};

const AuditCheckCard: React.FC<{ check: AuditCheck }> = ({ check }) => (
    <div className="p-4 bg-navy-900/70 rounded-md border border-navy-600">
        <div className="flex items-start space-x-4">
            <StatusIcon status={check.status} />
            <div>
                <h4 className="font-bold text-white">{check.check_name}</h4>
                <p className="text-gray-400 text-sm mt-1">{check.description}</p>
                <p className="text-light-blue text-sm mt-2">
                    <span className="font-semibold">Recommendation:</span> {check.recommendation}
                </p>
            </div>
        </div>
    </div>
);


const AuditCategoryCard: React.FC<{ category: AuditCategory }> = ({ category }) => {
    const [isOpen, setIsOpen] = useState(true);

    const statusCounts = category.checks.reduce((acc, check) => {
        acc[check.status] = (acc[check.status] || 0) + 1;
        return acc;
    }, {} as Record<AuditStatus, number>);

    return (
        <div className="bg-navy-800 border border-navy-700 rounded-lg overflow-hidden transition-all duration-300 hover:border-command-blue">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left"
            >
                <div className="flex items-center">
                    <h3 className="text-xl font-bold text-white">{category.category_name}</h3>
                    <div className="flex items-center space-x-3 ml-4">
                        {statusCounts.FAIL > 0 && <span className="flex items-center text-xs font-semibold text-red-300 bg-red-500/20 px-2 py-1 rounded-full"><XCircleIconSolid className="w-4 h-4 mr-1" />{statusCounts.FAIL}</span>}
                        {statusCounts.WARN > 0 && <span className="flex items-center text-xs font-semibold text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded-full"><ExclamationTriangleIconSolid className="w-4 h-4 mr-1"/>{statusCounts.WARN}</span>}
                        {statusCounts.PASS > 0 && <span className="flex items-center text-xs font-semibold text-green-300 bg-green-500/20 px-2 py-1 rounded-full"><CheckCircleIconSolid className="w-4 h-4 mr-1"/>{statusCounts.PASS}</span>}
                    </div>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-5 pt-0">
                  <div className="space-y-4">
                      {category.checks.map((check, index) => (
                          <AuditCheckCard key={index} check={check} />
                      ))}
                  </div>
                </div>
            )}
        </div>
    );
};


const Audits: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [auditResult, setAuditResult] = useState<TechnicalAuditResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [auditedUrl, setAuditedUrl] = useState<string>('');

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

    const handleAnalyze = useCallback(async () => {
        const project = projects.find(p => p.id === selectedProjectId);
        if (!project) {
            setError('Please select a valid project.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAuditResult(null);
        setAuditedUrl(project.site_url);

        try {
            const result = await performTechnicalAudit(project.site_url);
            setAuditResult(result);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("User not authenticated.");
            }

            const newAudit = {
                project_id: project.id,
                user_id: user.id,
                full_report: result as unknown as Json,
                status: 'completed'
            };

            const { error: insertError } = await supabase.from('audits').insert([newAudit]);

            if (insertError) {
                console.error("Failed to save audit result:", insertError.message);
                setError(`Audit complete, but failed to save result: ${insertError.message}`);
            }

        } catch (e: unknown) {
            if (e instanceof Error) {
                setError(e.message);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [selectedProjectId, projects]);

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-navy-800 p-8 rounded-lg border border-navy-700 text-center shadow-2xl">
                <DocumentMagnifyingGlassIcon className="mx-auto h-12 w-12 text-command-blue" />
                <h2 className="mt-4 text-3xl font-extrabold text-white">AI-Powered Technical SEO Audit</h2>
                <p className="mt-2 text-lg text-gray-400">Select a project to uncover critical issues and get actionable insights for its main URL.</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                     <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="flex-grow bg-navy-900 border-2 border-navy-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-command-blue transition-all"
                        disabled={isLoading || projects.length === 0}
                    >
                        {projects.length === 0 ? (
                             <option>Create a project first</option>
                        ) : (
                           projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                        )}
                    </select>
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !selectedProjectId}
                        className="bg-command-blue hover:bg-command-blue-dark text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Inspecting...' : 'Start Audit'}
                    </button>
                </div>
            </div>

            <div className="mt-8">
                {isLoading && <LoadingSpinner />}
                {error && !isLoading && <ErrorDisplay message={error} />}
                {auditResult && (
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-white text-center mb-2">Audit Report for: <span className="text-command-blue">{auditedUrl}</span></h3>
                         {auditResult.audit_results.length > 0 ? (
                            auditResult.audit_results.map((category, index) => (
                                <AuditCategoryCard key={index} category={category} />
                            ))
                        ) : (
                            <div className="text-center text-gray-400 p-8 bg-navy-800 rounded-lg">
                                <p>The Inspector couldn't find any specific issues to report based on the provided URL.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Audits;
