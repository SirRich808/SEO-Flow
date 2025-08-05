
import React, { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, LinkIcon, CheckCircleIcon, ChartBarIcon, PencilSquareIcon, DocumentMagnifyingGlassIcon, SparklesIcon, MegaphoneIcon } from './icons/Icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabaseClient';
import { Project, RecentBrief, StoredAudit, StoredSimulation, SerpSimulationResult, RecentProspect } from '../types';

const kpiData = [
    { title: 'Organic Traffic', value: '12,483', change: '+12.5%', icon: <ChartBarIcon />, positive: true },
    { title: 'Keyword Rankings', value: '84', change: '+3', icon: <ArrowUpIcon />, positive: true },
    { title: 'Site Health Score', value: '96%', change: '-1%', icon: <CheckCircleIcon />, positive: false },
    { title: 'New Backlinks', value: '22', change: '+5', icon: <LinkIcon />, positive: true }
];

const chartData = [
  { name: 'Jan', traffic: 4000 },
  { name: 'Feb', traffic: 3000 },
  { name: 'Mar', traffic: 5000 },
  { name: 'Apr', traffic: 4500 },
  { name: 'May', traffic: 6000 },
  { name: 'Jun', traffic: 5800 },
  { name: 'Jul', traffic: 7200 },
];

const getAuditInfo = (audit: StoredAudit) => {
    const report = audit.full_report as any;
    if (report?.audit_summary) { // Full Site Audit
        return {
            type: 'Full Site Audit',
            title: report.audit_summary.executive_summary || `Audit for ${audit.projects?.name}`,
            score: report.audit_summary.overall_health_score
        };
    }
    if (report?.audit_results) { // Technical Audit
        return {
            type: 'Technical Audit',
            title: `Technical audit for ${audit.projects?.site_url}`,
            score: null
        };
    }
    return { type: 'Audit', title: `Audit for ${audit.projects?.name}`, score: null };
};

