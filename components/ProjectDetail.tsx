
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { supabase } from '../lib/supabaseClient';
import { FolderIcon, ChevronDownIcon, ArrowLeftIcon } from './icons/Icons';

interface ProjectDetailProps {
    project: Project;
    onBack: () => void;
}

type FolderKey =
    | 'folder_access_credentials'
    | 'folder_pre_fix_reports'
    | 'folder_fixes_logs'
    | 'folder_post_fix_reports'
    | 'folder_communication_logs'
    | 'folder_final_report';

const FOLDER_CONFIG: { key: FolderKey, title: string, recommendation: string }[] = [
    { 
        key: 'folder_access_credentials', 
        title: '01 - Access & Credentials',
        recommendation: "Like the keys to the castle! Store logins for WordPress, hosting, Google Analytics, or anything else you need to access the client's site."
    },
    { 
        key: 'folder_pre_fix_reports', 
        title: '02 - Pre-Fix Reports',
        recommendation: "Your 'before' photos. Save initial reports from tools like Screaming Frog, PageSpeed Insights, or screenshots of their Google Search Console before you start working."
    },
    { 
        key: 'folder_fixes_logs', 
        title: '03 - Fixes & Implementation Logs',
        recommendation: "Your work diary. Keep a running list of every change you make, big or small, with the date. Example: 'Oct 26: Updated all product page title tags.'"
    },
    { 
        key: 'folder_post_fix_reports', 
        title: '04 - Post-Fix Reports',
        recommendation: "The 'after' photos! Once you've made improvements, save the new speed scores, updated reports, and screenshots showing your awesome results here."
    },
    { 
        key: 'folder_communication_logs', 
        title: '05 - Communication Logs',
        recommendation: "The paper trail. Paste important email exchanges, meeting notes, or screenshots of Slack messages here so you have a record of all communication."
    },
    { 
        key: 'folder_final_report', 
        title: '06 - Final Report & Recommendations',
        recommendation: "The grand finale. This is where you can draft or store the final wrap-up report you'll deliver to the client, outlining all the work done and next steps."
    },
];

const FolderSection: React.FC<{
    folderKey: FolderKey;
    title: string;
    recommendation: string;
    initialContent: string | null;
    projectId: string;
}> = ({ folderKey, title, recommendation, initialContent, projectId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState(initialContent || '');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        setError('');

        const { error: updateError } = await supabase
            .from('projects')
            .update({ [folderKey]: content })
            .eq('id', projectId);
        
        setIsSaving(false);
        if (updateError) {
            setError(updateError.message);
            setSaveStatus('error');
        } else {
            setSaveStatus('success');
        }

        setTimeout(() => setSaveStatus('idle'), 3000);
    };

    return (
        <div className="bg-navy-800 border border-navy-700 rounded-lg overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-navy-700/50"
            >
                <div className="flex items-center">
                    <FolderIcon className="w-6 h-6 text-command-blue" />
                    <h3 className="ml-4 text-lg font-bold text-white">{title}</h3>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-5 pt-0 space-y-2">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Enter details for ${title}...`}
                        className="w-full bg-navy-900 border-2 border-navy-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-command-blue h-48 resize-y"
                    />
                     <p className="text-xs text-gray-500 italic px-1">
                        {recommendation}
                    </p>
                    <div className="flex items-center justify-end gap-4 pt-2">
                         {saveStatus === 'success' && <p className="text-sm text-green-400">Saved successfully!</p>}
                         {saveStatus === 'error' && <p className="text-sm text-red-400">{error}</p>}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-command-blue hover:bg-command-blue-dark text-white font-bold py-2 px-5 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
};


const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack }) => {
    
    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to Projects
                </button>
            </div>

            <div className="bg-navy-800/50 p-6 rounded-lg border border-navy-700 mb-8">
                <h1 className="text-3xl font-extrabold text-white">{project.name}</h1>
                <p className="text-lg text-gray-400 mt-1">{project.site_url}</p>
            </div>
            
            <div className="space-y-4">
                {FOLDER_CONFIG.map(({ key, title, recommendation }) => (
                    <FolderSection
                        key={key}
                        folderKey={key}
                        title={title}
                        recommendation={recommendation}
                        initialContent={project[key]}
                        projectId={project.id}
                    />
                ))}
            </div>
        </div>
    );
};

export default ProjectDetail;
