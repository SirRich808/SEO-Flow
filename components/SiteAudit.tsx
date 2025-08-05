
import React, { useState, useCallback, useEffect } from 'react';
import { performFullSiteAudit } from '../services/geminiService';
import { SiteAuditResult, AuditFinding, FindingSeverity, Project } from '../types';
import { GlobeMagnifyingGlassIcon, ChevronDownIcon } from './icons/Icons';
import { supabase } from '../lib/supabaseClient';
import { Json } from '../types/supabase';

const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-command-blue"></div>
        <p className="text-lg text-gray-300">The Oracle is auditing the entire site...</p>
        <p className="text-sm text-gray-500">(This may take a moment)</p>
    </div>
);

const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
    <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center">
        <p className="font-bold">Audit Failed</p>
        <p className="text-sm">{message}</p>
    </div>
);

const severityConfig: Record<FindingSeverity, {
    label: string;
    base: string;
    text: string;
    ring: string;
}> = {
    Critical: { label: 'Critical', base: 'bg-red-500/20', text: 'text-red-300', ring: 'ring-red-500/30' },
    High: { label: 'High', base: 'bg-orange-500/20', text: 'text-orange-300', ring: 'ring-orange-500/30' },
    Medium: { label: 'Medium', base: 'bg-yellow-500/20', text: 'text-yellow-300', ring: 'ring-yellow-500/30' },
    Low: { label: 'Low', base: 'bg-blue-500/20', text: 'text-blue-300', ring: 'ring-blue-500/30' },
    Opportunity: { label: 'Opportunity', base: 'bg-green-500/20', text: 'text-green-300', ring: 'ring-green-500/30' },
};

const FindingCard: React.FC<{ finding: AuditFinding }> = ({ finding }) => {
    const [isOpen, setIsOpen] = useState(finding.severity === 'Critical' || finding.severity === 'High');
    const config = severityConfig[finding.severity] || severityConfig.Low;

    return (
        <div className={`bg-navy-800 border border-navy-700 rounded-lg overflow-hidden transition-all duration-300 hover:border-command-blue ring-2 ring-transparent hover:ring-command-blue/50`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                         <span className={`px-3 py-1 text-xs font-bold rounded-full ${config.base} ${config.text}`}>
                            {config.label.toUpperCase()}
                        </span>
                        <h3 className="text-md font-bold text-white truncate">{finding.title}</h3>
                    </div>
                     <p className="text-sm text-gray-400 mt-1 pl-4 border-l-2 border-navy-600 ml-1.5">{finding.category}</p>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ml-4`} />
            </button>
            {isOpen && (
                <div className="px-5 pb-5 pt-2 space-y-4">
                    <div>
                        <h4 className="font-semibold text-light-blue text-sm">Description</h4>
                        <p className="text-gray-300 text-sm mt-1">{finding.description}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-light-blue text-sm">Business Impact</h4>
                        <p className="text-gray-300 text-sm mt-1">{finding.business_impact}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-light-blue text-sm">Recommended Action</h4>
                        <p className="text-gray-300 text-sm mt-1">{finding.recommended_action}</p>
                    </div>
                    {finding.affected_urls && finding.affected_urls.length > 0 && (
                         <div>
                            <h4 className="font-semibold text-light-blue text-sm">Affected URLs (Examples)</h4>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                                {finding.affected_urls.slice(0, 5).map((url, i) => (
                                    <li key={i} className="text-gray-400 text-xs truncate">{url}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const SiteAudit: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [auditResult, setAuditResult] = useState<SiteAuditResult | null>(null);
    const [error, setError] = useState<string | null>(null);

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

        try {
            const result = await performFullSiteAudit(project.site_url);
            setAuditResult(result);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error("User not authenticated.");
            }

            const newAudit = {
                project_id: project.id,
                user_id: user.id,
                full_report: result as unknown as Json,
                overall_health_score: result.audit_summary.overall_health_score,
                executive_summary: result.audit_summary.executive_summary,
                status: 'completed',
            };

            const { error: insertError } = await supabase.from('audits').insert([newAudit]);

            if (insertError) {
                // Non-blocking error, we can still show the result
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

    const scoreColor = (score: number) => {
        if (score >= 90) return 'text-green-400';
        if (score >= 70) return 'text-yellow-400';
        if (score >= 50) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="bg-navy-800 p-8 rounded-lg border border-navy-700 text-center shadow-2xl">
                <GlobeMagnifyingGlassIcon className="mx-auto h-12 w-12 text-command-blue" />
                <h2 className="mt-4 text-3xl font-extrabold text-white">Full Site Audit</h2>
                <p className="mt-2 text-lg text-gray-400">Get a comprehensive, strategic SEO report for your entire website from the AI Oracle.</p>
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
                        {isLoading ? 'Auditing...' : 'Start Full Audit'}
                    </button>
                </div>
            </div>

            <div className="mt-8">
                {isLoading && <LoadingSpinner />}
                {error && !isLoading && <ErrorDisplay message={error} />}
                {auditResult && (
                    <div className="space-y-8">
                        {/* Summary Card */}
                        <div className="bg-navy-800 p-6 rounded-lg border border-navy-700 flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-shrink-0">
                                 <div className={`text-6xl font-bold ${scoreColor(auditResult.audit_summary.overall_health_score)}`}>
                                    {auditResult.audit_summary.overall_health_score}
                                     <span className="text-3xl text-gray-400">/100</span>
                                 </div>
                                 <div className="text-center text-gray-300 font-semibold">Overall Health</div>
                            </div>
                            <div className="border-l-0 md:border-l-2 border-t-2 md:border-t-0 border-navy-600 pl-0 md:pl-6 pt-6 md:pt-0 w-full">
                                <h3 className="text-xl font-bold text-white">Executive Summary</h3>
                                <p className="mt-2 text-gray-300">{auditResult.audit_summary.executive_summary}</p>
                            </div>
                        </div>
                        
                        {/* Findings */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-white text-center">Audit Findings</h3>
                            {auditResult.findings.length > 0 ? (
                                auditResult.findings.map((finding) => (
                                    <FindingCard key={finding.issue_id} finding={finding} />
                                ))
                            ) : (
                                <div className="text-center text-gray-400 p-8 bg-navy-800 rounded-lg">
                                    <p>The Oracle found no major issues to report for this site.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SiteAudit;