const Dashboard: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [projectsError, setProjectsError] = useState<string | null>(null);

    const [recentBriefs, setRecentBriefs] = useState<RecentBrief[]>([]);
    const [loadingBriefs, setLoadingBriefs] = useState(true);
    const [briefsError, setBriefsError] = useState<string | null>(null);

    const [recentAudits, setRecentAudits] = useState<StoredAudit[]>([]);
    const [loadingAudits, setLoadingAudits] = useState(true);
    const [auditsError, setAuditsError] = useState<string | null>(null);

    const [recentSimulations, setRecentSimulations] = useState<StoredSimulation[]>([]);
    const [loadingSimulations, setLoadingSimulations] = useState(true);
    const [simulationsError, setSimulationsError] = useState<string | null>(null);
    
    const [recentProspects, setRecentProspects] = useState<RecentProspect[]>([]);
    const [loadingProspects, setLoadingProspects] = useState(true);
    const [prospectsError, setProspectsError] = useState<string | null>(null);


    useEffect(() => {
        const fetchProjects = async () => {
            setLoadingProjects(true);
            setProjectsError(null);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error: fetchError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (fetchError) {
                    console.error('Error fetching projects:', fetchError.message);
                    setProjectsError(fetchError.message);
                } else {
                    setProjects((data as unknown as Project[]) || []);
                }
            }
            setLoadingProjects(false);
        };

        const fetchRecentBriefs = async () => {
            setLoadingBriefs(true);
            setBriefsError(null);
             const { data: { user } } = await supabase.auth.getUser();
             if(user) {
                const { data, error: fetchError } = await supabase
                    .from('content_briefs')
                    .select(`*, projects ( name )`)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3);

                if(fetchError){
                    console.error('Error fetching recent briefs:', fetchError.message);
                    setBriefsError(fetchError.message);
                } else {
                    setRecentBriefs((data as unknown as RecentBrief[]) || []);
                }
             }
            setLoadingBriefs(false);
        };

        const fetchRecentAudits = async () => {
            setLoadingAudits(true);
            setAuditsError(null);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error: fetchError } = await supabase
                    .from('audits')
                    .select('*, projects (name, site_url)')
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (fetchError) {
                    console.error('Error fetching recent audits:', fetchError.message);
                    setAuditsError(fetchError.message);
                } else {
                    setRecentAudits((data as unknown as StoredAudit[]) || []);
                }
            }
            setLoadingAudits(false);
        };

        const fetchRecentSimulations = async () => {
            setLoadingSimulations(true);
            setSimulationsError(null);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error: fetchError } = await supabase
                    .from('serp_simulations')
                    .select('*, projects (name)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3);
        
                if (fetchError) {
                    console.error('Error fetching recent simulations:', fetchError.message);
                    setSimulationsError(fetchError.message);
                } else {
                    setRecentSimulations((data as unknown as StoredSimulation[]) || []);
                }
            }
            setLoadingSimulations(false);
        };

        const fetchRecentProspects = async () => {
            setLoadingProspects(true);
            setProspectsError(null);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data, error: fetchError } = await supabase
                    .from('outreach_prospects')
                    .select('*, projects ( name )')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (fetchError) {
                    console.error('Error fetching recent prospects:', fetchError.message);
                    setProspectsError(fetchError.message);
                } else {
                    setRecentProspects((data as unknown as RecentProspect[]) || []);
                }
            }
            setLoadingProspects(false);
        };

        fetchProjects();
        fetchRecentBriefs();
        fetchRecentAudits();
        fetchRecentSimulations();
        fetchRecentProspects();
    }, []);
    
    const scoreColor = (score: number | null) => {
        if (score === null) return 'text-gray-400';
        if (score >= 90) return 'text-green-400';
        if (score >= 70) return 'text-yellow-400';
        if (score >= 50) return 'text-orange-400';
        return 'text-red-400';
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'Link Acquired': return 'bg-green-500/30 text-green-300';
            case 'Contacted': return 'bg-blue-500/30 text-blue-300';
            case 'Replied': return 'bg-purple-500/30 text-purple-300';
            default: return 'bg-navy-600 text-gray-300';
        }
    };

    return (
        <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiData.map(kpi => (
                    <div key={kpi.title} className="bg-navy-800 p-6 rounded-lg border border-navy-700 transition-all hover:border-command-blue hover:shadow-lg">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-400">{kpi.title}</p>
                            <span className="text-gray-500">{kpi.icon}</span>
                        </div>
                        <p className="text-4xl font-bold text-white mt-2">{kpi.value}</p>
                        <p className={`text-sm flex items-center mt-1 ${kpi.positive ? 'text-green-400' : 'text-red-400'}`}>
                            {kpi.positive ? <ArrowUpIcon /> : <ArrowDownIcon />}
                            <span className="ml-1">{kpi.change} vs last month</span>
                        </p>
                    </div>
                ))}
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Audits */}
                <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Audits</h3>
                    <div className="space-y-4">
                        {loadingAudits ? (
                             <p className="text-gray-400">Loading audits...</p>
                        ) : auditsError ? (
                             <p className="text-sm text-red-400 text-center py-4">{auditsError}</p>
                        ) : recentAudits.length > 0 ? (
                            recentAudits.map(audit => {
                                const { type, title, score } = getAuditInfo(audit);
                                return (
                                <div key={audit.id} className="flex items-center justify-between p-3 bg-navy-900/50 rounded-md border border-navy-700">
                                    <div className="flex items-center min-w-0">
                                        <DocumentMagnifyingGlassIcon className="w-5 h-5 text-command-blue flex-shrink-0" />
                                        <div className="ml-3 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{type}</p>
                                            <p className="text-xs text-gray-400 truncate">{title}</p>
                                        </div>
                                    </div>
                                    {score !== null && (
                                         <span className={`text-lg font-bold flex-shrink-0 ml-4 ${scoreColor(score)}`}>
                                            {score}
                                         </span>
                                    )}
                                </div>
                                );
                            })
                        ) : (
                             <p className="text-gray-400 text-center py-4">No audits performed yet.</p>
                        )}
                    </div>
                </div>

                {/* Recent Content Briefs */}
                <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Content Briefs</h3>
                    <div className="space-y-4">
                        {loadingBriefs ? (
                            <p className="text-gray-400">Loading briefs...</p>
                        ) : briefsError ? (
                            <p className="text-sm text-red-400 text-center py-4">{briefsError}</p>
                        ) : recentBriefs.length > 0 ? (
                            recentBriefs.map(brief => (
                                <div key={brief.id} className="flex items-center justify-between p-3 bg-navy-900/50 rounded-md border border-navy-700">
                                    <div className="flex items-center min-w-0">
                                        <PencilSquareIcon className="w-5 h-5 text-command-blue flex-shrink-0" />
                                        <div className="ml-3 min-w-0">
                                            <p className="text-md font-bold text-white truncate">{brief.target_keyword}</p>
                                            <p className="text-sm text-gray-400 truncate">
                                                For project: <span className="font-semibold">{brief.projects?.name || 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 flex-shrink-0 ml-4">
                                        {new Date(brief.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-center py-4">No content briefs created yet.</p>
                        )}
                    </div>
                </div>

                 {/* Recent SERP Simulations */}
                <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
                    <h3 className="text-xl font-bold text-white mb-4">Recent SERP Simulations</h3>
                    <div className="space-y-4">
                        {loadingSimulations ? (
                             <p className="text-gray-400">Loading simulations...</p>
                        ) : simulationsError ? (
                             <p className="text-sm text-red-400 text-center py-4">{simulationsError}</p>
                        ) : recentSimulations.length > 0 ? (
                            recentSimulations.map(sim => {
                                const report = sim.simulation_report as unknown as SerpSimulationResult;
                                return (
                                <div key={sim.id} className="flex items-center justify-between p-3 bg-navy-900/50 rounded-md border border-navy-700">
                                    <div className="flex items-center min-w-0">
                                        <SparklesIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                                        <div className="ml-3 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{sim.target_keyword}</p>
                                            <p className="text-xs text-gray-400 truncate">
                                                 For project: <span className="font-semibold">{sim.projects?.name || 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold flex-shrink-0 ml-4 text-light-blue`}>
                                        Rank: {report.predicted_rank}
                                    </span>
                                </div>
                                );
                            })
                        ) : (
                             <p className="text-gray-400 text-center py-4">No simulations run yet.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Outreach Prospects */}
                <div className="lg:col-span-2 bg-navy-800 p-6 rounded-lg border border-navy-700">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Outreach Prospects</h3>
                     <div className="space-y-4">
                        {loadingProspects ? (
                             <p className="text-gray-400">Loading prospects...</p>
                        ) : prospectsError ? (
                             <p className="text-sm text-red-400 text-center py-4">{prospectsError}</p>
                        ) : recentProspects.length > 0 ? (
                            recentProspects.map(prospect => (
                                <div key={prospect.id} className="flex items-center justify-between p-3 bg-navy-900/50 rounded-md border border-navy-700">
                                    <div className="flex items-center min-w-0">
                                        <MegaphoneIcon />
                                        <div className="ml-3 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{prospect.name}</p>
                                            <p className="text-xs text-gray-400 truncate">
                                                For project: <span className="font-semibold">{prospect.projects?.name || 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold flex-shrink-0 ml-4 px-2 py-1 rounded-full ${statusColor(prospect.status)}`}>
                                        {prospect.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                             <p className="text-gray-400 text-center py-4">No outreach prospects added yet.</p>
                        )}
                    </div>
                </div>
                
                 {/* Active Projects */}
                <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
                    <h3 className="text-xl font-bold text-white mb-4">Active Projects</h3>
                    <div className="space-y-4">
                        {loadingProjects ? (
                            <p className="text-gray-400">Loading projects...</p>
                        ) : projectsError ? (
                            <p className="text-sm text-red-400 text-center py-4">{projectsError}</p>
                        ) : projects.length > 0 ? (
                            projects.map(project => (
                                 <div key={project.id} className="flex flex-col p-3 bg-navy-900/50 rounded-md border border-navy-700">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-white truncate">{project.name}</span>
                                    </div>
                                    <p className="text-sm text-gray-400 truncate">{project.site_url}</p>
                                </div>
                            ))
                        ) : (
                           <p className="text-gray-400 text-center py-4">No projects yet. Create one in the 'Projects' tab!</p>
                        )}
                    </div>
                </div>
            </div>


            {/* Traffic Chart */}
            <div className="bg-navy-800 p-6 rounded-lg border border-navy-700">
                <h3 className="text-xl font-bold text-white mb-4">Organic Traffic Overview</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
                            <Legend />
                            <Line type="monotone" dataKey="traffic" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
