import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = 'https://wunkxnxysttnkbfogzgo.supabase.co';
// This is a public anonymous key, intended to be used in client-side code.
// The app's security is handled by Supabase Row Level Security (RLS) policies.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bmt4bnh5c3R0bmtiZm9nemdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzODM0MjQsImV4cCI6MjA2OTk1OTQyNH0.t2BuJhyWxAHMAI5aDKSXU90dAoeO6ViUnTbJe03PgY0';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
