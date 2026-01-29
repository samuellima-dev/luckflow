
import React, { useState } from 'react';
import { Check, X, Crown, Rocket, Loader2, QrCode, ArrowLeft, MessageCircle } from 'lucide-react';
import { User } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpgrade: (plan: 'premium') => Promise<void>;
  onCancelPlan: () => Promise<void>;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, currentUser, onUpgrade, onCancelPlan }) => {
  const [viewState, setViewState] = useState<'plans' | 'payment' | 'cancel_confirmation'>('plans');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const PREMIUM_PLAN = {
      id: 'premium',
      label: 'Premium',
      price: 'R$ 29,90',
      period: '/mês',
      icon: Crown,
      color: 'text-yellow-400',
      borderColor: 'border-yellow-400/50',
      bgGradient: 'from-yellow-400/20 to-transparent',
      features: [
          'Projetos Ilimitados',
          'IA Generativa (Samuel_IA)',
          'Automações Avançadas',
          'Relatórios em PDF',
          'Gestão de Equipes Completa',
          'Suporte Exclusivo via WhatsApp'
      ]
  };

  const handleSubscribeClick = () => {
      setViewState('payment');
  };

  const handleConfirmPayment = async () => {
      setIsProcessing(true);
      // Simula o tempo de verificação do pagamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      await onUpgrade('premium');
      setIsProcessing(false);
      onClose();
  };

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

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-[90%] max-w-4xl bg-nexus-bg border border-nexus-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-nexus-border bg-nexus-card/50 relative">
            {(viewState === 'payment' || viewState === 'cancel_confirmation') && (
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
            >
                <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-nexus-text mb-2 flex items-center justify-center gap-2">
                <Rocket className="text-nexus-cobalt" /> Evolua seu Workflow
            </h2>
            <p className="text-nexus-muted">
                {viewState === 'plans' && 'Desbloqueie todo o potencial da plataforma.'}
                {viewState === 'payment' && 'Pagamento seguro via Pix.'}
                {viewState === 'cancel_confirmation' && 'Gerenciamento de Assinatura'}
            </p>
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto bg-nexus-bg custom-scrollbar flex-1 flex flex-col items-center">
            
            {viewState === 'plans' && (
                <div className="w-full max-w-md">
                    <div 
                        className={`
                            relative rounded-xl border p-8 flex flex-col transition-all duration-300 group
                            ${PREMIUM_PLAN.borderColor} bg-gradient-to-b ${PREMIUM_PLAN.bgGradient}
                            shadow-2xl
                        `}
                    >
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-yellow-400/20 flex items-center gap-2">
                            <Crown size={12} fill="black" /> Plano Completo
                        </div>

                        <div className="text-center mb-6 mt-2">
                            <h3 className={`text-2xl font-bold ${PREMIUM_PLAN.color} mb-2`}>{PREMIUM_PLAN.label}</h3>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-4xl font-bold text-nexus-text">{PREMIUM_PLAN.price}</span>
                                <span className="text-sm text-nexus-muted">{PREMIUM_PLAN.period}</span>
                            </div>
                        </div>

                        <ul className="space-y-4 mb-8">
                            {PREMIUM_PLAN.features.map((feat, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-nexus-text">
                                    <div className="mt-0.5 p-0.5 bg-yellow-400/20 rounded-full">
                                        <Check size={12} className="text-yellow-400" />
                                    </div>
                                    <span className="font-medium">{feat}</span>
                                </li>
                            ))}
                        </ul>

                        {currentUser.plan === 'premium' ? (
                            <div className="space-y-3">
                                <button
                                    className="w-full py-3 rounded-lg font-bold text-sm bg-nexus-card text-green-500 border border-green-500/30 cursor-default flex items-center justify-center gap-2"
                                >
                                    <Check size={16} /> Plano Ativo
                                </button>
                                <button 
                                    onClick={() => setViewState('cancel_confirmation')}
                                    className="w-full py-2 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded transition-colors"
                                >
                                    Cancelar Assinatura
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleSubscribeClick}
                                className="w-full py-4 rounded-lg font-bold text-sm bg-yellow-400 text-black hover:bg-yellow-500 shadow-lg shadow-yellow-400/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                Assinar Agora <Rocket size={16} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {viewState === 'payment' && (
                <div className="w-full max-w-lg animate-in slide-in-from-right-8 duration-300 flex flex-col items-center text-center">
                    
                    <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex flex-col items-center">
                        <div className="bg-white p-2 rounded-lg mb-3 shadow-lg">
                            <img 
                                src="https://i.ibb.co/xtX4JLxR/Captura-de-tela-2026-01-29-122253.png" 
                                alt="QR Code Pix" 
                                className="w-48 h-48 object-contain"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-green-500 font-bold uppercase tracking-widest text-xs mt-2">
                            <QrCode size={16} /> Pagamento via Pix
                        </div>
                    </div>

                    <p className="text-nexus-text font-medium mb-6 px-4">
                        Escaneie o QR Code acima com seu aplicativo de banco para realizar o pagamento de <span className="text-yellow-400 font-bold">R$ 29,90</span>.
                    </p>

                    <div className="w-full space-y-3">
                        <a 
                            href="https://wa.me/5581999944682?text=Ol%C3%A1%2C%20gostaria%20de%20confirmar%20o%20pagamento%20da%20minha%20assinatura%20LuckFlow%20Premium!"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                        >
                            <MessageCircle size={18} />
                            Enviar Comprovante no WhatsApp
                        </a>
                        
                        <p className="text-[10px] text-nexus-muted">
                            Após o pagamento, clique no botão acima para agilizar a liberação enviando o comprovante para nosso suporte (81) 99994-4682.
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-nexus-border w-full">
                        <button 
                            onClick={handleConfirmPayment}
                            disabled={isProcessing}
                            className="text-nexus-muted hover:text-nexus-text text-xs underline flex items-center justify-center gap-2 mx-auto"
                        >
                           {isProcessing ? <Loader2 className="animate-spin" size={12} /> : "Já fiz o envio, liberar acesso temporário"}
                        </button>
                    </div>
                </div>
            )}

            {viewState === 'cancel_confirmation' && (
                <div className="max-w-md mx-auto text-center py-8 animate-in fade-in zoom-in-95">
                    <h3 className="text-2xl font-bold text-nexus-text mb-3">Cancelar Premium?</h3>
                    <p className="text-nexus-muted mb-8 text-sm">
                        Sua assinatura será encerrada e você perderá acesso ao suporte exclusivo e recursos de IA.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleConfirmCancellation}
                            disabled={isCancelling}
                            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                        >
                            {isCancelling ? <Loader2 className="animate-spin" /> : 'Confirmar Cancelamento'}
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
