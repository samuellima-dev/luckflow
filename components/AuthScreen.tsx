
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, WifiOff, ShieldCheck, Lock, User as UserIcon, Mail, KeyRound } from 'lucide-react';
import { User } from '../types';
import { supabase } from '../supabaseClient';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'register' | 'recovery'>('login');
  
  const [formData, setFormData] = useState({
      username: '',
      password: '',
      email: '',
      role: 'viewer' as 'admin' | 'editor' | 'viewer'
  });

  const [recoveryData, setRecoveryData] = useState({
      username: '',
      email: '',
      newPassword: ''
  });
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPasswordInput, setShowNewPasswordInput] = useState(false);

  // Auto-seed Samuel_IA logic
  useEffect(() => {
    const checkAndSeedSamuel = async () => {
        try {
            // Check if Samuel_IA exists
            const { data } = await supabase.from('profiles').select('username').eq('username', 'Samuel_IA').single();
            
            // Only insert if user does NOT exist. 
            // We removed the 'else' block that was forcing the password reset on every reload.
            if (!data) {
                await supabase.from('profiles').insert([{
                    username: 'Samuel_IA',
                    password: 'ChangeMe123!', 
                    email: 'samuellucas2010s@gmail.com',
                    role: 'admin',
                    created_at: new Date().toISOString()
                }]);
            } 
        } catch (e) {
            console.warn("Auto-seed check failed (likely offline or permission issue)", e);
        }
    };
    checkAndSeedSamuel();
  }, []);

  const validatePassword = (pwd: string) => {
      const hasUpper = /[A-Z]/.test(pwd);
      const hasLower = /[a-z]/.test(pwd);
      const hasNumber = /[0-9]/.test(pwd);
      const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
      return hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleRecovery = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccessMsg('');
      setLoading(true);

      if (!recoveryData.username || !recoveryData.email) {
          setError("Preencha usuário e e-mail.");
          setLoading(false);
          return;
      }

      // Special Check for Samuel_IA bypass
      const isSamuel = recoveryData.username === 'Samuel_IA' && recoveryData.email === 'samuellucas2010s@gmail.com';

      if (!showNewPasswordInput) {
          // STEP 1: VERIFY USER
          try {
            let userFound = false;

            if (isSamuel) {
                userFound = true;
            } else {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('username', recoveryData.username)
                    .eq('email', recoveryData.email)
                    .single();
                if (data) userFound = true;
            }

            if (userFound) {
                setShowNewPasswordInput(true);
                setSuccessMsg("Conta localizada! Digite a nova senha abaixo.");
            } else {
                setError("Dados não conferem com nossos registros.");
            }
          } catch (err) {
              // Fallback for demo/offline
              if (isSamuel) {
                  setShowNewPasswordInput(true);
                  setSuccessMsg("Conta localizada (Modo Offline)! Digite a nova senha.");
              } else {
                  setError("Erro ao buscar conta ou dados inválidos.");
              }
          }
          setLoading(false);
      } else {
          // STEP 2: RESET PASSWORD
          if (!validatePassword(recoveryData.newPassword)) {
              setError('A senha deve conter: Maiúscula, minúscula, número e especial.');
              setLoading(false);
              return;
          }

          try {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ password: recoveryData.newPassword })
                .eq('username', recoveryData.username);

              if (updateError && !isSamuel) throw updateError;

              setSuccessMsg("Senha redefinida com sucesso! Faça login.");
              setTimeout(() => {
                  setView('login');
                  setFormData(prev => ({ ...prev, username: recoveryData.username, password: '' }));
                  setRecoveryData({ username: '', email: '', newPassword: '' });
                  setShowNewPasswordInput(false);
              }, 2000);

          } catch (err) {
               if (isSamuel) {
                   setSuccessMsg("Senha redefinida localmente! Faça login.");
                   setTimeout(() => setView('login'), 2000);
               } else {
                   setError("Erro ao redefinir senha.");
               }
          }
          setLoading(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (view === 'login') {
        if (!formData.username.trim() || !formData.password) {
            setError('Preencha usuário e senha.');
            setLoading(false);
            return;
        }

        // --- MASTER RESCUE BYPASS ---
        // Ensures access for the owner even if DB fails OR if using the emergency backdoor
        if (formData.username === 'Samuel_IA' && formData.password === 'admin') {
             onLogin({ 
                id: 'Samuel_IA', 
                username: 'Samuel_IA', 
                role: 'admin',
                email: 'samuellucas2010s@gmail.com'
            });
            setLoading(false);
            return;
        }
    } else if (view === 'register') {
         if (!formData.username || !formData.password || !formData.email) {
             setError('Todos os campos são obrigatórios.');
             setLoading(false);
             return;
         }
         if (!validatePassword(formData.password)) {
            setError('A senha deve conter: Maiúscula, minúscula, número e caractere especial.');
            setLoading(false);
            return;
        }
    }

    try {
      if (view === 'register') {
        // 1. Check if user exists
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', formData.username)
            .single();

        if (existingUser) {
          setError('Usuário já existe. Tente fazer login.');
          setLoading(false);
          return;
        }

        // 2. Register new user
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ 
              username: formData.username,
              password: formData.password,
              email: formData.email,
              role: formData.role,
              created_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
        
        onLogin({ 
            id: formData.username, 
            username: formData.username, 
            role: formData.role,
            email: formData.email
        }); 

      } else {
        // LOGIN LOGIC
        const { data: userRecord, error: loginError } = await supabase
            .from('profiles')
            .select('*')
            .eq('username', formData.username)
            .eq('password', formData.password)
            .single();

        if (loginError || !userRecord) {
            setError('Usuário ou senha incorretos.');
            setLoading(false);
            return;
        }

        onLogin({ 
            id: userRecord.username, 
            username: userRecord.username,
            role: userRecord.role || 'viewer',
            avatarUrl: userRecord.avatar_url || undefined,
            whatsapp: userRecord.whatsapp || undefined,
            email: userRecord.email || undefined
        });
      }

    } catch (err: any) {
      console.warn("Supabase Action Failed:", err);
      // OFFLINE FALLBACK
      if (err.message && (err.message.includes('fetch') || err.message.includes('connection'))) {
          console.log("Entering Offline Mode...");
          onLogin({ 
              id: formData.username, 
              username: formData.username,
              role: 'admin', // Default to admin in offline
              email: formData.email
          });
      } else {
          setError('Erro na conexão. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER RECOVERY VIEW ---
  if (view === 'recovery') {
      return (
        <div className="flex h-screen w-screen bg-nexus-bg items-center justify-center animate-in fade-in duration-300">
            <div className="w-96 bg-nexus-card border border-nexus-border p-8 rounded-lg shadow-2xl relative overflow-hidden">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 bg-nexus-accent rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-amber-900/50">
                        <KeyRound size={24} className="text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-nexus-text">Recuperar Conta</h1>
                    <p className="text-xs text-nexus-muted mt-2 text-center">
                        {showNewPasswordInput ? "Defina sua nova senha." : "Confirme seus dados para continuar."}
                    </p>
                </div>

                <form onSubmit={handleRecovery} className="space-y-4">
                    {!showNewPasswordInput ? (
                        <>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-nexus-muted flex items-center gap-1">
                                    <UserIcon size={10} /> Usuário
                                </label>
                                <input 
                                    type="text" 
                                    value={recoveryData.username}
                                    onChange={(e) => setRecoveryData({...recoveryData, username: e.target.value})}
                                    className="w-full bg-nexus-bg border border-nexus-border rounded p-2.5 text-nexus-text focus:border-nexus-cobalt outline-none text-sm"
                                    placeholder="Nome de usuário..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-nexus-muted flex items-center gap-1">
                                    <Mail size={10} /> Email
                                </label>
                                <input 
                                    type="email" 
                                    value={recoveryData.email}
                                    onChange={(e) => setRecoveryData({...recoveryData, email: e.target.value})}
                                    className="w-full bg-nexus-bg border border-nexus-border rounded p-2.5 text-nexus-text focus:border-nexus-cobalt outline-none text-sm"
                                    placeholder="Email cadastrado..."
                                />
                            </div>
                        </>
                    ) : (
                        <div className="space-y-1 animate-in fade-in slide-in-from-right-4">
                            <label className="text-[10px] uppercase font-bold text-nexus-muted flex items-center gap-1">
                                <Lock size={10} /> Nova Senha
                            </label>
                            <input 
                                type="password" 
                                value={recoveryData.newPassword}
                                onChange={(e) => setRecoveryData({...recoveryData, newPassword: e.target.value})}
                                className="w-full bg-nexus-bg border border-nexus-border rounded p-2.5 text-nexus-text focus:border-nexus-cobalt outline-none text-sm"
                                placeholder="Nova senha forte..."
                            />
                        </div>
                    )}

                    {error && <p className="text-red-500 text-xs flex items-center gap-1 bg-red-500/10 p-2 rounded">{error}</p>}
                    {successMsg && <p className="text-green-500 text-xs flex items-center gap-1 bg-green-500/10 p-2 rounded">{successMsg}</p>}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-nexus-cobalt hover:bg-blue-600 text-white font-bold py-2.5 rounded transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : (showNewPasswordInput ? 'Redefinir Senha' : 'Verificar Dados')}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button 
                        onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }}
                        className="text-xs text-nexus-muted hover:text-nexus-text underline"
                    >
                        Voltar para Login
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // --- RENDER LOGIN/REGISTER VIEW ---
  return (
    <div className="flex h-screen w-screen bg-nexus-bg items-center justify-center animate-in fade-in duration-300">
      <div className="w-96 bg-nexus-card border border-nexus-border p-8 rounded-lg shadow-2xl relative overflow-hidden">
        
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-nexus-cobalt/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-nexus-accent/10 rounded-full blur-3xl"></div>

        <div className="flex flex-col items-center mb-6 relative z-10">
          <div className="w-12 h-12 bg-nexus-cobalt rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50">
             <Sparkles size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-nexus-text font-mono tracking-tight">LUCKFLOW</h1>
          <p className="text-xs text-nexus-muted mt-2 uppercase tracking-widest text-center">Gestão & Tecnologia</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-nexus-muted block flex items-center gap-1">
                <UserIcon size={10} /> Usuário
            </label>
            <input 
              type="text" 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className="w-full bg-nexus-bg border border-nexus-border rounded p-2.5 text-nexus-text focus:border-nexus-cobalt outline-none transition-colors text-sm"
              placeholder="Digite seu usuário..."
              disabled={loading}
            />
          </div>

          {view === 'register' && (
            <>
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] uppercase font-bold text-nexus-muted block flex items-center gap-1">
                        <Mail size={10} /> Email
                    </label>
                    <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-nexus-bg border border-nexus-border rounded p-2.5 text-nexus-text focus:border-nexus-cobalt outline-none transition-colors text-sm"
                        placeholder="seu@email.com"
                        disabled={loading}
                    />
                </div>
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] uppercase font-bold text-nexus-muted block flex items-center gap-1">
                        <ShieldCheck size={10} /> Cargo
                    </label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                        className="w-full bg-nexus-bg border border-nexus-border rounded p-2.5 text-nexus-text focus:border-nexus-cobalt outline-none transition-colors text-sm cursor-pointer"
                    >
                        <option value="admin">Administrador</option>
                        <option value="editor">Gerente</option>
                        <option value="viewer">Usuário</option>
                    </select>
                </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-nexus-muted block flex items-center gap-1">
                <Lock size={10} /> Senha
            </label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-nexus-bg border border-nexus-border rounded p-2.5 text-nexus-text focus:border-nexus-cobalt outline-none transition-colors text-sm"
              placeholder="********"
              disabled={loading}
            />
            {view === 'register' && (
                <p className="text-[9px] text-nexus-muted leading-tight mt-1">
                    Requer: Maiúscula, minúscula, número e caractere especial.
                </p>
            )}
          </div>
          
          {error && <p className="text-red-500 text-xs flex items-center gap-1 bg-red-500/10 p-2 rounded border border-red-500/20"><WifiOff size={12}/> {error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-nexus-cobalt hover:bg-blue-600 text-white font-bold py-2.5 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-900/20 mt-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (
                <>
                    {view === 'register' ? 'Criar Conta' : 'Entrar'} <ArrowRight size={16} />
                </>
            )}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2 relative z-10">
          <button 
            onClick={() => { 
                const newView = view === 'login' ? 'register' : 'login';
                setView(newView);
                setError(''); 
                setFormData({...formData, role: 'viewer', password: ''}) 
            }}
            className="text-xs text-nexus-muted hover:text-nexus-text underline"
          >
            {view === 'login' ? 'Não tem conta? Registrar' : 'Já tem conta? Entrar'}
          </button>
          
          {view === 'login' && (
              <button 
                onClick={() => { setView('recovery'); setError(''); setSuccessMsg(''); setRecoveryData({ username: '', email: '', newPassword: '' }); setShowNewPasswordInput(false); }}
                className="text-[10px] text-nexus-cobalt hover:underline opacity-80"
              >
                Esqueci minha senha
              </button>
          )}
        </div>
      </div>
    </div>
  );
};
