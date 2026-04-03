import React, { useMemo } from 'react';
import { usePipeline, useDeals } from '../hooks/useAgendor';
import { Deal, PipelineStage } from '../types/agendor';
import { 
  DollarSign, 
  ChevronRight, 
  ChevronLeft, 
  MoreVertical, 
  Calendar, 
  User as UserIcon,
  Loader2,
  AlertCircle,
  TrendingUp,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SalesFunnelProps {
  pipelineId: string;
  userId: string;
}

export const SalesFunnel: React.FC<SalesFunnelProps> = ({ pipelineId, userId }) => {
  const { pipeline, loading: loadingPipeline, error: errorPipeline } = usePipeline(pipelineId);
  const { deals, loading: loadingDeals, error: errorDeals, moveDeal } = useDeals(pipelineId);

  const dealsByStage = useMemo(() => {
    const grouped: Record<string, Deal[]> = {};
    if (pipeline) {
      pipeline.stages.forEach(stage => {
        grouped[stage.name] = deals.filter(deal => deal.stage === stage.name);
      });
    }
    return grouped;
  }, [pipeline, deals]);

  const stageMetrics = useMemo(() => {
    const metrics: Record<string, { count: number; totalValue: number }> = {};
    if (pipeline) {
      pipeline.stages.forEach(stage => {
        const stageDeals = dealsByStage[stage.name] || [];
        metrics[stage.name] = {
          count: stageDeals.length,
          totalValue: stageDeals.reduce((sum, d) => sum + (d.value || 0), 0)
        };
      });
    }
    return metrics;
  }, [pipeline, dealsByStage]);

  if (loadingPipeline || (loadingDeals && deals.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-nexus-accent" />
        <p className="text-nexus-muted font-medium animate-pulse">Sincronizando funil de vendas...</p>
      </div>
    );
  }

  if (errorPipeline || errorDeals) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 text-red-500 bg-red-500/5 rounded-2xl border border-red-500/20 m-6">
        <AlertCircle className="w-12 h-12" />
        <div className="text-center">
          <p className="font-bold text-lg">Erro na Sincronização</p>
          <p className="text-sm opacity-80">{errorPipeline || errorDeals}</p>
        </div>
      </div>
    );
  }

  if (!pipeline) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-nexus-bg">
      {/* Header with Funnel Stats */}
      <div className="p-6 border-b border-nexus-border bg-nexus-card/30 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-nexus-text flex items-center gap-2">
              {pipeline.name}
              <span className="text-xs font-normal px-2 py-1 bg-nexus-accent/10 text-nexus-accent rounded-full border border-nexus-accent/20">
                {deals.length} Negócios Ativos
              </span>
            </h2>
            <p className="text-nexus-muted text-sm mt-1">{pipeline.description || 'Gerencie seu processo comercial de ponta a ponta.'}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-wider text-nexus-muted font-bold">Valor Total em Aberto</span>
              <span className="text-xl font-mono font-bold text-nexus-accent">
                R$ {(deals.reduce((s, d) => s + d.value, 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-10 w-px bg-nexus-border mx-2 hidden md:block" />
            <button className="p-2.5 bg-nexus-card border border-nexus-border rounded-xl hover:border-nexus-accent transition-all">
              <Filter className="w-5 h-5 text-nexus-muted" />
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max pb-4">
          {pipeline.stages.sort((a, b) => a.order - b.order).map((stage, index) => (
            <div 
              key={stage.id} 
              className="flex flex-col w-80 bg-nexus-card/20 rounded-2xl border border-nexus-border/50 overflow-hidden"
            >
              {/* Stage Header */}
              <div className="p-4 border-b border-nexus-border bg-nexus-card/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]" 
                      style={{ backgroundColor: stage.color || '#EAB308' }} 
                    />
                    <h3 className="font-bold text-nexus-text truncate max-w-[180px]">{stage.name}</h3>
                  </div>
                  <span className="text-xs font-mono bg-nexus-bg px-2 py-1 rounded-lg border border-nexus-border text-nexus-muted">
                    {stageMetrics[stage.name]?.count || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-nexus-muted">
                  <span>VALOR TOTAL</span>
                  <span className="text-nexus-text">
                    R$ {(stageMetrics[stage.name]?.totalValue / 100).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Stage Content (Deals) */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {(dealsByStage[stage.name] || []).map((deal) => (
                    <motion.div
                      key={deal.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-nexus-card border border-nexus-border p-4 rounded-xl shadow-sm hover:shadow-md hover:border-nexus-accent/50 transition-all cursor-pointer group relative"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-sm text-nexus-text leading-tight group-hover:text-nexus-accent transition-colors pr-6">
                          {deal.title}
                        </h4>
                        <button className="absolute top-3 right-2 p-1 text-nexus-muted hover:text-nexus-text opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="bg-nexus-accent/10 text-nexus-accent p-1 rounded-md">
                          <DollarSign className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-mono font-bold text-nexus-text">
                          R$ {(deal.value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {deal.tags?.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 bg-nexus-border/50 text-nexus-muted rounded-md border border-nexus-border">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-nexus-border/50">
                        <div className="flex items-center gap-3 text-[10px] text-nexus-muted">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString('pt-BR') : '--/--'}
                          </div>
                          <div className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            {deal.assigned_to.substring(0, 8)}...
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          {index > 0 && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                moveDeal(deal.id, pipeline.stages[index - 1].name, userId);
                              }}
                              className="p-1.5 bg-nexus-bg border border-nexus-border rounded-lg hover:bg-nexus-accent hover:text-black transition-all"
                              title="Mover para etapa anterior"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {index < pipeline.stages.length - 1 && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                moveDeal(deal.id, pipeline.stages[index + 1].name, userId);
                              }}
                              className="p-1.5 bg-nexus-bg border border-nexus-border rounded-lg hover:bg-nexus-accent hover:text-black transition-all"
                              title="Mover para próxima etapa"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {(!dealsByStage[stage.name] || dealsByStage[stage.name].length === 0) && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-nexus-border/30 rounded-xl">
                    <p className="text-[10px] text-nexus-muted font-medium uppercase tracking-widest">Sem Negócios</p>
                  </div>
                )}
              </div>

              {/* Stage Footer */}
              <div className="p-3 bg-nexus-card/40 border-t border-nexus-border">
                <button className="w-full py-2 text-xs font-bold text-nexus-muted hover:text-nexus-accent transition-colors flex items-center justify-center gap-2">
                  + NOVO NEGÓCIO
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #262626;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #404040;
        }
      `}</style>
    </div>
  );
};
