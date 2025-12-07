import React, { useState } from 'react';
import { Project, Task } from '../types';
import { X, Save, Share2, Plus, Briefcase } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  onShare: (username: string, taskId?: string) => void;
  mode: 'create' | 'share';
  projectToShare?: Project | null;
  tasks?: Task[];
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, onShare, mode, projectToShare, tasks = [] }) => {
  const [inputVal, setInputVal] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!inputVal.trim()) return;
    if (mode === 'create') {
      onSave(inputVal);
    } else {
      // Pass task ID if selected
      onShare(inputVal, selectedTaskId || undefined);
    }
    setInputVal('');
    setSelectedTaskId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[450px] bg-nexus-card border border-nexus-border shadow-2xl rounded-lg flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-nexus-border">
          <h2 className="text-sm font-bold text-nexus-text font-mono tracking-tight uppercase">
            {mode === 'create' ? 'Novo Projeto' : `Compartilhar: ${projectToShare?.name}`}
          </h2>
          <button onClick={onClose} className="text-nexus-muted hover:text-nexus-text transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs uppercase font-bold text-nexus-muted mb-2 block">
                {mode === 'create' ? 'Nome do Projeto' : 'Nome do Usuário para Compartilhar'}
            </label>
            <input 
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full bg-nexus-bg border border-nexus-border rounded p-2.5 text-nexus-text focus:border-nexus-cobalt outline-none transition-colors"
                placeholder={mode === 'create' ? "Ex: Marketing Q3..." : "Ex: joaosilva..."}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                autoFocus
            />
          </div>

          {mode === 'share' && tasks.length > 0 && (
             <div className="animate-in fade-in duration-300">
                <label className="text-xs uppercase font-bold text-nexus-muted mb-2 block flex items-center gap-2">
                    <Briefcase size={12} /> Vincular a uma tarefa (Opcional)
                </label>
                <select 
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full bg-nexus-bg border border-nexus-border rounded p-2.5 text-nexus-text focus:border-nexus-cobalt outline-none text-sm"
                >
                    <option value="">-- Apenas compartilhar projeto --</option>
                    {tasks.map(task => (
                        <option key={task.id} value={task.id}>
                            {task.title}
                        </option>
                    ))}
                </select>
                <p className="text-[10px] text-nexus-muted mt-1.5">
                    Se selecionado, o usuário será definido como responsável por esta tarefa.
                </p>
             </div>
          )}
        </div>

        <div className="p-4 border-t border-nexus-border flex justify-end">
          <button 
            onClick={handleSubmit}
            disabled={!inputVal.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-nexus-cobalt hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded transition-colors"
          >
            {mode === 'create' ? <><Plus size={14} /> Criar</> : <><Share2 size={14} /> Compartilhar</>}
          </button>
        </div>
      </div>
    </div>
  );
};