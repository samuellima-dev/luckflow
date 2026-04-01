export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  industry?: string;
  size?: 'pequena' | 'media' | 'grande';
  website?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  position?: string;
  department?: string;
  company_id: string;
  origin?: string;
  segment?: string;
  tags?: string[];
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_interaction_date?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  created_by: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface StageHistoryEntry {
  stage: string;
  changed_at: string;
  changed_by: string;
}

export interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  currency: 'BRL' | 'USD';
  contact_id: string;
  company_id: string;
  pipeline_id: string;
  stage: string;
  assigned_to: string;
  expected_close_date?: string;
  closed_date?: string;
  status: 'open' | 'won' | 'lost';
  loss_reason?: string;
  probability?: number;
  tags?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  stage_history: StageHistoryEntry[];
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'proposal' | 'note';
  title: string;
  description?: string;
  deal_id: string;
  contact_id?: string;
  assigned_to: string;
  scheduled_for?: string;
  completed_at?: string;
  status: 'pending' | 'completed' | 'cancelled';
  outcome?: string;
  attachments?: any[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'message' | 'note';
  contact_id: string;
  deal_id?: string;
  content: string;
  date: string;
  recorded_by: string;
  duration?: number;
  attachments?: string[];
  created_at: string;
  updated_at: string;
}
