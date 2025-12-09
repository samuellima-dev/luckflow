
import React, { useState } from 'react';
import { Check, X, Crown, ShieldCheck, Zap, Rocket, CreditCard, Loader2 } from 'lucide-react';
import { User } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpgrade: (plan: 'silver' | 'bronze' | 'gold') => Promise<void>;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, currentUser, onUpgrade }) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPlan = async (plan: 'silver' | 'bronze' | 'gold') => {
      setLoadingPlan(plan);
      await onUpgrade(plan);
      setLoadingPlan(null);
  };

  const PLANS = [
      {
          id: 'silver',
          label: 'Prata',
          price: 'R$ 25,00',
          period: '/mês',
          icon: ShieldCheck,
          color: 'text-gray-400',
          borderColor: 'border-gray-400/30',
          bgGradient: 'from-gray-500/10 to-transparent',
          highlight: false,
          features: [
              'Até 5 Projetos',
              'Gestão básica de tarefas',
              'Anexos limitados (100MB)',
              'Suporte por email'
          ]
      },
      {
          id: 'bronze',
          label: 'Bronze',
          price: 'R$ 32,90',
          period: '/mês',
          icon: Zap,
          color: 'text-amber-700', // Bronze tone
          borderColor: 'border-amber-700/30',
          bgGradient: 'from-amber-700/10 to-transparent',
          highlight: false,
          features: [
              'Projetos Ilimitados',
              'Automações Básicas',
              'Dashboard de Métricas',
              'Anexos (1GB)',
              'Prioridade na fila'
          ]
      },
      {
          id: 'gold',
          label: 'Ouro',
          price: 'R$ 47,90',
          period: '/mês',
          icon: Crown,
          color: 'text-yellow-400',
          borderColor: 'border-yellow-400/50',
          bgGradient: 'from-yellow-400/20 to-transparent',
          highlight: true,
          features: [
              'Tudo do Plano Bronze',
              'IA Generativa (Samuel_IA)',
              'Automações Avançadas',
              'Relatórios em PDF',
              'Gestão de Equipes Completa',
              'Suporte WhatsApp 24/7'
          ]
      }
  ] as const;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-[90%] max-w-5xl bg-nexus-bg border border-nexus-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-nexus-border bg-nexus-card/50 relative">
            <button 
                onClick={onClose} 
                className="absolute right-6 top-6 text-nexus-muted hover:text-nexus-text transition-colors"
            >
                <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-nexus-text mb-2 flex items-center justify-center gap-2">
                <Rocket className="text-nexus-cobalt" /> Evolua seu Workflow
            </h2>
            <p className="text-nexus-muted">Escolha o plano ideal para escalar a gestão dos seus projetos.</p>
        </div>

        {/* Plans Grid */}
        <div className="p-8 overflow-y-auto bg-nexus-bg custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => {
                    const isCurrent = currentUser.plan === plan.id;
                    return (
                        <div 
                            key={plan.id}
                            className={`
                                relative rounded-xl border p-6 flex flex-col transition-all duration-300 group
                                ${plan.borderColor} bg-gradient-to-b ${plan.bgGradient}
                                hover:translate-y-[-5px] hover:shadow-xl
                                ${plan.highlight ? 'ring-1 ring-yellow-400/30' : ''}
                            `}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-yellow-400/20">
                                    Mais Popular
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg bg-nexus-bg border border-nexus-border ${plan.color}`}>
                                    <plan.icon size={24} />
                                </div>
                                <h3 className={`text-xl font-bold ${plan.color}`}>{plan.label}</h3>
                            </div>

                            <div className="mb-6">
                                <span className="text-3xl font-bold text-nexus-text">{plan.price}</span>
                                <span className="text-sm text-nexus-muted">{plan.period}</span>
                            </div>

                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((feat, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-nexus-muted group-hover:text-nexus-text transition-colors">
                                        <Check size={16} className={`mt-0.5 ${plan.color}`} />
                                        <span className="leading-tight">{feat}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                disabled={isCurrent || loadingPlan !== null}
                                onClick={() => handleSelectPlan(plan.id)}
                                className={`
                                    w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all
                                    ${isCurrent 
                                        ? 'bg-nexus-card text-nexus-muted cursor-default border border-nexus-border' 
                                        : plan.highlight 
                                            ? 'bg-yellow-400 text-black hover:bg-yellow-500 shadow-lg shadow-yellow-400/20' 
                                            : 'bg-nexus-cobalt text-white hover:bg-blue-600 shadow-lg shadow-blue-900/20'}
                                    disabled:opacity-70 disabled:cursor-not-allowed
                                `}
                            >
                                {loadingPlan === plan.id ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : isCurrent ? (
                                    <>Plano Atual</>
                                ) : (
                                    <>
                                        <CreditCard size={16} /> Contratar {plan.label}
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8 text-center">
                <p className="text-xs text-nexus-muted flex items-center justify-center gap-2">
                    <ShieldCheck size={12} /> Pagamento seguro via Stripe/MercadoPago. Cancelamento a qualquer momento.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
