
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Shield, Check, X, UserCog, Camera, Lock, Save, AlertCircle, Upload, Link as LinkIcon, Image as ImageIcon, Phone, Mail, CreditCard, Crown, Star, Zap } from 'lucide-react';
import { ROLES_CONFIG } from '../constants';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateProfile: (updates: Partial<User> & { password?: string }) => void;
  onOpenSubscription: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdateProfile, onOpenSubscription }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'subscription'>('general');
  
  // Form States
  const [avatarUrl, setAvatarUrl] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<User['role']>('viewer');
  
  // Password States
  const [passwordData, setPasswordData] = useState({
      current: '',
      new: '',
      confirm: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
      if (isOpen) {
          setAvatarUrl(user.avatarUrl || '');
          setWhatsapp(user.whatsapp || '');
          setEmail(user.email || '');
          setRole(user.role);
          setPasswordData({ current: '', new: '', confirm: '' });
          setError('');
          setSuccess('');
      }
  }, [isOpen, user]);

  const validatePassword = (pwd: string) => {
      const hasUpper = /[A-Z]/.test(pwd);
      const hasLower = /[a-z]/.test(pwd);
      const hasNumber = /[0-9]/.test(pwd);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
      return hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const validateEmail = (emailStr: string) => {
      const re = /\S+@\S+\.\S+/;
      return re.test(emailStr);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file size (limit to ~2MB for localStorage safety in this demo)
      if (file.size > 2 * 1024 * 1024) {
          setError("A imagem é muito grande. Tente uma menor que 2MB.");
          return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarUrl(event.target.result as string);
          setError(''); // Clear any previous errors
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGeneral = () => {
      setError('');
      
      if (email && !validateEmail(email)) {
          setError("Por favor, insira um endereço de e-mail válido.");
          return;
      }

      onUpdateProfile({ role, avatarUrl, whatsapp, email });
      setSuccess('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
  };

  const handleSaveSecurity = () => {
      setError('');
      setSuccess('');

      if (!passwordData.new) {
          setError('Digite a nova senha.');
          return;
      }

      if (passwordData.new !== passwordData.confirm) {
          setError('As senhas não conferem.');
          return;
      }

      if (!validatePassword(passwordData.new)) {
          setError('A senha deve conter: Maiúscula, minúscula, número e caractere especial.');
          return;
      }

      // In a real app, verify current password here.
      onUpdateProfile({ password: passwordData.new });
      setSuccess('Senha alterada com sucesso!');
      setPasswordData({ current: '', new: '', confirm: '' });
      setTimeout(() => setSuccess(''), 3000);
  };

  const getPlanDetails = () => {
      switch(user.plan) {
          case 'gold': return { name: 'Ouro', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' };
          case 'bronze': return { name: 'Bronze', icon: Zap, color: 'text-amber-700', bg: 'bg-amber-700/10 border-amber-700/30' };
          case 'silver': return { name: 'Prata', icon: Shield, color: 'text-gray-400', bg: 'bg-gray-400/10 border-gray-400/30' };
          default: return { name: 'Gratuito', icon: Star, color: 'text-nexus-muted', bg: 'bg-nexus-bg border-nexus-border' };
      }
  };

  const planDetails = getPlanDetails();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[600px] bg-nexus-card border border-nexus-border shadow-2xl rounded-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-nexus-border bg-nexus-bg/50">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-nexus-cobalt flex items-center justify-center text-white font-bold text-xl overflow-hidden relative border-2 border-nexus-border">
                {avatarUrl ? (
                    <img src={avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                    user.username.charAt(0).toUpperCase()
                )}
             </div>
             <div>
                 <h2 className="text-xl font-bold text-nexus-text tracking-tight">{user.username}</h2>
                 <p className="text-xs text-nexus-muted uppercase tracking-wider flex items-center gap-1">
                     {ROLES_CONFIG[user.role].label}
                 </p>
             </div>
          </div>
          <button onClick={onClose} className="text-nexus-muted hover:text-nexus-text transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-nexus-border">
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'general' ? 'text-nexus-cobalt border-b-2 border-nexus-cobalt bg-nexus-cobalt/5' : 'text-nexus-muted hover:text-nexus-text'}`}
            >
                Geral
            </button>
            <button 
                onClick={() => setActiveTab('subscription')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'subscription' ? 'text-nexus-cobalt border-b-2 border-nexus-cobalt bg-nexus-cobalt/5' : 'text-nexus-muted hover:text-nexus-text'}`}
            >
                Assinatura
            </button>
            <button 
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'security' ? 'text-nexus-cobalt border-b-2 border-nexus-cobalt bg-nexus-cobalt/5' : 'text-nexus-muted hover:text-nexus-text'}`}
            >
                Segurança
            </button>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
            
            {success && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <Check size={16} /> {success}
                </div>
            )}
            
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}

            {activeTab === 'general' && (
                <div className="space-y-6">
                    {/* Avatar Section */}
                    <div className="space-y-3">
                        <label className="text-xs uppercase font-bold text-nexus-muted flex items-center gap-2">
                            <Camera size={14} /> Foto de Perfil
                        </label>
                        
                        <div className="flex gap-4 items-start">
                             {/* Preview */}
                             <div className="w-20 h-20 rounded-full bg-nexus-bg border border-nexus-border flex-shrink-0 flex items-center justify-center overflow-hidden relative group">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="text-nexus-muted opacity-50" size={32} />
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-[9px] text-white font-bold uppercase">Preview</span>
                                </div>
                             </div>

                             {/* Inputs */}
                             <div className="flex-1 space-y-3">
                                 {/* Upload Button */}
                                 <label className="flex items-center justify-center gap-2 w-full p-2.5 bg-nexus-bg border border-nexus-border border-dashed rounded cursor-pointer hover:border-nexus-cobalt hover:text-nexus-cobalt transition-colors group">
                                     <Upload size={16} className="text-nexus-muted group-hover:text-nexus-cobalt" />
                                     <span className="text-sm text-nexus-muted group-hover:text-nexus-cobalt font-medium">Carregar do computador</span>
                                     <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handleFileSelect}
                                     />
                                 </label>

                                 <div className="relative">
                                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LinkIcon size={14} className="text-nexus-muted" />
                                     </div>
                                     <input 
                                        type="text" 
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                        className="w-full bg-nexus-bg border border-nexus-border rounded p-2 pl-9 text-xs text-nexus-text focus:border-nexus-cobalt outline-none transition-colors"
                                        placeholder="Ou cole uma URL direta de imagem..."
                                     />
                                 </div>
                             </div>
                        </div>
                    </div>

                    <hr className="border-nexus-border" />

                    <div className="grid grid-cols-2 gap-4">
                        {/* Email Field */}
                        <div className="space-y-3">
                            <label className="text-xs uppercase font-bold text-nexus-muted flex items-center gap-2">
                                <Mail size={14} /> Email (Recuperação)
                            </label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-nexus-bg border border-nexus-border rounded p-3 pl-3 text-sm text-nexus-text focus:border-nexus-cobalt outline-none transition-colors"
                                placeholder="seu@email.com"
                            />
                        </div>

                        {/* WhatsApp Notification Field */}
                        <div className="space-y-3">
                            <label className="text-xs uppercase font-bold text-nexus-muted flex items-center gap-2">
                                <Phone size={14} /> WhatsApp (Alertas)
                            </label>
                            <input 
                                type="text" 
                                value={whatsapp}
                                onChange={(e) => setWhatsapp(e.target.value)}
                                className="w-full bg-nexus-bg border border-nexus-border rounded p-3 pl-3 text-sm text-nexus-text focus:border-nexus-cobalt outline-none transition-colors"
                                placeholder="+55..."
                            />
                        </div>
                    </div>

                    <hr className="border-nexus-border" />

                    {/* Role Selection */}
                    <div className="space-y-3">
                        <label className="text-xs uppercase font-bold text-nexus-muted flex items-center gap-2">
                            <Shield size={14} /> Cargo e Permissões
                        </label>
                        <div className="grid gap-2">
                            {(Object.keys(ROLES_CONFIG) as Array<keyof typeof ROLES_CONFIG>).map((roleKey) => {
                                const config = ROLES_CONFIG[roleKey];
                                const isSelected = role === roleKey;
                                return (
                                    <button
                                        key={roleKey}
                                        onClick={() => setRole(roleKey)}
                                        className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                                            isSelected 
                                            ? 'bg-nexus-cobalt/10 border-nexus-cobalt ring-1 ring-nexus-cobalt' 
                                            : 'bg-nexus-bg border-nexus-border hover:border-nexus-muted'
                                        }`}
                                    >
                                        <div>
                                            <div className={`font-bold text-sm ${isSelected ? 'text-nexus-cobalt' : 'text-nexus-text'}`}>
                                                {config.label}
                                            </div>
                                            <div className="flex gap-1.5 mt-1">
                                                {config.permissions.map(p => (
                                                    <span key={p} className="text-[9px] px-1 py-0.5 rounded bg-nexus-card border border-nexus-border text-nexus-muted uppercase tracking-wider">
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {isSelected && <Check size={16} className="text-nexus-cobalt" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <button 
                            onClick={handleSaveGeneral}
                            className="flex items-center gap-2 px-4 py-2 bg-nexus-cobalt hover:bg-blue-600 text-white text-xs font-bold rounded transition-colors"
                        >
                            <Save size={14} /> Salvar Alterações
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'subscription' && (
                <div className="space-y-6">
                    <div className={`p-6 rounded-lg border flex flex-col items-center justify-center text-center gap-4 ${planDetails.bg}`}>
                         <div className={`p-4 rounded-full bg-nexus-bg border border-nexus-border shadow-lg ${planDetails.color}`}>
                             <planDetails.icon size={48} />
                         </div>
                         <div>
                             <h3 className={`text-2xl font-bold ${planDetails.color}`}>Plano {planDetails.name}</h3>
                             <p className="text-nexus-muted text-sm mt-1">Sua assinatura está ativa.</p>
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded border border-nexus-border bg-nexus-bg">
                            <span className="text-xs text-nexus-muted uppercase font-bold block mb-1">Status</span>
                            <span className="text-sm font-medium text-green-500 flex items-center gap-1"><Check size={12}/> Ativo</span>
                        </div>
                        <div className="p-3 rounded border border-nexus-border bg-nexus-bg">
                            <span className="text-xs text-nexus-muted uppercase font-bold block mb-1">Renovação</span>
                            <span className="text-sm font-medium text-nexus-text">Mensal</span>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                         <button 
                            onClick={() => { onClose(); onOpenSubscription(); }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-nexus-text text-nexus-bg hover:bg-nexus-text/90 text-sm font-bold rounded transition-colors"
                        >
                            <CreditCard size={16} /> Gerenciar / Alterar Plano
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="space-y-4">
                    <div className="bg-nexus-accent/5 border border-nexus-accent/20 rounded p-4 mb-4">
                        <h4 className="text-xs font-bold text-nexus-accent mb-1 flex items-center gap-2">
                            <Lock size={12} /> Requisitos de Senha
                        </h4>
                        <ul className="text-[10px] text-nexus-muted list-disc list-inside space-y-0.5">
                            <li>Pelo menos uma letra maiúscula</li>
                            <li>Pelo menos uma letra minúscula</li>
                            <li>Pelo menos um número</li>
                            <li>Pelo menos um caractere especial</li>
                        </ul>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-nexus-muted">Senha Atual</label>
                        <input 
                            type="password"
                            value={passwordData.current}
                            onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                            className="w-full bg-nexus-bg border border-nexus-border rounded p-2.5 text-nexus-text focus:border-nexus-cobalt outline-none transition-colors text-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-nexus-muted">Nova Senha</label>
                        <input 
                            type="password"
                            value={passwordData.new}
                            onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                            className="w-full bg-nexus-bg border border-nexus-border rounded p-2.5 text-nexus-text focus:border-nexus-cobalt outline-none transition-colors text-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase font-bold text-nexus-muted">Confirmar Nova Senha</label>
                        <input 
                            type="password"
                            value={passwordData.confirm}
                            onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                            className="w-full bg-nexus-bg border border-nexus-border rounded p-2.5 text-nexus-text focus:border-nexus-cobalt outline-none transition-colors text-sm"
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                         <button 
                            onClick={handleSaveSecurity}
                            className="flex items-center gap-2 px-4 py-2 bg-nexus-cobalt hover:bg-blue-600 text-white text-xs font-bold rounded transition-colors"
                        >
                            <Save size={14} /> Alterar Senha
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};