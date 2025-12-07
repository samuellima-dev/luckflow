import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yjiohjihoxymyfsyewcy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqaW9oamlob3h5bXlmc3lld2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MDI1MjQsImV4cCI6MjA4MDQ3ODUyNH0.s6qZkF6XD7IzMcnmQvYuQlBG-Z4vkuggUuATHW3WMSs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);