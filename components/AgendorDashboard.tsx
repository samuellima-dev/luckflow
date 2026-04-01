import React from 'react';
import { useDeals } from '../hooks/useAgendor';
import { DollarSign, ArrowRight, Loader2, AlertCircle, TrendingUp } from 'lucide-react';

interface AgendorDashboardProps {
  pipelineId: string;
  userId: string;
}

export const AgendorDashboard: React.FC<AgendorDashboardProps> = ({ pipelineId, userId }) => {
  const { deals, loading, error, moveDeal } = useDeals(pipelineId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-nexus-accent" />
        <p className="text-nexus-muted font-medium">Carregando pipeline de vendas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 text-red-500">
        <AlertCircle className="w-8 h-8" />
        <p className="font-medium">Erro ao carregar dados: {error}</p>
      </div>
    );
  }

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-nexus-card border border-nexus-border p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-nexus-muted text-sm font-medium">Total em Negociações</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-nexus-text">
            R$ {(totalValue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-nexus-card border border-nexus-border p-4 rounded-xl">
          <span className="text-nexus-muted text-sm font-medium block mb-2">Negócios Ativos</span>
          <div className="text-2xl font-bold text-nexus-text">{deals.length}</div>
        </div>
        <div className="bg-nexus-card border border-nexus-border p-4 rounded-xl">
          <span className="text-nexus-muted text-sm font-medium block mb-2">Ticket Médio</span>
          <div className="text-2xl font-bold text-nexus-text">
            R$ {(deals.length > 0 ? totalValue / deals.length / 100 : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Deals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.map((deal) => (
          <div 
            key={deal.id} 
            className="bg-nexus-card border border-nexus-border p-5 rounded-xl hover:border-nexus-accent transition-colors group"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-nexus-text group-hover:text-nexus-accent transition-colors">
                {deal.title}
              </h3>
              <div className="bg-nexus-accent/10 text-nexus-accent p-1.5 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-nexus-muted text-sm">Valor:</span>
                <span className="font-mono font-medium text-nexus-text">
                  R$ {(deal.value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-nexus-muted text-sm">Etapa:</span>
                <span className="px-2 py-0.5 bg-nexus-border rounded text-xs font-medium text-nexus-muted uppercase tracking-wider">
                  {deal.stage}
                </span>
              </div>
            </div>

            <button 
              onClick={() => moveDeal(deal.id, 'proxima-etapa', userId)}
              className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 bg-nexus-border hover:bg-nexus-accent hover:text-black transition-all rounded-lg font-medium text-sm"
            >
              Avançar Negócio
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ))}

        {deals.length === 0 && (
          <div className="col-span-full py-12 text-center bg-nexus-card/50 border border-dashed border-nexus-border rounded-xl">
            <p className="text-nexus-muted">Nenhum negócio encontrado nesta pipeline.</p>
          </div>
        )}
      </div>
    </div>
  );
};
