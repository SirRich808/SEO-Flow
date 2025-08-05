
import { Session as SupabaseSession } from '@supabase/supabase-js';
import { Database } from './types/supabase';

export type Session = SupabaseSession;
export type Project = Database['public']['Tables']['projects']['Row'];
export type StoredBrief = Database['public']['Tables']['content_briefs']['Row'];
export type RecentBrief = StoredBrief & { projects: { name: string } | null };
export type StoredAudit = Database['public']['Tables']['audits']['Row'] & { projects: { name: string, site_url: string } | null };
export type StoredSimulation = Database['public']['Tables']['serp_simulations']['Row'] & { projects: { name: string } | null };
export type OutreachProspect = Database['public']['Tables']['outreach_prospects']['Row'];
export type RecentProspect = OutreachProspect & { projects: { name: string } | null };


export enum View {
  DASHBOARD = 'DASHBOARD',
  PROJECTS = 'PROJECTS',
  PROJECT_DETAIL = 'PROJECT_DETAIL',
  ORACLE = 'ORACLE',
  AUDITS = 'AUDITS',
  CONTENT_BRIEFS = 'CONTENT_BRIEFS',
  OUTREACH = 'OUTREACH',
  SITE_AUDIT = 'SITE_AUDIT',
}

// Types for The Oracle (SERP Simulator)
export interface SerpSimulationResult {
  predicted_rank: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

// Types for Technical Audit
export type AuditStatus = 'PASS' | 'FAIL' | 'WARN';

export interface AuditCheck {
  check_name: string;
  status: AuditStatus;
  description: string;
  recommendation: string;
}

export interface AuditCategory {
  category_name: string;
  checks: AuditCheck[];
}

export interface TechnicalAuditResult {
  audit_results: AuditCategory[];
}

// Types for Full Site Audit
export type FindingSeverity = 'Low' | 'Medium' | 'High' | 'Critical' | 'Opportunity';

export interface AuditFinding {
  issue_id: string;
  category: string;
  title: string;
  severity: FindingSeverity;
  description: string;
  business_impact: string;
  affected_urls: string[];
  recommended_action: string;
}

export interface AuditSummary {
  site_url: string;
  overall_health_score: number;
  executive_summary: string;
}

export interface SiteAuditResult {
  audit_summary: AuditSummary;
  findings: AuditFinding[];
}

// Types for Content Briefs
export interface ArticleStructure {
  h2: string;
  h3s: string[];
}

export interface ContentBrief {
  target_keyword: string;
  user_intent: string;
  recommended_structure: ArticleStructure[];
  key_entities: string[];
  people_also_ask: string[];
}
