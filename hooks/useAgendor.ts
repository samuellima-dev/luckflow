import { useState, useEffect, useCallback } from 'react';
import { dealService, pipelineService } from '../services/agendorService';
import { contactService } from '../services/agendorService';
import { activityService } from '../services/agendorService';
import { Deal, Contact, Activity, Pipeline } from '../types/agendor';

export const usePipeline = (pipelineId: string) => {
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPipeline = async () => {
      try {
        setLoading(true);
        const data = await pipelineService.getPipelineById(pipelineId);
        setPipeline(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar pipeline');
      } finally {
        setLoading(false);
      }
    };

    if (pipelineId) loadPipeline();
  }, [pipelineId]);

  return { pipeline, loading, error };
};

export const useDeals = (pipelineId: string) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDeals = async () => {
      try {
        setLoading(true);
        const data = await dealService.getDealsByPipeline(pipelineId);
        setDeals(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    if (pipelineId) loadDeals();
  }, [pipelineId]);

  const moveDeal = useCallback(
    async (dealId: string, newStage: string, userId: string) => {
      try {
        await dealService.moveDealToStage(dealId, newStage, userId);
        const updated = await dealService.getDealsByPipeline(pipelineId);
        setDeals(updated || []);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao mover negócio');
        return false;
      }
    },
    [pipelineId]
  );

  const createDeal = useCallback(
    async (dealData: Omit<Deal, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const newDeal = await dealService.createDeal(dealData);
        const updated = await dealService.getDealsByPipeline(pipelineId);
        setDeals(updated || []);
        return newDeal.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar negócio');
        throw err;
      }
    },
    [pipelineId]
  );

  return { deals, loading, error, moveDeal, createDeal };
};

export const useContacts = (companyId: string) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        const data = await contactService.getContactsByCompany(companyId);
        setContacts(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    if (companyId) loadContacts();
  }, [companyId]);

  const createContact = useCallback(
    async (contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const newContact = await contactService.createContact(contactData);
        const updated = await contactService.getContactsByCompany(companyId);
        setContacts(updated || []);
        return newContact.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar contato');
        throw err;
      }
    },
    [companyId]
  );

  return { contacts, loading, error, createContact };
};

export const useActivities = (dealId: string) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        const data = await activityService.getActivitiesByDeal(dealId);
        setActivities(data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    if (dealId) loadActivities();
  }, [dealId]);

  const createActivity = useCallback(
    async (activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        const newActivity = await activityService.createActivity(activityData);
        const updated = await activityService.getActivitiesByDeal(dealId);
        setActivities(updated || []);
        return newActivity.id;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar atividade');
        throw err;
      }
    },
    [dealId]
  );

  return { activities, loading, error, createActivity };
};
