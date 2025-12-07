import React, { useMemo, useState, useEffect } from 'react';
import { Task, Project } from '../types';
import { BarChart3, PieChart, TrendingUp, CheckCircle, AlertCircle, Clock, Filter, LayoutGrid, BrainCircuit, Tag, ArrowRight } from 'lucide-react';
import { STATUS_COLUMNS } from '../constants';

interface MonitoringDashboardProps {
  tasks: Task[]; // All tasks available to the user
  projects: Project[]; // All projects available to the user
  initialProjectId?: string | null;
}

interface PatternGroup {
    id: string;
    label: string;
    reason: string;
    tasks: Task[];
    icon: React.ElementType;
    colorClass: string;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ tasks, projects, initialProjectId }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Update local state if initialProjectId changes (e.g. sidebar click), 
  // but allow 'all' if no project is selected
  useEffect(() => {
    if (initialProjectId) {
        setSelectedProjectId(initialProjectId);
    } else {
        setSelectedProjectId('all');
    }
  }, [initialProjectId]);

  // Filter tasks based on selection
  const filteredTasks = useMemo(() => {
      if (selectedProjectId === 'all') return tasks;
      return tasks.filter(t => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  // Get current project object for display details
  const currentProject = projects.find(p => p.id === selectedProjectId);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const done = filteredTasks.filter(t => t.status === 'done').length;
    const inProgress = filteredTasks.filter(t => t.status === 'inprogress').length;
    const backlog = filteredTasks.filter(t => t.status === 'backlog').length;
    
    const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);
    
    // Priority Distribution
    const high = filteredTasks.filter(t => t.priority === 'High').length;
    const medium = filteredTasks.filter(t => t.priority === 'Medium').length;
    const low = filteredTasks.filter(t => t.priority === 'Low').length;

    return { total, done, inProgress, backlog, completionRate, high, medium, low };
  }, [filteredTasks]);

  // Calculations for bar charts
  const statusCounts = STATUS_COLUMNS.map(col => ({
    label: col.label,
    count: filteredTasks.filter(t => t.status === col.id).length,
    percent: filteredTasks.length ? (filteredTasks.filter(t => t.status === col.id).length / filteredTasks.length) * 100 : 0
  }));

  // --- INTELLIGENT PATTERN RECOGNITION ---
  const patternGroups = useMemo(() => {
    const groups: PatternGroup[] = [];
    const activeTasks = filteredTasks.filter(t => t.status !== 'done');

    // 1. High Priority Concentration (If > 2 items)
    const highPri = activeTasks.filter(t => t.priority === 'High');
    if (highPri.length >= 2) {
        groups.push({
            id: 'critical-focus',
            label: 'Foco Crítico',
            reason: `Detectadas ${highPri.length} tarefas de alta prioridade pendentes.`,
            tasks: highPri,
            icon: AlertCircle,
            colorClass: 'text-red-500 border-red-500/20 bg-red-500/5'
        });
    }

    // 2. Tag Clusters (If > 2 items with same tag)
    const tagMap = new Map<string, Task[]>();
    activeTasks.forEach(t => {
        t.tags.forEach(tag => {
            if (!tagMap.has(tag.text)) tagMap.set(tag.text, []);
            tagMap.get(tag.text)?.push(t);
        });
    });

    tagMap.forEach((grpTasks, tag) => {
        if (grpTasks.length >= 3) { // Threshold to avoid noise
             groups.push({
                id: `cluster-${tag}`,
                label: `Cluster: ${tag}`,
                reason: `Agrupamento temático identificado (${grpTasks.length} itens).`,
                tasks: grpTasks,
                icon: Tag,
                colorClass: 'text-nexus-cobalt border-nexus-cobalt/20 bg-nexus-cobalt/5'
            });
        }
    });

    // 3. Stagnation Risk (InProgress but low progress)
    const stalled = activeTasks.filter(t => t.status === 'inprogress' && t.progress < 25);
    if (stalled.length >= 2) {
         groups.push({
            id: 'stalled',
            label: 'Possível Gargalo',
            reason: 'Tarefas em progresso inicial (<25%) indicam possível bloqueio.',
            tasks: stalled,
            icon: Clock,
            colorClass: 'text-orange-500 border-orange-500/20 bg-orange-500/5'
        });
    }

    return groups;
  }, [filteredTasks]);

  if (projects.length === 0) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-nexus-muted">
            <BarChart3 size={48} className="mb-4 opacity-50" />
            <p>Nenhum projeto encontrado.</p>
        </div>
    )
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-nexus-bg">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-nexus-text tracking-tight mb-2 flex items-center gap-2">
                Monitoramento: 
                <span className="text-nexus-cobalt">
                    {selectedProjectId === 'all' ? 'Visão Geral (Todos)' : currentProject?.name}
                </span>
            </h2>
            <p className="text-nexus-muted">
                {selectedProjectId === 'all' 
                    ? `Analisando métricas consolidadas de ${projects.length} projetos.` 
                    : 'Análise em tempo real de métricas e evolução do projeto.'}
            </p>
        </div>

        {/* Project Filter Dropdown */}
        <div className="flex items-center gap-2 bg-nexus-card border border-nexus-border rounded-lg px-3 py-2 shadow-sm min-w-[250px]">
            <Filter size={16} className="text-nexus-muted" />
            <div className="flex-1">
                <label className="block text-[9px] uppercase font-bold text-nexus-muted leading-none mb-0.5">Filtrar por Projeto</label>
                <select 
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-transparent text-sm font-medium text-nexus-text outline-none cursor-pointer"
                >
                    <option value="all">Todos os Projetos</option>
                    <option disabled className="text-xs bg-nexus-bg text-nexus-muted">──────────</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>
            <LayoutGrid size={16} className="text-nexus-muted opacity-50" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-nexus-card border border-nexus-border p-6 rounded-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle size={64} className="text-nexus-cobalt" />
            </div>
            <p className="text-sm font-medium text-nexus-muted uppercase tracking-wider mb-2">Conclusão</p>
            <div className="flex items-end gap-2">
                <span className="text-4xl font-mono font-bold text-nexus-cobalt">{stats.completionRate}%</span>
                <span className="text-xs text-nexus-muted mb-1.5">do escopo total</span>
            </div>
            <div className="w-full bg-nexus-bg h-1.5 mt-4 rounded-full overflow-hidden">
                <div className="bg-nexus-cobalt h-full" style={{ width: `${stats.completionRate}%` }}></div>
            </div>
        </div>

        <div className="bg-nexus-card border border-nexus-border p-6 rounded-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={64} className="text-nexus-accent" />
            </div>
            <p className="text-sm font-medium text-nexus-muted uppercase tracking-wider mb-2">Em Andamento</p>
            <div className="flex items-end gap-2">
                <span className="text-4xl font-mono font-bold text-nexus-accent">{stats.inProgress}</span>
                <span className="text-xs text-nexus-muted mb-1.5">tarefas ativas</span>
            </div>
        </div>

        <div className="bg-nexus-card border border-nexus-border p-6 rounded-lg relative overflow-hidden group">
             <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clock size={64} className="text-white" />
            </div>
            <p className="text-sm font-medium text-nexus-muted uppercase tracking-wider mb-2">Backlog</p>
            <div className="flex items-end gap-2">
                <span className="text-4xl font-mono font-bold text-nexus-text">{stats.backlog}</span>
                <span className="text-xs text-nexus-muted mb-1.5">aguardando início</span>
            </div>
        </div>

        <div className="bg-nexus-card border border-nexus-border p-6 rounded-lg relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertCircle size={64} className="text-red-500" />
            </div>
            <p className="text-sm font-medium text-nexus-muted uppercase tracking-wider mb-2">Alta Prioridade</p>
            <div className="flex items-end gap-2">
                <span className="text-4xl font-mono font-bold text-red-500">{stats.high}</span>
                <span className="text-xs text-nexus-muted mb-1.5">itens críticos</span>
            </div>
        </div>
      </div>

      {/* Smart Patterns Section */}
      {patternGroups.length > 0 && (
          <div className="mb-8 animate-in slide-in-from-bottom-5 duration-500">
             <h3 className="text-lg font-bold text-nexus-text mb-4 flex items-center gap-2">
                <BrainCircuit size={20} className="text-nexus-cobalt" />
                Insights e Padrões Inteligentes
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {patternGroups.map(group => (
                     <div key={group.id} className={`p-4 rounded-lg border ${group.colorClass} backdrop-blur-sm transition-all hover:scale-[1.01]`}>
                         <div className="flex items-start justify-between mb-3">
                             <div className="flex items-center gap-2">
                                 <group.icon size={18} className="opacity-80" />
                                 <h4 className="font-bold text-sm">{group.label}</h4>
                             </div>
                             <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 border border-white/10">
                                 {group.tasks.length}
                             </span>
                         </div>
                         <p className="text-xs opacity-80 mb-3 leading-relaxed">{group.reason}</p>
                         <div className="space-y-1">
                             {group.tasks.slice(0, 3).map(t => (
                                 <div key={t.id} className="text-[10px] truncate flex items-center gap-1.5 opacity-70">
                                     <ArrowRight size={8} /> {t.title}
                                 </div>
                             ))}
                             {group.tasks.length > 3 && (
                                 <div className="text-[9px] pl-3.5 opacity-50 italic">
                                     + {group.tasks.length - 3} outros itens...
                                 </div>
                             )}
                         </div>
                     </div>
                 ))}
             </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Distribution Chart */}
        <div className="bg-nexus-card border border-nexus-border p-6 rounded-lg">
            <h3 className="text-lg font-bold text-nexus-text mb-6 flex items-center gap-2">
                <BarChart3 size={20} className="text-nexus-cobalt" />
                Distribuição por Status
            </h3>
            <div className="space-y-4">
                {statusCounts.map((item, idx) => (
                    <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-nexus-text">{item.label}</span>
                            <span className="text-nexus-muted font-mono">{item.count} ({Math.round(item.percent)}%)</span>
                        </div>
                        <div className="w-full bg-nexus-bg h-3 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-nexus-cobalt transition-all duration-1000" 
                                style={{ width: `${item.percent}%`, opacity: 0.5 + (idx * 0.1) }} // gradient effect
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Priority Radar/Pie Simulation */}
        <div className="bg-nexus-card border border-nexus-border p-6 rounded-lg flex flex-col">
             <h3 className="text-lg font-bold text-nexus-text mb-6 flex items-center gap-2">
                <PieChart size={20} className="text-nexus-accent" />
                Carga de Trabalho (Prioridade)
            </h3>
            
            <div className="flex-1 flex items-center justify-center gap-8">
                {/* Visual Representation using generic CSS bars as simple visualizer */}
                <div className="flex items-end gap-6 h-40">
                    <div className="flex flex-col items-center gap-2">
                         <div className="w-12 bg-neutral-700/50 rounded-t-lg relative group transition-all hover:bg-neutral-600" style={{ height: `${(stats.low / (stats.total || 1)) * 100}%`, minHeight: '4px' }}>
                             <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded">{stats.low}</div>
                         </div>
                         <span className="text-xs text-nexus-muted font-medium">Baixa</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                         <div className="w-12 bg-nexus-cobalt rounded-t-lg relative group transition-all hover:bg-blue-500" style={{ height: `${(stats.medium / (stats.total || 1)) * 100}%`, minHeight: '4px' }}>
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded">{stats.medium}</div>
                         </div>
                         <span className="text-xs text-nexus-muted font-medium">Média</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                         <div className="w-12 bg-nexus-accent rounded-t-lg relative group transition-all hover:bg-amber-400" style={{ height: `${(stats.high / (stats.total || 1)) * 100}%`, minHeight: '4px' }}>
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-black text-white text-xs px-2 py-1 rounded">{stats.high}</div>
                         </div>
                         <span className="text-xs text-nexus-muted font-medium">Alta</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};