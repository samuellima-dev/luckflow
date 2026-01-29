
import React, { useState, useEffect } from 'react';
import { Check, X, Crown, ShieldCheck, Zap, Rocket, Loader2, QrCode, ArrowLeft, Lock, AlertCircle, Shield, ExternalLink } from 'lucide-react';
import { User } from '../types';

declare global {
  interface Window {
    Stripe: any;
  }
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpgrade: (plan: 'silver' | 'bronze' | 'gold') => Promise<void>;
  onCancelPlan: () => Promise<void>;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, currentUser, onUpgrade, onCancelPlan }) => {
  const [viewState, setViewState] = useState<'plans' | 'payment' | 'cancel_confirmation'>('plans');
  const [selectedPlanId, setSelectedPlanId] = useState<'silver' | 'bronze' | 'gold' | null>(null);
  const [processingMethod, setProcessingMethod] = useState<'pix' | 'card' | 'stripe' | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [stripe, setStripe] = useState<any>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializa o Stripe quando o modal abre
    if (isOpen && !stripe) {
      if (window.Stripe) {
        // Em produção, a chave viria de uma variável de ambiente: process.env.STRIPE_PUBLIC_KEY
        // Usando uma chave de teste padrão do Stripe para demonstração
        try {
          const stripeInstance = window.Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
          setStripe(stripeInstance);
        } catch (err) {
          console.error("Erro ao inicializar Stripe:", err);
          setStripeError("Falha ao carregar o provedor de pagamentos.");
        }
      } else {
        setStripeError("SDK do Stripe não detectado.");
      }
    }
  }, [isOpen, stripe]);

  if (!isOpen) return null;

  const PLANS = [
      {
          id: 'silver',
          label: 'Prata',
          price: 'R$ 25,00',
          priceId: 'price_1Q_silver_test',
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
          priceId: 'price_1Q_bronze_test',
          period: '/mês',
          icon: Zap,
          color: 'text-amber-700',
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
          priceId: 'price_1Q_gold_test',
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

  const handlePlanClick = (planId: 'silver' | 'bronze' | 'gold') => {
      setSelectedPlanId(planId);
      setViewState('payment');
  };

  const handleStripeCheckout = async () => {
    if (!selectedPlanId || !stripe) return;
    
    setProcessingMethod('stripe');
    setStripeError(null);

    try {
      // 1. Em um cenário real, você chamaria seu back-end para criar a sessão:
      /*
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: selectedPlanId,
          priceId: PLANS.find(p => p.id === selectedPlanId)?.priceId 
        }),
      });
      const session = await response.json();
      const result = await stripe.redirectToCheckout({ sessionId: session.id });
      */

      // Simulação para o ambiente atual
      console.log(`[Stripe] Iniciando fluxo para: ${selectedPlanId}`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulamos o retorno positivo do Stripe (como se o webhook tivesse batido)
      await onUpgrade(selectedPlanId);
      setProcessingMethod(null);
      onClose();
    } catch (err: any) {
      setStripeError(err.message || "Ocorreu um erro ao processar o checkout.");
      setProcessingMethod(null);
    }
  };

  const handleConfirmAlternative = async (method: 'pix' | 'card') => {
      if (!selectedPlanId) return;
      setProcessingMethod(method);
      await onUpgrade(selectedPlanId);
      setProcessingMethod(null);
      onClose();
  };

  // Fix: Added the missing handleConfirmCancellation function to manage the cancellation process and state.
  const handleConfirmCancellation = async () => {
    setIsCancelling(true);
    try {
      await onCancelPlan();
    } catch (err) {
      console.error("Erro ao cancelar plano:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  const selectedPlanDetails = PLANS.find(p => p.id === selectedPlanId);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-[90%] max-w-5xl bg-nexus-bg border border-nexus-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-nexus-border bg-nexus-card/50 relative">
            {(viewState === 'payment' || viewState === 'cancel_confirmation') && !processingMethod && (
                <button 
                    onClick={() => setViewState('plans')}
                    className="absolute left-6 top-6 text-nexus-muted hover:text-nexus-text transition-colors flex items-center gap-1 text-sm"
                >
                    <ArrowLeft size={16} /> Voltar
                </button>
            )}
            <button 
                onClick={onClose} 
                className="absolute right-6 top-6 text-nexus-muted hover:text-nexus-text transition-colors"
                disabled={!!processingMethod}
            >
                <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-nexus-text mb-2 flex items-center justify-center gap-2">
                <Rocket className="text-nexus-cobalt" /> Evolua seu Workflow
            </h2>
            <p className="text-nexus-muted">
                {viewState === 'plans' && 'Escolha o plano ideal para escalar a gestão dos seus projetos.'}
                {viewState === 'payment' && 'Ambiente de pagamento seguro via Stripe.'}
                {viewState === 'cancel_confirmation' && 'Gerenciamento de Assinatura'}
            </p>
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto bg-nexus-bg custom-scrollbar flex-1">
            
            {stripeError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2">
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">{stripeError}</span>
                </div>
            )}

            {viewState === 'plans' && (
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
                                    disabled={isCurrent}
                                    onClick={() => handlePlanClick(plan.id)}
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
                                    {isCurrent ? 'Plano Atual' : `Assinar ${plan.label}`}
                                </button>

                                {isCurrent && currentUser.plan !== 'free' && (
                                    <button 
                                        onClick={() => setViewState('cancel_confirmation')}
                                        className="w-full mt-3 py-2 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded transition-colors"
                                    >
                                        Cancelar Assinatura
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {viewState === 'payment' && (
                <div className="max-w-2xl mx-auto animate-in slide-in-from-right-8 duration-300">
                    <div className={`mb-8 p-6 rounded-xl border bg-gradient-to-r ${selectedPlanDetails?.bgGradient} ${selectedPlanDetails?.borderColor} flex items-center justify-between`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg bg-nexus-bg border border-nexus-border ${selectedPlanDetails?.color}`}>
                                {selectedPlanDetails && <selectedPlanDetails.icon size={32} />}
                            </div>
                            <div>
                                <p className="text-sm text-nexus-muted uppercase tracking-wider font-bold">Resumo</p>
                                <h3 className="text-2xl font-bold text-nexus-text">Plano {selectedPlanDetails?.label}</h3>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-3xl font-bold text-nexus-text">{selectedPlanDetails?.price}</div>
                             <div className="text-xs text-nexus-muted">Mensal</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button 
                            onClick={handleStripeCheckout}
                            disabled={!!processingMethod}
                            className={`
                                relative group p-6 rounded-lg border border-nexus-cobalt/30 bg-nexus-card hover:border-nexus-cobalt hover:bg-nexus-cobalt/5 transition-all text-left flex items-center gap-5
                                ${processingMethod === 'stripe' ? 'ring-2 ring-nexus-cobalt' : ''}
                            `}
                        >
                            <div className="w-14 h-14 rounded-full bg-nexus-cobalt/10 border border-nexus-cobalt/20 flex items-center justify-center text-nexus-cobalt">
                                {processingMethod === 'stripe' ? <Loader2 className="animate-spin" size={28} /> : <ShieldCheck size={28} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-nexus-text text-lg flex items-center gap-2">
                                    Checkout Inteligente Stripe
                                    <span className="text-[10px] bg-nexus-cobalt text-white px-2 py-0.5 rounded uppercase font-bold">Oficial</span>
                                </h4>
                                <p className="text-sm text-nexus-muted">Cartão de Crédito, Google Pay e Apple Pay com proteção 3D Secure.</p>
                            </div>
                            <ExternalLink size={20} className="text-nexus-muted group-hover:text-nexus-cobalt transition-colors" />
                        </button>

                        <div className="flex items-center gap-4 py-4">
                            <div className="flex-1 h-px bg-nexus-border"></div>
                            <span className="text-[10px] font-bold text-nexus-muted uppercase tracking-widest">Alternativas</span>
                            <div className="flex-1 h-px bg-nexus-border"></div>
                        </div>

                        <button 
                            onClick={() => handleConfirmAlternative('pix')}
                            disabled={!!processingMethod}
                            className="group p-4 rounded-lg border border-nexus-border bg-nexus-card hover:border-green-500 transition-all text-left flex items-center gap-4"
                        >
                            <div className="w-10 h-10 rounded-full bg-nexus-bg border border-nexus-border flex items-center justify-center text-green-500">
                                {processingMethod === 'pix' ? <Loader2 className="animate-spin" size={20} /> : <QrCode size={20} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-nexus-text text-sm">Pagar com Pix</h4>
                                <p className="text-xs text-nexus-muted">Liberação imediata via QR Code dinâmico.</p>
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-6 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6" />
                        <div className="h-4 w-px bg-nexus-border"></div>
                        <div className="flex items-center gap-1 text-[10px] text-nexus-muted uppercase font-bold">
                            <Lock size={12} /> Pagamento Criptografado
                        </div>
                    </div>
                </div>
            )}

            {viewState === 'cancel_confirmation' && (
                <div className="max-w-md mx-auto text-center py-12 animate-in fade-in zoom-in-95">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-500/20">
                        <AlertCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-nexus-text mb-3">Confirmar Cancelamento?</h3>
                    <p className="text-nexus-muted mb-8 text-sm">
                        Sua assinatura será encerrada ao final do ciclo atual. Você perderá acesso às ferramentas de IA e dashboards avançados.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleConfirmCancellation}
                            disabled={isCancelling}
                            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                        >
                            {isCancelling ? <Loader2 className="animate-spin" /> : 'Confirmar e Encerrar'}
                        </button>
                        <button 
                            onClick={() => setViewState('plans')}
                            className="w-full py-3 text-nexus-muted font-medium hover:text-nexus-text"
                        >
                            Manter Assinatura
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
