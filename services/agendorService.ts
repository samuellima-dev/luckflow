import { supabase } from '../supabaseClient';
import { Contact, Deal, Activity, Pipeline, Interaction, Company } from '../types/agendor';

// ========== CONTACTS ==========
export const contactService = {
  async createContact(data: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) {
    const { data: result, error } = await supabase
      .from('contacts')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async getContactsByCompany(companyId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async updateContact(id: string, updates: Partial<Contact>) {
    const { data, error } = await supabase
      .from('contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteContact(id: string) {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) throw error;
  },

  async searchContacts(companyId: string, searchTerm: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', companyId)
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    if (error) throw error;
    return data;
  },
};

// ========== DEALS ==========
export const dealService = {
  async createDeal(data: Omit<Deal, 'id' | 'created_at' | 'updated_at'>) {
    const { data: result, error } = await supabase
      .from('deals')
      .insert([{
        ...data,
        stage_history: [{ stage: data.stage, changed_at: new Date().toISOString(), changed_by: data.created_by }]
      }])
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async getDealsByPipeline(pipelineId: string) {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getDealsByStage(pipelineId: string, stage: string) {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .eq('stage', stage)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async moveDealToStage(dealId: string, newStage: string, userId: string) {
    const { data: deal } = await supabase
      .from('deals')
      .select('stage_history')
      .eq('id', dealId)
      .single();

    const newHistory = [
      ...(deal?.stage_history || []),
      { stage: newStage, changed_at: new Date().toISOString(), changed_by: userId }
    ];

    const { data, error } = await supabase
      .from('deals')
      .update({
        stage: newStage,
        stage_history: newHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', dealId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async closeDealAsWon(dealId: string) {
    const { data, error } = await supabase
      .from('deals')
      .update({
        status: 'won',
        closed_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', dealId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async closeDealAsLost(dealId: string, lossReason: string) {
    const { data, error } = await supabase
      .from('deals')
      .update({
        status: 'lost',
        loss_reason: lossReason,
        closed_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', dealId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateDeal(id: string, updates: Partial<Deal>) {
    const { data, error } = await supabase
      .from('deals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteDeal(id: string) {
    const { error } = await supabase.from('deals').delete().eq('id', id);
    if (error) throw error;
  },

  async getDealsByAssignee(userId: string) {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('assigned_to', userId)
      .eq('status', 'open')
      .order('expected_close_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getDealMetrics(pipelineId: string) {
    const { data, error } = await supabase
      .from('deals')
      .select('value, status')
      .eq('pipeline_id', pipelineId);
    if (error) throw error;

    const totalValue = data?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0;
    const openDeals = data?.filter(d => d.status === 'open').length || 0;
    const wonDeals = data?.filter(d => d.status === 'won').length || 0;
    const lostDeals = data?.filter(d => d.status === 'lost').length || 0;

    return {
      totalValue,
      openDeals,
      wonDeals,
      lostDeals,
      averageValue: data?.length ? totalValue / data.length : 0,
    };
  },
};

// ========== ACTIVITIES ==========
export const activityService = {
  async createActivity(data: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) {
    const { data: result, error } = await supabase
      .from('activities')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async getActivitiesByDeal(dealId: string) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getPendingActivitiesByUser(userId: string) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('assigned_to', userId)
      .eq('status', 'pending')
      .order('scheduled_for', { ascending: true });
    if (error) throw error;
    return data;
  },

  async completeActivity(id: string) {
    const { data, error } = await supabase
      .from('activities')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateActivity(id: string, updates: Partial<Activity>) {
    const { data, error } = await supabase
      .from('activities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteActivity(id: string) {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw error;
  },
};

// ========== INTERACTIONS ==========
export const interactionService = {
  async recordInteraction(data: Omit<Interaction, 'id' | 'created_at' | 'updated_at'>) {
    const { data: result, error } = await supabase
      .from('interactions')
      .insert([data])
      .select()
      .single();
    if (error) throw error;

    // Atualizar last_interaction_date do contato
    if (data.contact_id) {
      await supabase
        .from('contacts')
        .update({ last_interaction_date: new Date().toISOString() })
        .eq('id', data.contact_id);
    }

    return result;
  },

  async getInteractionsByContact(contactId: string) {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getInteractionsByDeal(dealId: string) {
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('deal_id', dealId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },
};

// ========== PIPELINES ==========
export const pipelineService = {
  async createPipeline(data: Omit<Pipeline, 'id' | 'created_at' | 'updated_at'>) {
    const { data: result, error } = await supabase
      .from('pipelines')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async getPipelinesByCompany(companyId: string) {
    const { data, error } = await supabase
      .from('pipelines')
      .select('*')
      .eq('company_id', companyId);
    if (error) throw error;
    return data;
  },

  async getPipelineById(id: string) {
    const { data, error } = await supabase
      .from('pipelines')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async updatePipeline(id: string, updates: Partial<Pipeline>) {
    const { data, error } = await supabase
      .from('pipelines')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deletePipeline(id: string) {
    const { error } = await supabase.from('pipelines').delete().eq('id', id);
    if (error) throw error;
  },
};

// ========== COMPANIES ==========
export const companyService = {
  async createCompany(data: Omit<Company, 'id' | 'created_at' | 'updated_at'>) {
    const { data: result, error } = await supabase
      .from('companies')
      .insert([data])
      .select()
      .single();
    if (error) throw error;
    return result;
  },

  async getCompanies() {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) throw error;
    return data;
  },

  async updateCompany(id: string, updates: Partial<Company>) {
    const { data, error } = await supabase
      .from('companies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCompany(id: string) {
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw error;
  },
};
