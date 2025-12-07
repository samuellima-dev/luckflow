
import React, { useMemo, useState } from 'react';
import { Task, Project, Status, ViewMode } from '../types';
import { TrendingUp, Clock, CheckCircle2, Filter, Eye, Layout, PlusCircle, Kanban, List, Table2 } from 'lucide-react';
import { STATUS_COLUMNS } from '../constants';

interface MetricsHeaderProps {
  tasks: Task[];
  project?: Project;
  availableAssignees?: string[];
  currentFilter?: string | null;
  onFilterChange?: (assignee: string | null) => void;
  hiddenColumns: Status[];
  onToggleColumn: (status: Status) => void;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const MetricsHeader: React.FC<MetricsHeaderProps> = ({ 
  tasks, 
  project, 
  availableAssignees = [], 
  currentFilter, 
  onFilterChange,
  hiddenColumns,
  onToggleColumn,
  currentView,
  onViewChange
}) => {
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'done').length;
    
    // Calculate simple completion rate
    const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);
    
    // Calculate "velocity" (mocked based on progress of active tasks)
    const activeTasks = tasks.filter(t => t.status === 'inprogress' || t.status === 'review');
    const velocity = activeTasks.reduce((acc, curr) => acc + curr.progress, 0) / (activeTasks.length || 1);

    return [
      { label: 'Tarefas Ativas', value: total - done, icon: Clock, color: 'text-nexus-text' },
      { label: 'Conclusão', value: `${completionRate}%`, icon: CheckCircle2, color: 'text-nexus-cobalt' },
      { label: 'Velocidade', value: Math.round(velocity), icon: TrendingUp, color: 'text-nexus-accent' },
    ];
  }, [tasks]);

  return (
    <header className="h-20 border-b border-nexus-border bg-nexus-bg/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
      <div>
        <h1 className="text-xl font-bold text-nexus-text tracking-tight flex items-center gap-2">
          {project ? project.name : 'Dashboard'} <span className="text-nexus-muted font-light hidden sm:inline-block">Overview</span>
        </h1>
        <p className="text-xs text-nexus-muted font-mono mt-0.5">
           {project ? (project.sharedWith.length > 0 ? `Compartilhado com ${project.sharedWith.length} usuários` : 'Privado') : 'Selecione um projeto'}
        </p>
      </div>

      <div className="flex items-center gap-6">
        
        {/* Actions Group */}
        <div className="flex items-center gap-3 border-r border-nexus-border pr-6">
            
            {/* View Switcher */}
            <div className="flex bg-nexus-card border border-nexus-border rounded-md p-0.5">
                <button 
                    onClick={() => onViewChange('board')}
                    className={`p-1.5 rounded transition-all ${currentView === 'board' ? 'bg-nexus-cobalt text-white shadow-sm' : 'text-nexus-muted hover:text-nexus-text'}`}
                    title="Modo Board (Kanban)"
                >
                    <Kanban size={14} />
                </button>
                <button 
                    onClick={() => onViewChange('list')}
                    className={`p-1.5 rounded transition-all ${currentView === 'list' ? 'bg-nexus-cobalt text-white shadow-sm' : 'text-nexus-muted hover:text-nexus-text'}`}
                    title="Modo Lista"
                >
                    <List size={14} />
                </button>
                <button 
                    onClick={() => onViewChange('table')}
                    className={`p-1.5 rounded transition-all ${currentView === 'table' ? 'bg-nexus-cobalt text-white shadow-sm' : 'text-nexus-muted hover:text-nexus-text'}`}
                    title="Modo Tabela"
                >
                    <Table2 size={14} />
                </button>
            </div>

            <div className="h-4 w-px bg-nexus-border"></div>

            {/* Restore Columns Button (Only in Board Mode) */}
            {currentView === 'board' && hiddenColumns.length > 0 && (
                <div className="relative">
                    <button 
                        onClick={() => setShowColumnMenu(!showColumnMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-nexus-card border border-nexus-border rounded-md shadow-sm hover:border-nexus-cobalt transition-colors text-xs font-medium text-nexus-text"
                    >
                        <Eye size={14} className="text-nexus-cobalt" />
                        <span className="hidden sm:inline">Colunas ({hiddenColumns.length})</span>
                    </button>

                    {showColumnMenu && (
                        <div className="absolute top-full mt-2 right-0 w-48 bg-nexus-card border border-nexus-border rounded-lg shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="text-[10px] uppercase font-bold text-nexus-muted mb-2 px-2">Restaurar Colunas</div>
                            {STATUS_COLUMNS.filter(col => hiddenColumns.includes(col.id)).map(col => (
                                <button
                                    key={col.id}
                                    onClick={() => { onToggleColumn(col.id); if(hiddenColumns.length === 1) setShowColumnMenu(false); }}
                                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-nexus-bg rounded text-xs text-nexus-text"
                                >
                                    <PlusCircle size={12} className="text-nexus-cobalt" />
                                    {col.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Assignee Filter */}
            {onFilterChange && availableAssignees.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-nexus-card border border-nexus-border rounded-md shadow-sm group hover:border-nexus-cobalt transition-colors">
                    <Filter size={14} className={`text-nexus-muted ${currentFilter ? 'text-nexus-cobalt' : ''}`} />
                    <select 
                        value={currentFilter || ''} 
                        onChange={(e) => onFilterChange(e.target.value || null)}
                        className="bg-transparent text-xs font-medium text-nexus-text outline-none cursor-pointer min-w-[100px]"
                    >
                        <option value="">Membros</option>
                        {availableAssignees.map(user => (
                            <option key={String(user)} value={String(user)}>
                                {String(user)}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-8 hidden lg:flex">
            {metrics.map((metric, idx) => (
            <div key={idx} className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-mono text-nexus-muted">{metric.label}</span>
                    <metric.icon size={12} className={metric.color} />
                </div>
                <span className={`text-xl font-bold font-mono ${metric.color}`}>{metric.value}</span>
            </div>
            ))}
        </div>
      </div>
      
      {/* Click outside closer for menu (simple implementation) */}
      {showColumnMenu && (
          <div className="fixed inset-0 z-40" onClick={() => setShowColumnMenu(false)}></div>
      )}
    </header>
  );
};
