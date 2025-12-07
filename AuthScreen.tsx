
import React, { useState } from 'react';
import { LayoutGrid, ArrowRight, Loader2 } from 'lucide-react';
import { User } from './types';
import { supabase } from './supabaseClient';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim()) {
      setError('Por favor digite um usuário.');
      setLoading(false);
      return;
    }

    try {
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
         throw fetchError;
      }

      if (isRegister) {
        if (existingUser) {
          setError('Usuário já existe. Tente fazer login.');
          setLoading(false);
          return;
        }

        // Create new user
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ username }]);

        if (insertError) throw insertError;

        onLogin({ id: username, username, role: 'viewer' }); // Default role added to satisfy types
      } else {
        if (!existingUser) {
          setError('Usuário não encontrado. Crie uma conta.');
          setLoading(false);
          return;
        }
        onLogin({ id: existingUser.username, username: existingUser.username, role: existingUser.role || 'viewer' });
      }

    } catch (err: any) {
      console.error(err);
      setError('Erro ao conectar com o banco de dados. Verifique as credenciais no código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-nexus-bg items-center justify-center">
      <div className="w-96 bg-nexus-card border border-nexus-border p-8 rounded-lg shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-nexus-cobalt rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50">
             <LayoutGrid size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-nexus-text font-mono tracking-tight">LUCK OS</h1>
          <p className="text-xs text-nexus-muted mt-2 uppercase tracking-widest text-center">Dashboard de Acompanhamento de Projetos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase font-bold text-nexus-muted mb-1 block">Usuário</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-nexus-bg border border-nexus-border rounded p-3 text-nexus-text focus:border-nexus-cobalt outline-none transition-colors"
              placeholder="Digite seu usuário..."
              disabled={loading}
            />
          </div>
          
          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-nexus-cobalt hover:bg-blue-600 text-white font-bold py-3 rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : (
                <>
                    {isRegister ? 'Criar Conta' : 'Entrar'} <ArrowRight size={16} />
                </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-xs text-nexus-muted hover:text-nexus-text underline"
          >
            {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Registrar'}
          </button>
        </div>
      </div>
    </div>
  );
};
