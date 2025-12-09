
import React, { useState } from 'react';
import { Check, X, Crown, ShieldCheck, Zap, Rocket, CreditCard, Loader2, QrCode, ArrowLeft, Lock, AlertCircle } from 'lucide-react';
import { User } from '../types';

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
  const [processingMethod, setProcessingMethod] = useState<'pix' | 'card' | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isOpen) return null;

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

  const handlePlanClick = (planId: 'silver' | 'bronze' | 'gold') => {
      setSelectedPlanId(planId);
      setViewState('payment');
  };

  const handleConfirmPayment = async (method: 'pix' | 'card') => {
      if (!selectedPlanId) return;
      setProcessingMethod(method);
      await onUpgrade(selectedPlanId);
      setProcessingMethod(null);
      // Reset state after successful upgrade (handled by parent closing modal usually, but safety reset)
      setTimeout(() => {
          setViewState('plans');
          setSelectedPlanId(null);
      }, 500);
  };

  const handleConfirmCancellation = async () => {
      setIsCancelling(true);
      await onCancelPlan();
      setIsCancelling(false);
      setViewState('plans');
  };

  const handleBack = () => {
      setViewState('plans');
      setSelectedPlanId(null);
  };

  const selectedPlanDetails = PLANS.find(p => p.id === selectedPlanId);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-[90%] max-w-5xl bg-nexus-bg border border-nexus-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-nexus-border bg-nexus-card/50 relative">
            {(viewState === 'payment' || viewState === 'cancel_confirmation') && (
                <button 
                    onClick={handleBack}
                    className="absolute left-6 top-6 text-nexus-muted hover:text-nexus-text transition-colors flex items-center gap-1 text-sm"
                >
                    <ArrowLeft size={16} /> Voltar
                </button>
            )}
            <button 
                onClick={onClose} 
                className="absolute right-6 top-6 text-nexus-muted hover:text-nexus-text transition-colors"
            >
                <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-nexus-text mb-2 flex items-center justify-center gap-2">
                <Rocket className="text-nexus-cobalt" /> Evolua seu Workflow
            </h2>
            <p className="text-nexus-muted">
                {viewState === 'plans' && 'Escolha o plano ideal para escalar a gestão dos seus projetos.'}
                {viewState === 'payment' && 'Selecione a forma de pagamento segura.'}
                {viewState === 'cancel_confirmation' && 'Gerenciamento de Assinatura'}
            </p>
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto bg-nexus-bg custom-scrollbar flex-1">
            
            {viewState === 'plans' && (
                /* VIEW 1: PLANS GRID */
                <>
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
                                        {isCurrent ? (
                                            <>Plano Atual</>
                                        ) : (
                                            <>
                                                Contratar {plan.label}
                                            </>
                                        )}
                                    </button>

                                    {/* Cancellation Button for Current Plan */}
                                    {isCurrent && currentUser.plan !== 'free' && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setViewState('cancel_confirmation');
                                            }}
                                            className="w-full mt-3 py-2 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded transition-colors border border-transparent hover:border-red-500/20"
                                        >
                                            Cancelar Assinatura
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-8 text-center">
                        <p className="text-xs text-nexus-muted flex items-center justify-center gap-2">
                            <ShieldCheck size={12} /> Pagamento seguro via Stripe/MercadoPago. Cancelamento a qualquer momento.
                        </p>
                    </div>
                </>
            )}

            {viewState === 'payment' && (
                /* VIEW 2: PAYMENT SELECTION */
                <div className="max-w-2xl mx-auto animate-in slide-in-from-right-8 duration-300">
                    
                    {/* Plan Summary Card */}
                    <div className={`mb-8 p-6 rounded-xl border bg-gradient-to-r ${selectedPlanDetails?.bgGradient} ${selectedPlanDetails?.borderColor} flex items-center justify-between`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg bg-nexus-bg border border-nexus-border ${selectedPlanDetails?.color}`}>
                                {selectedPlanDetails && <selectedPlanDetails.icon size={32} />}
                            </div>
                            <div>
                                <p className="text-sm text-nexus-muted uppercase tracking-wider font-bold">Resumo do Pedido</p>
                                <h3 className="text-2xl font-bold text-nexus-text">Plano {selectedPlanDetails?.label}</h3>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-3xl font-bold text-nexus-text">{selectedPlanDetails?.price}</div>
                             <div className="text-xs text-nexus-muted">Cobrado mensalmente</div>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-nexus-text mb-4 flex items-center gap-2">
                        <Lock size={18} className="text-nexus-cobalt" /> Escolha como pagar
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        {/* PIX OPTION */}
                        <button 
                            onClick={() => handleConfirmPayment('pix')}
                            disabled={processingMethod !== null}
                            className={`
                                relative group p-5 rounded-lg border border-nexus-border bg-nexus-card hover:border-green-500 transition-all text-left flex items-center gap-4
                                ${processingMethod === 'pix' ? 'border-green-500 bg-green-500/5' : ''}
                            `}
                        >
                            <div className="w-12 h-12 rounded-full bg-nexus-bg border border-nexus-border flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                                {processingMethod === 'pix' ? <Loader2 className="animate-spin" /> : <QrCode size={24} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-nexus-text text-lg flex items-center gap-2">
                                    Pix 
                                    <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded uppercase tracking-wide">Aprovação Imediata</span>
                                </h4>
                                <p className="text-sm text-nexus-muted">Gere um código QR ou Copia e Cola para liberar seu acesso instantaneamente.</p>
                            </div>
                            <div className="w-6 h-6 rounded-full border-2 border-nexus-border group-hover:border-green-500 flex items-center justify-center">
                                <div className={`w-3 h-3 rounded-full bg-green-500 transition-transform ${processingMethod === 'pix' ? 'scale-100' : 'scale-0'}`}></div>
                            </div>
                        </button>

                        {/* CREDIT CARD OPTION */}
                        <button 
                            onClick={() => handleConfirmPayment('card')}
                            disabled={processingMethod !== null}
                            className={`
                                relative group p-5 rounded-lg border border-nexus-border bg-nexus-card hover:border-nexus-cobalt transition-all text-left flex items-center gap-4
                                ${processingMethod === 'card' ? 'border-nexus-cobalt bg-blue-500/5' : ''}
                            `}
                        >
                             <div className="w-12 h-12 rounded-full bg-nexus-bg border border-nexus-border flex items-center justify-center text-nexus-cobalt group-hover:scale-110 transition-transform">
                                {processingMethod === 'card' ? <Loader2 className="animate-spin" /> : <CreditCard size={24} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-nexus-text text-lg">Cartão de Crédito</h4>
                                <p className="text-sm text-nexus-muted">Visa, Mastercard, Elo, Amex. Parcelamento indisponível para assinaturas.</p>
                            </div>
                             <div className="w-6 h-6 rounded-full border-2 border-nexus-border group-hover:border-nexus-cobalt flex items-center justify-center">
                                <div className={`w-3 h-3 rounded-full bg-nexus-cobalt transition-transform ${processingMethod === 'card' ? 'scale-100' : 'scale-0'}`}></div>
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-nexus-muted opacity-70">
                        <Lock size={12} /> Seus dados estão protegidos com criptografia de ponta a ponta.
                    </div>

                </div>
            )}

            {viewState === 'cancel_confirmation' && (
                /* VIEW 3: CANCELLATION CONFIRMATION */
                <div className="max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200 text-center py-8">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-500/20">
                        <AlertCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-nexus-text mb-3">Cancelar Assinatura?</h3>
                    <p className="text-nexus-muted mb-8 text-sm leading-relaxed">
                        Ao confirmar, você perderá acesso aos recursos exclusivos do plano <strong>{currentUser.plan?.toUpperCase()}</strong> e retornará ao plano Gratuito.
                    </p>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={handleConfirmCancellation}
                            disabled={isCancelling}
                            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isCancelling ? <Loader2 className="animate-spin" /> : <><X size={18} /> Confirmar Cancelamento</>}
                        </button>
                        <button 
                            onClick={() => setViewState('plans')}
                            disabled={isCancelling}
                            className="w-full py-3 bg-transparent hover:bg-nexus-card border border-transparent hover:border-nexus-border text-nexus-muted hover:text-nexus-text font-medium rounded-lg transition-colors"
                        >
                            Não, quero manter minha assinatura
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
